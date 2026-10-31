import Link from "next/link";

export const metadata = { title: "Terms & privacy — Metsi Water Monitor" };

export default function LegalPage() {
  return (
    <main className="ui-wrap" style={{ paddingBlock: 40, maxWidth: 720 }}>
      <Link href="/" className="ui-link">
        Back to dashboard
      </Link>
      <h1 style={{ fontSize: 26, marginTop: 14 }}>
        Terms, privacy &amp; sources
      </h1>
      <div
        className="ui-card"
        style={{ marginTop: 16, display: "grid", gap: 14, fontSize: 14 }}
      >
        <section>
          <h2 style={{ fontSize: 17 }}>Informational use only</h2>
          <p className="muted">
            Readings describe water level relative to full storage capacity.
            They are not official flood warnings and do not replace guidance
            from disaster-management authorities.
          </p>
        </section>
        <section>
          <h2 style={{ fontSize: 17 }}>Data sources</h2>
          <p className="muted">
            Weekly dam level readings from the Department of Water and
            Sanitation (DWS) Hydrology Services, station coordinates from the
            DWS Major Dams feature service, and 24-hour precipitation from
            Open-Meteo. Map tiles by OpenStreetMap contributors.
          </p>
        </section>
        <section>
          <h2 style={{ fontSize: 17 }}>Privacy</h2>
          <p className="muted">
            The public dashboard stores only a theme preference and a session
            cache of the last dataset in your browser. Account data (when
            accounts open) is used solely to deliver the alerts you request.
          </p>
        </section>
      </div>
    </main>
  );
}
