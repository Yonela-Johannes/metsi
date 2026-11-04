"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <form
      className="ui-card"
      style={{ marginTop: 16, display: "grid", gap: 12 }}
    >
      <div>
        <span className="eyebrow">
          <Icon name="user" size={13} /> Welcome back
        </span>
        <h1 style={{ fontSize: 24, marginTop: 6 }}>Log in</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Accounts unlock watch areas, email alerts and the API.
        </p>
      </div>
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="login-email">
          Email address
        </label>
        <input
          id="login-email"
          className="ui-input"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="ui-input"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="ui-btn ui-btn--primary">
        Log in
      </button>
      <p className="faint" style={{ fontSize: 12 }}>
        No account?{" "}
        <Link
          href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
        >
          Create a free one
        </Link>
        .
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="ui-wrap" style={{ paddingBlock: 48, maxWidth: 440 }}>
      <Link href="/" className="ui-link">
        <Icon name="chevron" size={14} /> Back to dashboard
      </Link>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
