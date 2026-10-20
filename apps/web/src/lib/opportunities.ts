const API =
  process.env.OPPORTUNITIES_API_URL || 'https://insightginie-opportunities.aloycwl.workers.dev';
export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  category: string;
  location: string;
  work_mode: string;
  employment_type: string;
  expires_at: string | null;
  reward: string;
  skills: string[];
  excerpt: string;
  source_url: string;
  source_id: string;
  source_name: string;
  published_at: string;
  last_seen_at: string;
  status: string;
};
export type Idea = {
  id: string;
  title: string;
  category: string;
  description: string;
  buyer: string;
  experiment: string;
  delivery: string;
  caveat: string;
  skills: string[];
  startup: string;
  status: string;
};
export type Platform = {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
  eligibility: string;
  payment: string;
};
export type Source = {
  id: string;
  name: string;
  status: string;
  last_success: string | null;
  last_error: string | null;
  last_count: number;
  url: string;
  category: string;
};
export type CatalogStats = {
  opportunities: number;
  methods: number;
  categories: { category: string; total: number }[];
  ideas: number;
  platforms: number;
  sources: Source[];
  updated_at: string;
};
export type OpportunityResults = {
  items: Opportunity[];
  total: number;
  page: number;
  pages: number;
};

export async function catalog<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}${path}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function opportunityRecord(id: string): Promise<Opportunity | null | undefined> {
  try {
    const response = await fetch(`${API}/v1/opportunities/${id}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(7000),
    });
    if (response.status === 404) return null;
    if (!response.ok) return undefined;
    return (await response.json()) as Opportunity;
  } catch {
    return undefined;
  }
}

export const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
export const categoryDescriptions: Record<string, string> = {
  Playful: 'Unusual gifts, party experiences and delightful little services.',
  Creative: 'Turn design, writing and editing skills into a useful offer.',
  'Digital services': 'Practical services you can test with a real customer.',
  'Build and automate': 'Small tools and workflows that solve specific problems.',
  Research: 'Help someone find, verify or understand information.',
  Community: 'Bring people together around an activity or shared interest.',
};

export type EarningMethod = {
  id: string;
  title: string;
  category: string;
  description: string;
  buyer: string;
  first_step: string;
  steps: string;
  risks: string;
  source_url: string;
  source_name: string;
  payment: string;
  eligibility: string;
  last_checked: string | null;
  check_status: string;
};
export type AutomationStatus = {
  ingestion: string;
  methodChecks: string;
  linkedin: {
    enabled: boolean;
    schedule: string;
    evening?: {
      enabled: boolean;
      schedule: string;
      start: string;
      end: string;
      posts: number;
      recent: {
        day: string;
        status: string;
        finished_at: string | null;
        error_code: string | null;
      }[];
    };
    recent: {
      day: string;
      status: string;
      finished_at: string | null;
      error_code: string | null;
    }[];
  };
};
