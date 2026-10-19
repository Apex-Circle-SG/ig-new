import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { normalize, sourceUrl, searchQuery, text } from './catalog.mjs';
const now = '2026-10-19T12:00:00.000Z';
test('imports only recent remote records and never guesses worldwide eligibility', () => {
  const items = normalize(
    'arbeitnow',
    {
      data: [
        {
          slug: 'one',
          title: 'Developer',
          company_name: 'Example',
          remote: true,
          url: 'https://www.arbeitnow.com/jobs/one',
          created_at: 1792360000,
        },
        {
          slug: 'two',
          title: 'Office',
          company_name: 'Example',
          remote: false,
          url: 'https://www.arbeitnow.com/jobs/two',
          created_at: 1792360000,
        },
        {
          slug: 'three',
          title: 'Old',
          company_name: 'Example',
          remote: true,
          url: 'https://www.arbeitnow.com/jobs/three',
          created_at: 1600000000,
        },
      ],
    },
    now,
  );
  assert.equal(items.length, 1);
  assert.match(items[0].location, /not specified/);
  assert.equal(items[0].reward, 'Pay not supplied');
});
test('rejects unapproved application hosts and dangerous protocols', () => {
  for (const url of [
    'javascript:alert(1)',
    'https://arbeitnow.com.attacker.test/job',
    'http://arbeitnow.com/job',
    'https://user:pass@arbeitnow.com/job',
  ])
    assert.equal(sourceUrl(url, 'arbeitnow.com'), null);
  assert.equal(
    sourceUrl('https://www.arbeitnow.com/job', 'arbeitnow.com'),
    'https://www.arbeitnow.com/job',
  );
});
test('FTS user syntax is quoted and SQL parameters remain bound', () => {
  const query = searchQuery(
    new URLSearchParams({
      q: '" OR 1=1 -- (python*)',
      source: "x' OR 1=1",
      limit: '999999',
      page: '-1',
    }),
  );
  assert.equal(query.limit, 50);
  assert.equal(query.page, 1);
  assert(!query.where.includes("x'"));
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('./migrations/0001_catalog.sql', import.meta.url), 'utf8'));
  assert.doesNotThrow(() =>
    db
      .prepare(`SELECT COUNT(*) AS total FROM opportunities o WHERE ${query.where}`)
      .all(...query.values),
  );
  db.close();
});
test('schema upserts maintain a searchable record without duplicates', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('./migrations/0001_catalog.sql', import.meta.url), 'utf8'));
  db.exec(
    "INSERT INTO sources(id,name,category,url,access_method,status,policy) VALUES('jobicy','Jobicy','jobs','https://jobicy.com','API','enabled','attribution')",
  );
  const item = normalize(
    'jobicy',
    {
      jobs: [
        {
          id: 1,
          jobTitle: 'Python engineer',
          companyName: 'Example',
          url: 'https://jobicy.com/jobs/one',
          pubDate: now,
          jobGeo: 'USA',
        },
      ],
    },
    now,
  )[0];
  const fields = Object.keys(item);
  db.prepare(`INSERT INTO opportunities(${fields.join(',')}) VALUES(${fields.map(() => '?')})`).run(
    ...Object.values(item),
  );
  db.prepare('UPDATE opportunities SET title=? WHERE id=?').run('Rust engineer', item.id);
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM opportunities_search WHERE opportunities_search MATCH 'Rust'",
      )
      .get().n,
    1,
  );
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM opportunities_search WHERE opportunities_search MATCH 'Python'",
      )
      .get().n,
    0,
  );
  assert.throws(() =>
    db
      .prepare(`INSERT INTO opportunities(${fields.join(',')}) VALUES(${fields.map(() => '?')})`)
      .run(...Object.values(item)),
  );
  db.close();
});
test('source text is bounded and active script contents are removed', () => {
  assert.equal(text('<script>steal()</script><p>Real &amp; useful</p>'), 'Real & useful');
  assert.equal(text('a'.repeat(10000)).length, 1200);
});
