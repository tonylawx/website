"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authCopy, normalizeLocale, type Locale } from "@tonylaw/shared/i18n";
import { buildAuthApiUrl } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLocale(normalizeLocale(params.get("locale")));
  }, []);

  const text = authCopy[locale];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(buildAuthApiUrl("/api/public/auth/forgot-password"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale })
    });
    setSuccess(response.ok ? text.forgotSuccess : text.registerFailed);
  }

  return (
    <main className="px-4 pb-10 pt-6">
      <section className="theme-shell max-w-[460px]">
        <div className="theme-paper overflow-hidden">
          <div className="theme-header-panel">
            <p className="theme-eyebrow m-0">tonylaw.cc</p>
            <h1 className="mt-3 text-[34px] leading-[1.05] font-semibold">{text.forgotTitle}</h1>
            <p className="mt-3 text-sm text-white/80">{text.forgotDescription}</p>
          </div>
          <section className="p-4 md:p-5">
            <div className="theme-card p-5 md:p-6">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <label className="theme-label">
                  {text.emailLabel}
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="theme-input" />
                </label>
                {success ? <p className="theme-status-success m-0">{success}</p> : null}
                <button type="submit" className="theme-button-primary">{text.forgotSubmit}</button>
              </form>
              <div className="mt-4 text-sm">
                <Link href={`/signin?locale=${locale}`} className="text-navy underline">{text.backToSignin}</Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
