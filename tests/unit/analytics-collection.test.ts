import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAggregateCollector } from '../../apps/web/src/app/api/events/aggregate-store';
import { createFirstPartyProvider, sendAggregateEvent } from '@insightginie/analytics';

const timestamp = Date.parse('2026-09-13T08:00:00Z');
const pageEvent = { event: 'page_view', route_id: 'home' };
const directories: string[] = [];
async function collector(now: () => number = () => timestamp) {
  const directory = await mkdtemp(join(tmpdir(), 'insightginie-counts-'));
  directories.push(directory);
  return { directory, collect: createAggregateCollector({ directory, now }) };
}
function request(body: unknown = pageEvent, headers: Record<string, string> = {}) {
  return new Request('https://insightginie.com/api/events/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://insightginie.com',
      'sec-fetch-site': 'same-origin',
      'cf-connecting-ip': '198.51.100.12',
      'x-insightginie-consent': 'allow',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('first-party aggregate collection', () => {
  it('stores nothing without consent or when a privacy signal is set', async () => {
    const { directory, collect } = await collector();
    const choices: Record<string, string>[] = [
      { 'x-insightginie-consent': '' },
      { 'sec-gpc': '1' },
      { dnt: '1' },
    ];
    for (const headers of choices)
      expect((await collect(request(pageEvent, headers))).status).toBe(204);
    expect(await readdir(directory)).toEqual([]);
  });

  it('is disabled without a configured state directory', async () => {
    const collect = createAggregateCollector({});
    expect((await collect(request())).status).toBe(204);
  });

  it('serializes simultaneous increments without storing event rows or request metadata', async () => {
    const { directory, collect } = await collector();
    const responses = await Promise.all(Array.from({ length: 20 }, () => collect(request())));
    expect(responses.every((response) => response.status === 204)).toBe(true);
    const text = await readFile(join(directory, '2026-09-13.json'), 'utf8');
    expect(JSON.parse(text)).toEqual({ day: '2026-09-13', counts: { 'home|page_view||': 20 } });
    expect(text).not.toContain('198.51.100.12');
    expect(text).not.toContain('https://');
    expect(await readdir(directory)).toEqual(['2026-09-13.json']);
  });

  it.each([
    { ...pageEvent, income: 137000 },
    { ...pageEvent, url: 'https://insightginie.com/?income=137000' },
    { ...pageEvent, route_id: 'tools:income' },
    { ...pageEvent, route_id: '/calc/?income=137000' },
    { ...pageEvent, event: 'unknown' },
    { ...pageEvent, calculator_id: 'individual-income-percentile' },
    { event: 'calculator_completed', route_id: 'home', calculator_id: 'unknown' },
    {
      event: 'calculator_completed',
      route_id: 'home',
      calculator_id: 'individual-income-percentile',
      interaction: 137000,
    },
    [],
    null,
  ])('rejects an invalid payload without persisting it: %j', async (body) => {
    const { directory, collect } = await collector();
    expect((await collect(request(body))).status).toBe(400);
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects oversized bodies even without a declared content length', async () => {
    const { directory, collect } = await collector();
    expect((await collect(request({ ...pageEvent, extra: 'a'.repeat(1024) }))).status).toBe(400);
    expect(await readdir(directory)).toEqual([]);
  });

  it('cancels a body that never finishes and releases its active reader', async () => {
    const { directory } = await collector();
    const collect = createAggregateCollector({
      directory,
      now: () => timestamp,
      bodyTimeoutMs: 20,
    });
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    const streaming = new Request(request(), { body, ...{ duplex: 'half' } });
    expect((await collect(streaming)).status).toBe(400);
    expect(cancel).toHaveBeenCalledOnce();
    expect((await collect(request())).status).toBe(204);
  });

  it('bounds active streaming readers before they reach the write queue', async () => {
    const { collect } = await collector();
    const controllers: ReadableStreamDefaultController[] = [];
    const responses = Array.from({ length: 100 }, (_, index) => {
      const body = new ReadableStream({
        start(controller) {
          controllers.push(controller);
        },
      });
      return collect(
        new Request(request(pageEvent, { 'cf-connecting-ip': `198.51.100.${index + 1}` }), {
          body,
          ...{ duplex: 'half' },
        }),
      );
    });
    expect((await collect(request())).status).toBe(429);
    for (const controller of controllers) controller.close();
    expect((await Promise.all(responses)).every((response) => response.status === 400)).toBe(true);
    expect((await collect(request())).status).toBe(204);
  });

  it('requires matching origin, same-origin fetch metadata and JSON', async () => {
    const { collect } = await collector();
    expect(
      (await collect(request(pageEvent, { origin: 'https://untrusted.example' }))).status,
    ).toBe(403);
    expect((await collect(request(pageEvent, { 'sec-fetch-site': 'cross-site' }))).status).toBe(
      403,
    );
    expect((await collect(request(pageEvent, { 'content-type': 'text/plain' }))).status).toBe(415);
  });

  it('rate limits repeated events and clears the temporary window', async () => {
    let current = timestamp;
    const { collect } = await collector(() => current);
    for (let count = 0; count < 60; count++) expect((await collect(request())).status).toBe(204);
    expect((await collect(request())).status).toBe(429);
    current += 61_000;
    expect((await collect(request())).status).toBe(204);
  });

  it('removes expired aggregate days and preserves the full 30-day window', async () => {
    const { directory, collect } = await collector();
    await writeFile(join(directory, '2026-08-14.json'), '{}');
    await writeFile(join(directory, '2026-08-15.json'), '{}');
    expect((await collect(request())).status).toBe(204);
    expect((await readdir(directory)).sort()).toEqual(['2026-08-15.json', '2026-09-13.json']);
  });

  it('does not replace a corrupt aggregate file and recovers after it is repaired', async () => {
    const { directory, collect } = await collector();
    const filename = join(directory, '2026-09-13.json');
    await writeFile(filename, '{corrupt');
    expect((await collect(request())).status).toBe(503);
    expect(await readFile(filename, 'utf8')).toBe('{corrupt');
    await writeFile(filename, JSON.stringify({ day: '2026-09-13', counts: {} }));
    expect((await collect(request())).status).toBe(204);
  });
});

describe('browser aggregate boundary', () => {
  it('forwards only enumerated properties from the calculator provider', () => {
    const send = vi.fn();
    const provider = createFirstPartyProvider('home', send);
    provider.track('calculator_completed', {
      calculator_id: 'individual-income-percentile',
      interaction: 'form',
      ...{ income: 137000, profile_id: 'private' },
    });
    expect(send).toHaveBeenCalledWith({
      route_id: 'home',
      event: 'calculator_completed',
      calculator_id: 'individual-income-percentile',
      interaction: 'form',
    });
    createFirstPartyProvider('not-approved', send).track('calculator_view', {
      calculator_id: 'individual-income-percentile',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('omits cookies, referrers and runtime extra fields from network requests', () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { cookie: 'ig_analytics=allow' });
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('fetch', fetch);
    sendAggregateEvent({ event: 'page_view', route_id: 'home', ...{ income: 137000 } });
    expect(fetch).toHaveBeenCalledWith(
      '/api/events/',
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        mode: 'same-origin',
        body: JSON.stringify({ event: 'page_view', route_id: 'home' }),
      }),
    );
  });
});
