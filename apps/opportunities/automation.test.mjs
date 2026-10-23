import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { normalize } from './catalog.mjs';
import { ingestSource } from './worker.mjs';
import worker from './worker.mjs';
import { chooseDiscovery } from './discoveries.mjs';
import discoveries from './data/discoveries.json' with { type: 'json' };
import methods from './data/methods.json' with { type: 'json' };
import {
  publishDaily,
  encryptState,
  decryptState,
  singaporeDay,
  postText,
  linkedinCommentary,
  postScore,
  choosePost,
  postVisual,
  uploadPostImage,
} from './social.mjs';

const testPng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
function withImageUploads(next) {
  return async (url, options) => {
    if (String(url).includes('/api/social-card/'))
      return new Response(testPng, { headers: { 'content-type': 'image/png' } });
    if (String(url).includes('/rest/images?action=initializeUpload'))
      return Response.json({
        value: {
          image: 'urn:li:image:test',
          uploadUrl: 'https://www.linkedin.com/dms-uploads/test',
        },
      });
    if (String(url).startsWith('https://www.linkedin.com/dms-uploads/'))
      return new Response(null, { status: 201 });
    if (String(url).includes('/rest/images/')) return Response.json({ status: 'AVAILABLE' });
    return next(url, options);
  };
}

function database() {
  const db = new DatabaseSync(':memory:');
  for (const file of [
    '0001_catalog.sql',
    '0002_automation.sql',
    '0003_evening_discoveries.sql',
    '0004_social_images.sql',
  ])
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
    LINKEDIN_EVENING_ENABLED: 'true',
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
    globalThis.fetch = withImageUploads(async () => new Response('unavailable', { status: 503 }));
    const failed = await ingestSource({ DB }, 'greenhouse-gitlab');
    assert.equal(failed.status, 'failed');
    assert.equal(DB.db.prepare('SELECT status FROM opportunities').get().status, 'active');
    globalThis.fetch = withImageUploads(async () =>
      Response.json({ jobs: [], meta: { total: 0 } }),
    );
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
    globalThis.fetch = withImageUploads(async (url) => {
      calls++;
      return String(url).includes('api.linkedin.com')
        ? new Response(null, { status: 201, headers: { 'x-restli-id': 'urn:li:share:123' } })
        : new Response(null, { status: 200 });
    });
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
    globalThis.fetch = withImageUploads(async (url) => {
      calls++;
      if (String(url).includes('api.linkedin.com')) throw new Error('timeout');
      return new Response(null, { status: 200 });
    });
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
    globalThis.fetch = withImageUploads(async (url) => {
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
    });
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
    globalThis.fetch = withImageUploads(async (url) => {
      if (String(url).includes('api.linkedin.com')) {
        sends++;
        return new Response(null, { status: 201, headers: { 'x-restli-id': 'urn:li:share:once' } });
      }
      return new Response(null, { status: 200 });
    });
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
    globalThis.fetch = withImageUploads(async (url) => {
      if (String(url).includes('/rest/posts')) sends++;
      return Response.json(
        { error: 'invalid_grant', error_description: 'private detail must not be logged' },
        { status: 400 },
      );
    });
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
  const text = postText({
    id: 'jobicy-155904',
    organization: 'Fresh Prints',
    title: 'Customer Service Associate',
    location: 'Philippines',
    excerpt:
      'Your role (internally called CX) includes customer support and working with [clients] on service requests.',
  });
  const url = 'https://insightginie.com/opportunities/jobicy-155904/';
  assert.ok(text.indexOf(url) < text.indexOf('From the job listing:'));
  const encoded = linkedinCommentary(text);
  assert.ok(encoded.includes('role \\(internally called CX\\)'));
  assert.ok(encoded.includes(url));
  assert.equal(encoded.replace(/\\([\\|{}@\[\]()<>#*_~])/g, '$1'), text);
  const reserved = '\\|{}@[]()<>#*_~';
  assert.equal(linkedinCommentary(reserved), [...reserved].map((c) => '\\' + c).join(''));
  const method = postText({ kind: 'method', id: 'creative', title: 'A guide' });
  assert.ok(
    method.indexOf('https://insightginie.com/earn/creative/') < method.indexOf('Who pays:'),
  );
});

const eveningTime = Date.parse('2026-10-20T13:00:00Z');
function discoveryMethods(DB) {
  const stmt = DB.db.prepare(
    "INSERT INTO earning_methods(id,title,category,data,last_checked,check_status) VALUES(?,?,?,?,?,'reachable')",
  );
  for (const method of methods)
    stmt.run(
      method.id,
      method.title,
      method.category,
      JSON.stringify(method),
      new Date(eveningTime).toISOString(),
    );
}

test('reviewed evening queue has fourteen distinct dates, matching guide references and early links', () => {
  assert.equal(discoveries.length, 14);
  assert.equal(new Set(discoveries.map((x) => x.id)).size, 14);
  assert.equal(new Set(discoveries.map((x) => x.publish_on)).size, 14);
  for (let i = 0; i < discoveries.length; i++) {
    const item = discoveries[i];
    assert.equal(item.publish_on, singaporeDay(eveningTime + i * 86400000));
    const method = methods.find((x) => x.id === item.method_id);
    assert.equal(method.source_url, item.source_url);
    assert.ok(method.steps.includes(item.explanation));
    const text = postText({ ...item, kind: 'discovery' });
    const destination = `https://insightginie.com/earn/${item.method_id}/`;
    assert.ok(text.indexOf(destination) < text.indexOf(item.explanation));
    assert.ok(linkedinCommentary(text).length < 2900);
    if (item.type === 'calculation') assert.match(text, /[Ii]llustrative/);
  }
});

test('evening selection respects date, source freshness, changed reference and publication deduplication', async () => {
  const DB = database();
  discoveryMethods(DB);
  const config = env(DB);
  assert.equal((await chooseDiscovery(config, eveningTime)).id, 'think-out-loud');
  assert.equal(await chooseDiscovery(config, eveningTime - 86400000), null);
  assert.equal(await chooseDiscovery(config, Date.parse('2026-11-03T13:00:00Z')), null);
  DB.db
    .prepare("UPDATE earning_methods SET check_status='removed' WHERE id='website-user-testing'")
    .run();
  assert.equal(await chooseDiscovery(config, eveningTime), null);
  DB.db
    .prepare(
      "UPDATE earning_methods SET check_status='reachable',last_checked='2026-10-16' WHERE id='website-user-testing'",
    )
    .run();
  assert.equal(await chooseDiscovery(config, eveningTime), null);
  DB.db
    .prepare(
      "UPDATE earning_methods SET last_checked=?,data=json_set(data,'$.source_url','https://example.com/') WHERE id='website-user-testing'",
    )
    .run(new Date(eveningTime).toISOString());
  assert.equal(await chooseDiscovery(config, eveningTime), null);
  DB.db
    .prepare("UPDATE earning_methods SET data=? WHERE id='website-user-testing'")
    .run(JSON.stringify(methods[0]));
  DB.db
    .prepare(
      "INSERT INTO social_discovery_posts(day,opportunity_id,status,started_at) VALUES('2026-10-19','discovery-think-out-loud','uncertain','test')",
    )
    .run();
  assert.equal(await chooseDiscovery(config, eveningTime), null);
  DB.db.close();
});

test('morning and evening publish independently, with one atomic evening claim and read-only previews', async () => {
  const DB = database();
  source(DB);
  job(DB);
  discoveryMethods(DB);
  const original = globalThis.fetch;
  const sent = [];
  globalThis.fetch = withImageUploads(async (url, options) => {
    if (String(url).includes('api.linkedin.com')) {
      sent.push(JSON.parse(options.body));
      return new Response(null, {
        status: 201,
        headers: { 'x-restli-id': `urn:li:share:${sent.length}` },
      });
    }
    return new Response(null, { status: 200 });
  });
  try {
    const config = env(DB);
    assert.equal(
      (await publishDaily(config, eveningTime, { slot: 'evening', dryRun: true })).status,
      'preview',
    );
    assert.equal(sent.length, 0);
    assert.equal(DB.db.prepare('SELECT count(*) n FROM social_discovery_posts').get().n, 0);
    assert.equal((await publishDaily(config, eveningTime)).status, 'published');
    const concurrent = await Promise.all([
      publishDaily(config, eveningTime, { slot: 'evening' }),
      publishDaily(config, eveningTime, { slot: 'evening' }),
    ]);
    assert.deepEqual(concurrent.map((x) => x.status).sort(), ['already-recorded', 'published']);
    assert.equal(sent.length, 2);
    assert.ok(sent[1].commentary.includes('https://insightginie.com/earn/website-user-testing/'));
    assert.equal(DB.db.prepare('SELECT count(*) n FROM social_posts').get().n, 1);
    assert.equal(DB.db.prepare('SELECT count(*) n FROM social_discovery_posts').get().n, 1);
    assert.equal(
      (await publishDaily(config, Date.parse('2026-11-03T13:00:00Z'), { slot: 'evening' })).status,
      'outside-trial',
    );
    assert.equal(sent.length, 2);
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});

test('evening posts stop on broken sources and destinations, without sending to LinkedIn', async () => {
  for (const broken of ['source', 'destination']) {
    const DB = database();
    discoveryMethods(DB);
    const original = globalThis.fetch;
    let posts = 0;
    globalThis.fetch = withImageUploads(async (url) => {
      if (String(url).includes('api.linkedin.com')) {
        posts++;
        throw Error('must not post');
      }
      const isSite = String(url).startsWith('https://insightginie.com/');
      return new Response(null, { status: (broken === 'source' ? !isSite : isSite) ? 404 : 200 });
    });
    try {
      const result = await publishDaily(env(DB), eveningTime, { slot: 'evening' });
      assert.equal(result.status, 'failed');
      assert.equal(posts, 0);
      assert.equal(
        (await publishDaily(env(DB), eveningTime, { slot: 'evening' })).status,
        'already-recorded',
      );
    } finally {
      globalThis.fetch = original;
      DB.db.close();
    }
  }
});

test('evening timeout is held, and its disable switch does not disable morning posting', async () => {
  const DB = database();
  discoveryMethods(DB);
  const original = globalThis.fetch;
  let posts = 0;
  globalThis.fetch = withImageUploads(async (url) => {
    if (String(url).includes('api.linkedin.com')) {
      posts++;
      throw Error('timeout');
    }
    return new Response(null, { status: 200 });
  });
  try {
    const config = env(DB);
    assert.equal(
      (
        await publishDaily({ ...config, LINKEDIN_EVENING_ENABLED: 'false' }, eveningTime, {
          slot: 'evening',
        })
      ).status,
      'disabled',
    );
    assert.equal(
      (await publishDaily(config, eveningTime, { slot: 'evening' })).status,
      'uncertain',
    );
    assert.equal(
      (await publishDaily(config, eveningTime, { slot: 'evening' })).status,
      'already-recorded',
    );
    assert.equal(posts, 1);
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});

test('21:00 Singapore cron selects the evening slot and protected previews stay read-only', async () => {
  const DB = database();
  discoveryMethods(DB);
  const config = { ...env(DB), INGEST_SECRET: 'test-secret' };
  const denied = await worker.fetch(
    new Request('https://example.com/admin/social-preview?slot=evening', { method: 'POST' }),
    config,
  );
  assert.equal(denied.status, 401);
  const invalid = await worker.fetch(
    new Request('https://example.com/admin/social-preview?slot=other', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret' },
    }),
    config,
  );
  assert.equal(invalid.status, 400);
  const original = globalThis.fetch;
  const sent = [];
  globalThis.fetch = withImageUploads(async (url, options) => {
    if (String(url).includes('api.linkedin.com')) {
      sent.push(JSON.parse(options.body));
      return new Response(null, {
        status: 201,
        headers: { 'x-restli-id': 'urn:li:share:evening' },
      });
    }
    return new Response(null, { status: 200 });
  });
  try {
    await worker.scheduled({ cron: '0 13 * * *', scheduledTime: eveningTime }, config);
    assert.equal(sent.length, 1);
    assert.match(sent[0].commentary, /You can get paid for getting confused/);
    assert.equal(DB.db.prepare('SELECT count(*) n FROM social_posts').get().n, 0);
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});

test('evening migration preserves existing morning receipts and is safe to reapply', () => {
  const db = new DatabaseSync(':memory:');
  for (const file of ['0001_catalog.sql', '0002_automation.sql'])
    db.exec(readFileSync(new URL(`./migrations/${file}`, import.meta.url), 'utf8'));
  db.prepare(
    "INSERT INTO social_posts(day,opportunity_id,status,started_at,post_id) VALUES('2026-10-20','existing-job','published','test','urn:li:share:existing')",
  ).run();
  const before = db.prepare('SELECT * FROM social_posts').all();
  const sql = readFileSync(
    new URL('./migrations/0003_evening_discoveries.sql', import.meta.url),
    'utf8',
  );
  db.exec(sql);
  db.exec(sql);
  assert.deepEqual(db.prepare('SELECT * FROM social_posts').all(), before);
  db.prepare(
    "INSERT INTO social_discovery_posts(day,opportunity_id,status,started_at) VALUES('2026-10-20','discovery-test','published','test')",
  ).run();
  assert.equal(db.prepare('SELECT COUNT(*) n FROM social_posts').get().n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM social_discovery_posts').get().n, 1);
  db.close();
});

test('image is uploaded before publishing and its receipt is saved with each post', async () => {
  const DB = database();
  source(DB);
  job(DB);
  const original = globalThis.fetch;
  const actions = [];
  globalThis.fetch = async (url, options) => {
    actions.push(String(url));
    if (String(url).includes('/rest/images/')) return Response.json({ status: 'AVAILABLE' });
    if (String(url).includes('/rest/images?')) {
      assert.equal(JSON.parse(options.body).initializeUploadRequest.owner, 'urn:li:person:test');
      return Response.json({
        value: {
          image: 'urn:li:image:uploaded',
          uploadUrl: 'https://www.linkedin.com/dms-uploads/test',
        },
      });
    }
    if (String(url).includes('/dms-uploads/')) {
      assert.equal(options.method, 'PUT');
      assert.equal(options.headers['Content-Type'], 'image/png');
      assert.deepEqual(options.body, testPng);
      return new Response(null, { status: 201 });
    }
    if (String(url).includes('/api/social-card/'))
      return new Response(testPng, { headers: { 'content-type': 'image/png' } });
    if (String(url).endsWith('/rest/posts')) {
      const post = JSON.parse(options.body);
      assert.equal(post.content.media.id, 'urn:li:image:uploaded');
      assert.match(post.content.media.altText, /Remote engineer/);
      assert.equal((post.commentary.match(/https:\/\/insightginie.com/g) || []).length, 1);
      return new Response(null, { status: 201, headers: { 'x-restli-id': 'urn:li:share:visual' } });
    }
    return new Response(null, { status: 200 });
  };
  try {
    assert.equal((await publishDaily(env(DB))).status, 'published');
    assert(
      actions.findIndex((x) => x.includes('/dms-uploads/')) <
        actions.findIndex((x) => x.endsWith('/rest/posts')),
    );
    const receipt = DB.db.prepare('SELECT image_urn,visual_url FROM social_posts').get();
    assert.equal(receipt.image_urn, 'urn:li:image:uploaded');
    assert.equal(receipt.visual_url, 'https://insightginie.com/api/social-card/job/role-1/');
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});

test('failed image uploads hold posting without a silent text-only post or automatic retry', async () => {
  const DB = database();
  source(DB);
  job(DB);
  const original = globalThis.fetch;
  let posts = 0;
  globalThis.fetch = withImageUploads(async (url) => {
    if (String(url).includes('/rest/posts')) posts++;
    return new Response(null, { status: 200 });
  });
  const normal = globalThis.fetch;
  globalThis.fetch = async (url, options) =>
    String(url).includes('/dms-uploads/')
      ? new Response(null, { status: 503 })
      : normal(url, options);
  try {
    const result = await publishDaily(env(DB));
    assert.equal(result.status, 'failed');
    assert.equal(result.error, 'linkedin_image_upload_http_503');
    assert.equal((await publishDaily(env(DB))).status, 'already-recorded');
    assert.equal(posts, 0);
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});

test('upload rejects invalid images, oversized streams and untrusted upload hosts without leaking tokens', async () => {
  const original = globalThis.fetch;
  try {
    for (const scenario of ['html', 'oversize', 'signature', 'host']) {
      let external = 0;
      globalThis.fetch = async (url) => {
        if (String(url).includes('/api/social-card/'))
          return scenario === 'html'
            ? new Response('HTML', { headers: { 'content-type': 'text/html' } })
            : new Response(
                scenario === 'oversize'
                  ? new Uint8Array(4000001)
                  : scenario === 'signature'
                    ? new Uint8Array(8)
                    : testPng,
                { headers: { 'content-type': 'image/png' } },
              );
        if (String(url).includes('/rest/images?'))
          return Response.json({
            value: {
              image: 'urn:li:image:test',
              uploadUrl: 'https://evil.example/dms-uploads/test',
            },
          });
        external++;
        return new Response(null, { status: 200 });
      };
      await assert.rejects(
        () =>
          uploadPostImage(
            { access_token: 'secret', person_urn: 'urn:li:person:test' },
            postVisual({ id: 'role', title: 'Role' }),
          ),
        /linkedin_image_/,
      );
      assert.equal(external, 0);
    }
  } finally {
    globalThis.fetch = original;
  }
});

test('job selection rejects the company-introduction phrasing from the Fresh Prints post', () => {
  assert.equal(
    postScore({
      organization: 'Fresh Prints',
      location: 'Philippines',
      excerpt:
        'We work with talented student entrepreneurs and provide working capital, training, and support to build businesses at their schools. The Customer Experience Associate',
    }),
    -1,
  );
});

test('image migration retains published receipts and permits per-slot image evidence', () => {
  const db = new DatabaseSync(':memory:');
  for (const file of ['0001_catalog.sql', '0002_automation.sql', '0003_evening_discoveries.sql'])
    db.exec(readFileSync(new URL(`./migrations/${file}`, import.meta.url), 'utf8'));
  db.prepare(
    "INSERT INTO social_posts(day,status,started_at,post_id) VALUES('2026-10-20','published','test','urn:li:share:existing')",
  ).run();
  db.exec(readFileSync(new URL('./migrations/0004_social_images.sql', import.meta.url), 'utf8'));
  const receipt = db.prepare('SELECT post_id,status,image_urn FROM social_posts').get();
  assert.equal(receipt.post_id, 'urn:li:share:existing');
  assert.equal(receipt.status, 'published');
  assert.equal(receipt.image_urn, null);
  assert.equal(db.prepare('SELECT max(version) v FROM schema_migrations').get().v, 4);
  db.close();
});

test('image readiness waits for AVAILABLE and supports documented legacy member-token status reads', async () => {
  const original = globalThis.fetch;
  let reads = 0;
  const normal = withImageUploads(async () => {
    throw Error('Unexpected request');
  });
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('/rest/images/')) {
      reads++;
      if (options.headers['LinkedIn-Version']) return new Response(null, { status: 403 });
      return Response.json({ status: reads === 2 ? 'PROCESSING' : 'AVAILABLE' });
    }
    return normal(url, options);
  };
  try {
    assert.equal(
      await uploadPostImage(
        { access_token: 'test', person_urn: 'urn:li:person:test' },
        postVisual({ id: 'role', title: 'Role' }),
      ),
      'urn:li:image:test',
    );
    assert.equal(reads, 3);
  } finally {
    globalThis.fetch = original;
  }
});
test('failed image processing never proceeds to a feed post', async () => {
  const DB = database();
  source(DB);
  job(DB);
  const original = globalThis.fetch;
  let posts = 0;
  const normal = withImageUploads(async (url) => {
    if (String(url).includes('/rest/posts')) posts++;
    return new Response(null, { status: 200 });
  });
  globalThis.fetch = async (url, options) =>
    String(url).includes('/rest/images/')
      ? Response.json({ status: 'PROCESSING_FAILED' })
      : normal(url, options);
  try {
    const result = await publishDaily(env(DB));
    assert.equal(result.status, 'failed');
    assert.equal(result.error, 'linkedin_image_processing_failed');
    assert.equal(posts, 0);
  } finally {
    globalThis.fetch = original;
    DB.db.close();
  }
});
