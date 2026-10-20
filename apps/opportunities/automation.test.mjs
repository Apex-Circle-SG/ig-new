import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { normalize } from './catalog.mjs';
import { ingestSource } from './worker.mjs';
import {
  publishDaily,
  encryptState,
  decryptState,
  singaporeDay,
  postText,
  linkedinCommentary,
  postScore,
  choosePost,
} from './social.mjs';
function database() {
  const db = new DatabaseSync(':memory:');
  for (const file of ['0001_catalog.sql', '0002_automation.sql'])
    db.exec(readFileSync(new URL(`./migrations/${file}`, import.meta.url), 'utf8'));
  return {
    db,
    prepare(sql) {
      let values = [];
      return {
        bind(...args) {
          values = args;
          return this;
        },
        async first() {
          return db.prepare(sql).get(...values) || null;
        },
        async all() {
          return { results: db.prepare(sql).all(...values) };
        },
        async run() {
          const result = db.prepare(sql).run(...values);
          return { meta: { changes: Number(result.changes) } };
        },
      };
    },
    async batch(statements) {
      return Promise.all(statements.map((s) => s.run()));
    },
  };
}
function source(DB, id = 'greenhouse-gitlab') {
  DB.db
    .prepare(
      'INSERT INTO sources(id,name,category,url,access_method,status,policy) VALUES(?,?,?,?,?,?,?)',
    )
    .run(id, 'GitLab', 'jobs', 'https://example.com', 'API', 'enabled', 'test');
  DB.db.prepare('UPDATE sources SET last_success=? WHERE id=?').run(new Date().toISOString(), id);
}
function job(DB, id = 'role-1') {
  DB.db
    .prepare(
      "INSERT INTO opportunities(id,source_id,external_id,title,organization,category,location,work_mode,reward,skills,excerpt,source_url,published_at,last_seen_at,status,fingerprint,employment_type) VALUES(?,?,?,?,?,'jobs','Remote, UK','remote','Pay not supplied','[]','Build customer-facing services and improve reliability across our platform. Work with engineering teams to ship and maintain production features.',?,?,?,'active',?,'Contract')",
    )
    .run(
      id,
      'greenhouse-gitlab',
      id,
      'Remote engineer',
      'Example',
      'https://job-boards.greenhouse.io/gitlab/jobs/1',
      new Date().toISOString(),
      new Date().toISOString(),
      `fp-${id}`,
    );
}
function env(DB) {
  return {
    DB,
    LINKEDIN_ENABLED: 'true',
    LINKEDIN_STATE_KEY: 'test-state-key',
    LINKEDIN_CREDENTIALS: JSON.stringify({
      person_urn: 'urn:li:person:test',
      access_token: 'test-token',
      access_token_expires_at: Date.now() / 1000 + 3 * 86400,
      refresh_token_expires_at: Date.now() / 1000 + 300 * 86400,
    }),
  };
}
test('remote employer filters reject onsite and hybrid and preserve old still-listed jobs', () => {
  const base = {
    id: 'one',
    title: 'Engineer',
    jobUrl: 'https://jobs.ashbyhq.com/zapier/one',
    publishedAt: '2021-01-01',
    isListed: true,
    location: 'UK',
    isRemote: true,
    workplaceType: 'Remote',
    employmentType: 'Contract',
  };
  const rows = normalize('ashby-zapier', {
    jobs: [
      base,
      { ...base, id: 'two', workplaceType: 'Hybrid' },
      { ...base, id: 'three', isListed: false },
      { ...base, id: 'four', jobUrl: 'https://evil.example/one' },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].location, 'UK');
  assert.equal(rows[0].employment_type, 'Contract');
  assert.equal(rows[0].published_at.slice(0, 4), '2021');
});
test('a bounty label alone is insufficient and reported amounts are marked unverified', () => {
  const item = {
    id: 1,
    title: '$250: implement parser',
    html_url: 'https://github.com/tenstorrent/tt-metal/issues/1',
    state: 'open',
    created_at: new Date().toISOString(),
  };
  const rows = normalize('github-bounties', {
    items: [
      item,
      { ...item, id: 2, title: 'Unfunded enhancement' },
      { ...item, id: 3, state: 'closed' },
    ],
  });
  assert.equal(rows.length, 1);
  assert.match(rows[0].reward, /funding unverified/);
  assert.equal(rows[0].category, 'bounties');
});
test('complete empty employer snapshots close old records; failed requests retain them', async () => {
  const DB = database();
  source(DB);
  job(DB);
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('unavailable', { status: 503 });
    const failed = await ingestSource({ DB }, 'greenhouse-gitlab');
    assert.equal(failed.status, 'failed');
    assert.equal(DB.db.prepare('SELECT status FROM opportunities').get().status, 'active');
    globalThis.fetch = async () => Response.json({ jobs: [], meta: { total: 0 } });
    const result = await ingestSource({ DB }, 'greenhouse-gitlab');
    assert.equal(result.status, 'success');
    assert.equal(DB.db.prepare('SELECT status FROM opportunities').get().status, 'closed');
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});
test('LinkedIn previews are read-only; a scheduled day publishes once and records a receipt', async () => {
  const DB = database();
  source(DB);
  job(DB);
  let calls = 0;
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      calls++;
      return String(url).includes('api.linkedin.com')
        ? new Response(null, { status: 201, headers: { 'x-restli-id': 'urn:li:share:123' } })
        : new Response(null, { status: 200 });
    };
    const config = env(DB);
    const preview = await publishDaily(config, Date.now(), { dryRun: true });
    assert.equal(preview.status, 'preview');
    assert.equal(calls, 0);
    assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM social_posts').get().n, 0);
    const result = await publishDaily(config);
    assert.equal(result.status, 'published');
    assert.equal(calls, 2);
    assert.equal((await publishDaily(config)).status, 'already-recorded');
    assert.equal(calls, 2);
    assert.equal(
      DB.db.prepare('SELECT post_id FROM social_posts').get().post_id,
      'urn:li:share:123',
    );
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});
test('ambiguous LinkedIn timeouts are held and never automatically retried', async () => {
  const DB = database();
  source(DB);
  job(DB);
  let calls = 0;
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      calls++;
      if (String(url).includes('api.linkedin.com')) throw new Error('timeout');
      return new Response(null, { status: 200 });
    };
    const config = env(DB);
    assert.equal((await publishDaily(config)).status, 'uncertain');
    assert.equal((await publishDaily(config)).status, 'already-recorded');
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});
test('credential state is encrypted and tampering fails; Singapore day boundary is explicit', async () => {
  const encrypted = await encryptState({ access_token: 'do-not-leak' }, 'secret');
  assert(!encrypted.includes('do-not-leak'));
  assert.equal((await decryptState(encrypted, 'secret')).access_token, 'do-not-leak');
  await assert.rejects(() => decryptState(encrypted, 'wrong'));
  assert.equal(singaporeDay(Date.parse('2026-10-19T16:01:00Z')), '2026-10-20');
  const post = postText({
    kind: 'method',
    id: 'test',
    title: 'A creative method',
    description: 'An idea',
  });
  assert.match(post, /not an available paid assignment/);
  assert.match(post, /https:\/\/insightginie\.com\/earn\/test\/\n/);
});

test('expired access tokens renew and the replacement is encrypted before publishing', async () => {
  const DB = database();
  source(DB);
  job(DB);
  const config = env(DB);
  const value = JSON.parse(config.LINKEDIN_CREDENTIALS);
  value.access_token_expires_at = 0;
  value.refresh_token = 'refresh-test';
  value.client_id = 'client-test';
  value.client_secret = 'secret-test';
  config.LINKEDIN_CREDENTIALS = JSON.stringify(value);
  const original = globalThis.fetch;
  let renewals = 0;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes('/oauth/v2/accessToken')) {
        renewals++;
        return Response.json({
          access_token: 'renewed-test-access',
          expires_in: 5184000,
          refresh_token: 'renewed-refresh',
          refresh_token_expires_in: 30000000,
        });
      }
      return String(url).includes('api.linkedin.com')
        ? new Response(null, { status: 201, headers: { 'x-restli-id': 'urn:li:share:refreshed' } })
        : new Response(null, { status: 200 });
    };
    assert.equal((await publishDaily(config)).status, 'published');
    assert.equal(renewals, 1);
    const row = DB.db
      .prepare("SELECT data FROM automation_state WHERE id='linkedin_credentials'")
      .get();
    assert(!row.data.includes('renewed-test-access'));
    const restored = await decryptState(row.data, config.LINKEDIN_STATE_KEY);
    assert.equal(restored.access_token, 'renewed-test-access');
    assert.equal(restored.refresh_token, 'renewed-refresh');
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});
test('concurrent scheduled invocations claim the day once', async () => {
  const DB = database();
  source(DB);
  job(DB);
  const original = globalThis.fetch;
  let sends = 0;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes('api.linkedin.com')) {
        sends++;
        return new Response(null, { status: 201, headers: { 'x-restli-id': 'urn:li:share:once' } });
      }
      return new Response(null, { status: 200 });
    };
    const results = await Promise.all([publishDaily(env(DB)), publishDaily(env(DB))]);
    assert.equal(results.filter((r) => r.status === 'published').length, 1);
    assert.equal(sends, 1);
    assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM social_posts').get().n, 1);
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});
test('revoked refresh requests fail without publishing or exposing response data', async () => {
  const DB = database();
  source(DB);
  job(DB);
  const config = env(DB);
  const value = JSON.parse(config.LINKEDIN_CREDENTIALS);
  value.access_token_expires_at = 0;
  config.LINKEDIN_CREDENTIALS = JSON.stringify(value);
  let sends = 0;
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes('/rest/posts')) sends++;
      return Response.json(
        { error: 'invalid_grant', error_description: 'private detail must not be logged' },
        { status: 400 },
      );
    };
    const result = await publishDaily(config);
    assert.equal(result.status, 'failed');
    assert.equal(result.error, 'linkedin_refresh_http_400');
    assert.equal(sends, 0);
    assert(!JSON.stringify(result).includes('private detail'));
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});

test('job briefs include source content, skills and eligibility without invented pay', () => {
  const item = {
    id: 'brief',
    title: 'Engineer',
    organization: 'Example',
    location: 'UK only',
    excerpt: 'Build services. Improve reliability.',
    skills: '["Python","SQL"]',
    reward: 'Pay not supplied',
    employment_type: 'Contract',
  };
  const text = postText(item);
  for (const value of [
    'Build services.',
    'Python · SQL',
    'UK only',
    'Contract',
    'Salary not disclosed',
    '/opportunities/brief/',
  ])
    assert.ok(text.includes(value));
  assert.ok(text.length < 3000);
  assert.equal(postScore(item), -1);
});
test('selection ranks substantive paid roles above generic roles and skips thin listings', async () => {
  const DB = database();
  source(DB);
  job(DB, 'ordinary');
  job(DB, 'paid');
  job(DB, 'thin');
  DB.db.prepare("UPDATE opportunities SET reward='USD 100000 / year' WHERE id='paid'").run();
  DB.db.prepare("UPDATE opportunities SET excerpt='Apply now' WHERE id='thin'").run();
  const monday = Date.parse('2026-10-19T01:00:00Z');
  assert.equal((await choosePost(env(DB), monday)).id, 'paid');
  DB.db.prepare("UPDATE opportunities SET status='closed' WHERE id!='thin'").run();
  assert.equal(await choosePost(env(DB), monday), null);
});
test('creative briefs explain buyer, first step and practical limitations', () => {
  const text = postText({
    kind: 'method',
    id: 'test',
    title: 'License photos',
    description: 'Create useful photographs.',
    buyer: 'Stock library customers',
    first_step: 'Photograph one original collection.',
    risks: 'Sales are not guaranteed.',
  });
  for (const value of [
    'Stock library customers',
    'Photograph one original collection.',
    'Sales are not guaranteed.',
    'not an available paid assignment',
  ])
    assert.ok(text.includes(value));
});

test('company marketing alone never qualifies as job content', () => {
  const item = {
    organization: 'Example',
    location: 'Worldwide',
    excerpt: 'We are revolutionizing the industry. Our company is a global leader in software.',
    reward: 'USD 200000',
    published_at: new Date().toISOString(),
  };
  assert.equal(postScore(item), -1);
});


test('LinkedIn escaping preserves literal text and the early website link after reserved characters', () => {
  const text = postText({ id: 'jobicy-155904', organization: 'Fresh Prints', title: 'Customer Service Associate', location: 'Philippines', excerpt: "Your role (internally called CX) includes customer support and working with [clients] on service requests." });
  const url = 'https://insightginie.com/opportunities/jobicy-155904/';
  assert.ok(text.indexOf(url) < text.indexOf('From the job listing:'));
  const encoded = linkedinCommentary(text);
  assert.ok(encoded.includes('role \\(internally called CX\\)'));
  assert.ok(encoded.includes(url));
  assert.equal(encoded.replace(/\\([\\|{}@\[\]()<>#*_~])/g, '$1'), text);
  const reserved = '\\|{}@[]()<>#*_~';
  assert.equal(linkedinCommentary(reserved), [...reserved].map(c => '\\' + c).join(''));
  const method = postText({ kind: 'method', id: 'creative', title: 'A guide' });
  assert.ok(method.indexOf('https://insightginie.com/earn/creative/') < method.indexOf('Potential buyer:'));
});
