import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { GaugeDataset } from "./types";

const DATA_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "gauges_2_view.json",
);

/** Read the DWS dataset that the GitHub Action refreshes every 5 minutes. */
export async function loadDataset(): Promise<GaugeDataset> {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as GaugeDataset;
}
