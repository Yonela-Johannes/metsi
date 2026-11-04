"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";

function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <form
      className="ui-card"
      style={{ marginTop: 16, display: "grid", gap: 12 }}
    >
      <div>
        <span className="eyebrow">
          <Icon name="sparkle" size={13} /> Free account
        </span>
        <h1 style={{ fontSize: 24, marginTop: 6 }}>Create your account</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {next
            ? `This unlocks: ${next.replace(/^\//, "").replace(/[?=]/g, " ")}.`
            : "Save watch areas, get alerts when a gauge near you passes its threshold, and export the feed."}
        </p>
      </div>
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="signup-name">
          Full name
        </label>
        <input
          id="signup-name"
          className="ui-input"
          required
          autoComplete="name"
        />
      </div>
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="signup-email">
          Email address
        </label>
        <input
          id="signup-email"
          className="ui-input"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <label className="account-card__terms">
        <input type="checkbox" required />
        <span>
          I agree to the <Link href="/terms">terms</Link> and{" "}
          <Link href="/privacy">privacy policy</Link>.
        </span>
      </label>
      <button type="submit" className="ui-btn ui-btn--primary">
        Create free account
      </button>
      <p className="faint" style={{ fontSize: 12 }}>
        Already registered? <Link href="/login">Log in</Link>.
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <main className="ui-wrap" style={{ paddingBlock: 48, maxWidth: 480 }}>
      <Link href="/" className="ui-link">
        <Icon name="chevron" size={14} /> Back to dashboard
      </Link>
      <Suspense fallback={<div>Loading...</div>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
