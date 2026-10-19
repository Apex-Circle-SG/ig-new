// Fixed public endpoints only. No user-provided crawl URLs or authenticated dashboards.
export const FEED_CONFIG = {
  jobicy: {
    url: 'https://jobicy.com/api/v2/remote-jobs?count=100',
    kind: 'board',
    name: 'Jobicy',
    host: 'jobicy.com',
  },
  arbeitnow: {
    url: 'https://www.arbeitnow.com/api/job-board-api',
    kind: 'board',
    name: 'Arbeitnow',
    host: 'arbeitnow.com',
  },
  remoteok: {
    url: 'https://remoteok.com/api',
    kind: 'board',
    name: 'Remote OK',
    host: 'remoteok.com',
  },
  ...Object.fromEntries(
    [
      ['gitlab', 'GitLab'],
      ['canonical', 'Canonical'],
      ['wikimedia', 'Wikimedia Foundation'],
    ].map(([board, name]) => [
      `greenhouse-${board}`,
      {
        url: `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`,
        kind: 'greenhouse',
        board,
        name,
        host: 'job-boards.greenhouse.io',
        complete: true,
      },
    ]),
  ),
  ...Object.fromEntries(
    [
      ['zapier', 'Zapier'],
      ['docker', 'Docker'],
      ['buffer', 'Buffer'],
      ['linear', 'Linear'],
    ].map(([board, name]) => [
      `ashby-${board}`,
      {
        url: `https://api.ashbyhq.com/posting-api/job-board/${board}?includeCompensation=true`,
        kind: 'ashby',
        board,
        name,
        host: 'jobs.ashbyhq.com',
        complete: true,
      },
    ]),
  ),
  'github-bounties': {
    url: 'https://api.github.com/search/issues?q=org%3Atenstorrent%20is%3Aissue%20is%3Aopen%20no%3Aassignee%20label%3Abounty&sort=updated&order=desc&per_page=100',
    kind: 'bounties',
    name: 'Tenstorrent open-source bounties',
    complete: true,
    host: 'github.com',
  },
};
export const FEEDS = Object.fromEntries(
  Object.entries(FEED_CONFIG).map(([id, config]) => [id, config.url]),
);
