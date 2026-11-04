import type { MetadataRoute } from "next";
import { loadDataset } from "@/lib/dataset";

export const dynamic = "force-static";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { records } = await loadDataset();
  const seen = new Set<string>();
  const stations = records.filter((r) => {
    if (seen.has(r.station_id)) return false;
    seen.add(r.station_id);
    return true;
  });

  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/legal`, changeFrequency: "yearly", priority: 0.2 },
    ...stations.map((s) => ({
      url: `${BASE}/stations/${encodeURIComponent(s.station_id)}`,
      changeFrequency: "daily" as const,
      priority: 0.4,
    })),
  ];
}
