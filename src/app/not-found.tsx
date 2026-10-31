import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ui-wrap" style={{ padding: "80px 16px", maxWidth: 680 }}>
      <p className="eyebrow">404</p>
      <h1>That page is not on the map</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        The station or report you asked for does not exist. Head back to the
        live overview.
      </p>
      <p style={{ marginTop: 20 }}>
        <Link className="ui-btn ui-btn--primary" href="/">
          Back to the overview
        </Link>
      </p>
    </main>
  );
}
