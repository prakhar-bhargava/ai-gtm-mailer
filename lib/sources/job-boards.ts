import { SourceError, fetchText } from "@/lib/sources/http";

export type Job = {
  title: string;
  url: string;
  department: string | null;
  updatedAt: string | null;
};

export type JobBoard = { provider: "Greenhouse" | "Ashby" | "Lever" | "SmartRecruiters" | "Workable"; slug: string; jobs: Job[] };

// Public job-board APIs. None needs a key. A board that doesn't exist answers 404 (or, on SmartRecruiters,
// an empty list). Each slug is tried on every provider, in order of how common each is among
// Zamp-shaped companies (mid-market and enterprise tech): Greenhouse, Ashby, Lever, SmartRecruiters, Workable.
// Returns the first board with at least one open role, or null.
const LOADERS = [loadGreenhouse, loadAshby, loadLever, loadSmartRecruiters, loadWorkable];
export const PROVIDERS = ["Greenhouse", "Ashby", "Lever", "SmartRecruiters", "Workable"] as const;

export async function findJobBoard(slugs: string[]): Promise<JobBoard | null> {
  for (const slug of slugs) {
    for (const load of LOADERS) {
      const board = await load(slug).catch((error) => {
        if (error instanceof SourceError && (error.status === 404 || error.status === 400)) return null;
        throw error;
      });
      if (board && board.jobs.length) return board;
    }
  }
  return null;
}

async function loadGreenhouse(slug: string): Promise<JobBoard | null> {
  try {
    const body = await fetchText(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
      cacheKey: `greenhouse:${slug}`,
      accept: "application/json",
    });
    const data = JSON.parse(body) as {
      jobs: { title: string; absolute_url: string; updated_at: string; departments?: { name: string }[] }[];
    };
    const jobs = data.jobs.map((job) => ({
      title: job.title,
      url: job.absolute_url,
      department: job.departments?.[0]?.name ?? null,
      updatedAt: job.updated_at ?? null,
    }));
    return { provider: "Greenhouse", slug, jobs };
  } catch (error) {
    if (error instanceof SourceError && error.status === 404) return null;
    throw error;
  }
}

async function loadAshby(slug: string): Promise<JobBoard | null> {
  try {
    const body = await fetchText(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
      cacheKey: `ashby:${slug}`,
      accept: "application/json",
    });
    const data = JSON.parse(body) as {
      jobs: { title: string; jobUrl: string; publishedAt?: string; department?: string }[];
    };
    const jobs = data.jobs.map((job) => ({
      title: job.title,
      url: job.jobUrl,
      department: job.department ?? null,
      updatedAt: job.publishedAt ?? null,
    }));
    return { provider: "Ashby", slug, jobs };
  } catch (error) {
    if (error instanceof SourceError && error.status === 404) return null;
    throw error;
  }
}

async function loadLever(slug: string): Promise<JobBoard | null> {
  const body = await fetchText(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
    cacheKey: `lever:${slug}`,
    accept: "application/json",
  });
  const data = JSON.parse(body) as { text: string; hostedUrl: string; createdAt?: number; categories?: { team?: string; department?: string } }[];
  if (!Array.isArray(data)) return null;
  const jobs = data.map((job) => ({
    title: job.text,
    url: job.hostedUrl,
    department: job.categories?.department ?? job.categories?.team ?? null,
    updatedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
  }));
  return { provider: "Lever", slug, jobs };
}

async function loadSmartRecruiters(slug: string): Promise<JobBoard | null> {
  const body = await fetchText(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`, {
    cacheKey: `smartrecruiters:${slug}`,
    accept: "application/json",
  });
  const data = JSON.parse(body) as {
    content?: { id: string; name: string; releasedDate?: string; department?: { label?: string }; company?: { identifier?: string } }[];
  };
  if (!data.content?.length) return null;
  const jobs = data.content.map((job) => ({
    title: job.name,
    url: `https://jobs.smartrecruiters.com/${job.company?.identifier ?? slug}/${job.id}`,
    department: job.department?.label ?? null,
    updatedAt: job.releasedDate ?? null,
  }));
  return { provider: "SmartRecruiters", slug, jobs };
}

async function loadWorkable(slug: string): Promise<JobBoard | null> {
  const body = await fetchText(`https://apply.workable.com/api/v1/widget/accounts/${slug}`, {
    cacheKey: `workable:${slug}`,
    accept: "application/json",
  });
  const data = JSON.parse(body) as { jobs?: { title: string; url?: string; shortlink?: string; department?: string; published_on?: string; created_at?: string }[] };
  if (!data.jobs?.length) return null;
  const jobs = data.jobs.map((job) => ({
    title: job.title,
    url: job.url ?? job.shortlink ?? `https://apply.workable.com/${slug}/`,
    department: job.department || null,
    updatedAt: job.published_on ?? job.created_at ?? null,
  }));
  return { provider: "Workable", slug, jobs };
}
