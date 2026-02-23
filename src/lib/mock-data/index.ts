/**
 * Mock SEMrush-like data generator.
 * Replace this module with real API calls (e.g. SEMrush, Ahrefs) without changing UI or agents.
 */

import type {
  MockSemrushData,
  DomainOverview,
  PaidKeyword,
  AdCopy,
  PaidLandingPage,
  OrganicKeyword,
  Competitor,
  TrafficTrendPoint,
} from "@/types";

const MONTHS_AGO = 12;
const now = new Date();

function dateStr(monthsBack: number) {
  const d = new Date(now);
  d.setMonth(d.getMonth() - monthsBack);
  return d.toISOString().slice(0, 10);
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function vary(base: number, seed: number, pct = 0.3): number {
  const r = (seed % 1000) / 1000;
  const delta = base * pct * (r - 0.5) * 2;
  return Math.round(base + delta);
}

export function generateMockSemrushData(brandName: string, domain: string): MockSemrushData {
  const seed = seedFromString(brandName.toLowerCase() + domain.toLowerCase());
  const domainOverview: DomainOverview = {
    domain,
    globalRank: vary(15000, seed, 0.5),
    countryRank: vary(1200, seed + 1, 0.4),
    organicTraffic: vary(280000, seed + 2, 0.35),
    organicKeywords: vary(4200, seed + 3, 0.25),
    paidTraffic: vary(45000, seed + 4, 0.4),
    paidKeywords: vary(180, seed + 5, 0.3),
    trafficCost: vary(85000, seed + 6, 0.35),
    keywordsDifficulty: 42 + (seed % 35),
    lastUpdated: now.toISOString().slice(0, 10),
  };

  const paidKwTemplates = [
    { k: `${brandName} discount`, v: 1200, c: 2.1 },
    { k: `buy ${brandName}`, v: 800, c: 3.2 },
    { k: `${brandName} review`, v: 600, c: 1.8 },
    { k: `${brandName} login`, v: 2400, c: 0.9 },
    { k: `${brandName} customer service`, v: 400, c: 4.5 },
    { k: `best ${brandName} alternative`, v: 320, c: 5.2 },
    { k: `${domain} pricing`, v: 550, c: 2.8 },
    { k: `cheap ${brandName}`, v: 280, c: 3.1 },
    { k: `${brandName} app`, v: 1900, c: 1.2 },
    { k: `${brandName} sign up`, v: 1100, c: 1.5 },
  ];

  const paid_keywords: PaidKeyword[] = paidKwTemplates.slice(0, 6 + (seed % 4)).map((t, i) => ({
    keyword: t.k,
    volume: vary(t.v, seed + 10 + i),
    cpc: Number((t.c * (0.8 + (seed % 40) / 100)).toFixed(2)),
    competition: 0.3 + (seed % 70) / 100,
    position: 1 + (i % 5),
    url: `https://${domain}/${i % 3 === 0 ? "pricing" : "features"}`,
  }));

  const ad_copies: AdCopy[] = [
    {
      title: `${brandName} - Official Site | Best Deals`,
      description: "Discover offers and get support. Trusted by millions.",
      displayUrl: `https://${domain}`,
      visibleUrl: domain,
      position: 1,
    },
    {
      title: `Buy ${brandName} - Free Shipping`,
      description: "Shop now and save. Limited time offer.",
      displayUrl: `https://${domain}/shop`,
      visibleUrl: `${domain}/shop`,
      position: 2,
    },
  ];

  const paid_landing_pages: PaidLandingPage[] = [
    { url: `https://${domain}`, traffic: vary(18000, seed + 20), keywords: 45 },
    { url: `https://${domain}/pricing`, traffic: vary(12000, seed + 21), keywords: 28 },
    { url: `https://${domain}/signup`, traffic: vary(8000, seed + 22), keywords: 15 },
  ];

  const organicKwTemplates = [
    { k: brandName, v: 5000 },
    { k: `${brandName} login`, v: 2200 },
    { k: `${domain}`, v: 1800 },
    { k: `${brandName} customer service`, v: 600 },
    { k: `${brandName} review`, v: 450 },
  ];

  const organic_keywords: OrganicKeyword[] = organicKwTemplates.map((t, i) => ({
    keyword: t.k,
    volume: vary(t.v, seed + 30 + i),
    position: 1 + (i % 4),
    url: `https://${domain}`,
    trafficShare: 15 + (seed % 20) - i * 3,
  }));

  const competitorDomains = [
    "competitor1.com",
    "competitor2.io",
    "competitor3.com",
    "competitor4.co",
    "competitor5.com",
  ];

  const competitors: Competitor[] = competitorDomains.slice(0, 3 + (seed % 2)).map((d, i) => ({
    domain: d,
    commonKeywords: vary(120, seed + 40 + i),
    organicTraffic: vary(150000, seed + 50 + i),
    paidTraffic: vary(30000, seed + 60 + i),
    overlap: 25 + (seed % 30),
  }));

  const traffic_trend: TrafficTrendPoint[] = Array.from({ length: MONTHS_AGO }, (_, i) => {
    const organic = vary(domainOverview.organicTraffic / MONTHS_AGO, seed + 70 + i);
    const paid = vary(domainOverview.paidTraffic / MONTHS_AGO, seed + 80 + i);
    return {
      date: dateStr(MONTHS_AGO - 1 - i),
      organic,
      paid,
      total: organic + paid,
    };
  });

  return {
    domain_overview: domainOverview,
    paid_keywords,
    ad_copies,
    paid_landing_pages,
    organic_keywords,
    competitors,
    traffic_trend,
  };
}
