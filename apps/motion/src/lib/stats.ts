import type { ReelBuilding } from "./config";

export type ReelStats = {
  count: number;
  countries: number;
  fromYear: number;
  toYear: number;
  line: string;
};

export function computeStats(buildings: ReelBuilding[]): ReelStats {
  const count = buildings.length;
  const countries = new Set(buildings.map((b) => b.country)).size;
  const years = buildings.map((b) => b.year);
  const fromYear = Math.min(...years);
  const toYear = Math.max(...years);
  const span = fromYear === toYear ? `${fromYear}` : `${fromYear}–${toYear}`;
  const buildingWord = count === 1 ? "building" : "buildings";
  const countryWord = countries === 1 ? "country" : "countries";
  return { count, countries, fromYear, toYear, line: `${count} ${buildingWord} · ${countries} ${countryWord} · ${span}` };
}
