/**
 * Clearbit Company Enrichment API.
 * Fetches real company data by domain. Store in LangGraph state as brand_context.
 */

import type { BrandContext } from "@/types";

const CLEARBIT_BASE = "https://company.clearbit.com/v2/companies/find";

function getApiKey(): string | null {
  return process.env.CLEARBIT_API_KEY ?? null;
}

export interface ClearbitCompany {
  name?: string;
  legalName?: string;
  domain?: string;
  logo?: string;
  description?: string;
  category?: { industry?: string };
  metrics?: { employees?: number; employeesRange?: string };
  location?: string;
  geo?: { country?: string; state?: string; city?: string };
}

export async function fetchCompanyByDomain(
  domain: string
): Promise<BrandContext | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }
  const normalizedDomain = domain.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
  if (!normalizedDomain) return null;

  try {
    const res = await fetch(
      `${CLEARBIT_BASE}?domain=${encodeURIComponent(normalizedDomain)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) {
      if (res.status === 404) return null;
      return null;
    }
    const data = (await res.json()) as ClearbitCompany;
    return {
      name: data.name ?? data.legalName ?? normalizedDomain,
      logo: data.logo ?? undefined,
      domain: data.domain ?? normalizedDomain,
      industry: data.category?.industry,
      category: data.category?.industry,
      employees: data.metrics?.employees,
      employeesRange: data.metrics?.employeesRange,
      location: data.location ?? [data.geo?.city, data.geo?.state, data.geo?.country].filter(Boolean).join(", "),
      country: data.geo?.country,
      description: data.description,
    };
  } catch {
    return null;
  }
}
