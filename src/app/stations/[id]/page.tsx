import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { StatusBadge, Delta } from "@/components/visuals";
import { formatDate } from "@/lib/data";
import { loadDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";

export default async function StationPage({
  params,
}: {
  params: { id: string };
}) {
  const dataset = await loadDataset();
  const id = decodeURIComponent(params.id);
  const station = dataset.records.find(
    (r) => r.station_id === id || r.gauge === id,
  );
  if (!station) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Province", station.basin],
    ["River", station.river],
    ["Water level", `${station.water_level.toFixed(1)}% of full capacity`],
    [
      "Week change",
      <Delta key="d" value={station.water_level - station.last_week_lvl} />,
    ],
    ["Same week last year", `${station.last_year_lvl.toFixed(1)}%`],
    ["Full storage capacity", `${station.fsc_mcm.toFixed(1)} million m³`],
    ["24-hour rainfall", `${station.rain_fall.toFixed(1)} mm`],
    ["Alert threshold", `${station.alertpull}%`],
    ["Minor flood threshold", `${station.warningpull}%`],
    ["Major flood threshold", `${station.dangerpull}%`],
    ["Measurement date", formatDate(station.date)],
    ["Coordinates", `${station.latitude}, ${station.longitude}`],
    ["Data source", station.source],
  ];

  return (
    <main className="ui-wrap" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <Link href="/" className="ui-link">
        <Icon name="chevron" size={14} /> Back to dashboard
      </Link>
      <div className="ui-card" style={{ marginTop: 16 }}>
        <div className="ui-card__head">
          <div>
            <span className="eyebrow eyebrow--muted">
              <Icon name="pin" size={13} /> {station.basin} ·{" "}
              {station.station_id}
            </span>
            <h1 style={{ fontSize: 26, marginTop: 6 }}>{station.gauge}</h1>
          </div>
          <StatusBadge status={station.status} />
        </div>
        <dl className="station-page">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="faint" style={{ marginTop: 16 }}>
        Readings are informational. Follow official disaster-management guidance
        during flooding.
      </p>
    </main>
  );
}
