/**
 * Brand Input Agent: normalizes user input into brand_name and domain.
 * Pure logic; swappable for real lookup later.
 */

import type { Brand } from "@/types";

export function normalizeBrandInput(input: string): Brand {
  const raw = (input || "").trim();
  if (!raw) {
    return { brand_name: "Unknown Brand", domain: "example.com" };
  }

  let domain = raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "")
    .trim();

  const hasTld = /\.(com|io|co|net|org|app|dev|ai|cloud|tech)$/i.test(domain);
  if (hasTld) {
    const brand_name = domain
      .split(".")[0]
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      brand_name: brand_name || raw,
      domain: domain.toLowerCase(),
    };
  }

  const slug = raw.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  const brand_name = raw.replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    brand_name,
    domain: slug ? `${slug}.com` : "example.com",
  };
}
