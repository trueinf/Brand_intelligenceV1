/**
 * Mock Data Agent: returns structured SEMrush-like data.
 * Replace with real API (SEMrush, Ahrefs, etc.) without changing graph logic.
 */

import { generateMockSemrushData } from "@/lib/mock-data";
import type { Brand, MockSemrushData } from "@/types";

export function getMockSemrushData(brand: Brand): MockSemrushData {
  return generateMockSemrushData(brand.brand_name, brand.domain);
}
