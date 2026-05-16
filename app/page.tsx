"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { getAuthApiUrl } from "@tonylaw/auth/shared";
import { ChevronDown, LogOut } from "lucide-react";
import { IOSInstallBanner } from "@/components/ios-install-banner";
import { OptionYieldCalculator } from "@/components/option-yield-calculator";
import { ReportPage } from "@/components/report-page";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import type { SecuritySearchResult, SellPutOpportunitiesResponse, SellPutOpportunity, SellPutReport } from "@/server/report/types";
import { HOSTNAME, LOCALE, SEARCH_BOOTSTRAP_QUERY, TAB, TabKey } from "@/shared/constants";
import type { Locale } from "@/shared/i18n";
import { uiCopy } from "@/shared/i18n";

export const dynamic = "force-dynamic";

const DEFAULT_SYMBOL = "QQQ.US";
const PROD_API_BASE_URL = "https://api.tonylaw.cc/optix";
const SECURITIES_STORAGE_KEY = "optix-us-securities-cache";
const SECURITIES_STORAGE_VERSION = 1;
const MIN_VALID_SECURITIES_CACHE_SIZE = 100;

type CurrentUser = {
  id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
};

function displaySymbol(symbol: string) {
  return symbol.replace(/\.US$/, "");
}

function normalizeSymbol(symbol?: string | null) {
  if (!symbol) {
    return DEFAULT_SYMBOL;
  }

  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed) {
    return DEFAULT_SYMBOL;
  }

  return trimmed.endsWith(".US") ? trimmed : `${trimmed}.US`;
}

function formatPercent(value: number | null | undefined, digits = 1) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(digits)}%` : "--";
}

function formatMoney(value: number | null | undefined, digits = 2) {
  return typeof value === "number" && Number.isFinite(value) ? `$${value.toFixed(digits)}` : "--";
}

function formatDateTime(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale === LOCALE.EN ? "en-US" : "zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function statusClassName(status: SellPutOpportunity["riskLevel"] | SellPutOpportunity["eventRisk"]["status"]) {
  if (status === "good") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "watch") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-rose-50 text-app-rose";
}

function getApiBaseUrl() {
  const withOptixPrefix = (value: string) =>
    value.replace(/\/$/, "").endsWith("/optix")
      ? value.replace(/\/$/, "")
      : `${value.replace(/\/$/, "")}/optix`;

  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return withOptixPrefix(process.env.NEXT_PUBLIC_API_BASE_URL);
  }

  if (typeof window !== "undefined" && window.location.hostname === HOSTNAME.LOCALHOST) {
    return withOptixPrefix("http://localhost:3001");
  }

  return withOptixPrefix(PROD_API_BASE_URL);
}

function ReportSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-app-navy/8 bg-[#fffaf2] shadow-app animate-pulse">
      <div className="bg-gradient-to-b from-app-navy to-[#252848] px-6 py-5">
        <div className="h-3 w-28 rounded-full bg-white/16" />
        <div className="mt-3 h-8 w-56 rounded-full bg-white/22" />
        <div className="mt-2 h-4 w-40 rounded-full bg-white/14" />
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="h-5 w-28 rounded-full bg-white/18" />
          <div className="h-7 w-24 rounded-full bg-white/22" />
        </div>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-2">
        <div className="rounded-[18px] border border-app-navy/7 bg-white p-4">
          <div className="h-5 w-36 rounded-full bg-app-navy/8" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-3 w-12 rounded-full bg-app-navy/8" />
                    <div className="h-4 w-16 rounded-full bg-app-navy/10" />
                  </div>
                  <div className="h-2.5 flex-1 rounded-full bg-app-navy/8" />
                  <div className="h-3 w-8 rounded-full bg-app-navy/8" />
                </div>
                <div className="mt-2 h-3 w-40 rounded-full bg-app-navy/6" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-app-line pt-4">
            <div className="h-8 w-32 rounded-full bg-app-navy/10" />
            <div className="h-8 w-24 rounded-full bg-app-navy/10" />
          </div>
        </div>

        <div className="rounded-[18px] border border-app-navy/7 bg-white p-4">
          <div className="h-5 w-28 rounded-full bg-app-navy/8" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="h-4 w-16 rounded-full bg-app-navy/8" />
                <div className="h-4 w-20 rounded-full bg-app-navy/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-[18px] border border-app-navy/7 bg-white p-4">
        <div className="h-5 w-32 rounded-full bg-app-navy/8" />
        <div className="mt-3 h-6 w-56 rounded-full bg-app-navy/10" />
        <div className="mt-2 h-4 w-64 rounded-full bg-app-navy/6" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 w-32 rounded-full bg-app-navy/8" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }).map((__, row) => (
                  <div key={row} className="h-8 rounded-xl bg-app-navy/6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-[18px] border border-app-navy/7 bg-white p-4">
        <div className="h-5 w-24 rounded-full bg-app-navy/8" />
        <div className="mt-3 h-4 w-72 max-w-full rounded-full bg-app-navy/6" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-t border-app-navy/6 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-5 w-28 rounded-full bg-app-navy/10" />
                  <div className="h-4 w-36 rounded-full bg-app-navy/6" />
                </div>
                <div className="h-7 w-20 rounded-full bg-app-navy/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({
  item,
  rank,
  locale,
  onViewReport
}: {
  item: SellPutOpportunity;
  rank: number;
  locale: Locale;
  onViewReport: (symbol: string) => void;
}) {
  const text = uiCopy[locale];
  const stars = `${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}`;

  return (
    <article className="rounded-[26px] border border-app-line bg-white/92 p-3 shadow-app sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="flex min-w-0 gap-3">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold", statusClassName(item.riskLevel))}>
            #{rank}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-app-navy">
                {displaySymbol(item.symbol)} ${item.strike.toFixed(0)} Put
              </h3>
              <p className="mt-1 truncate text-sm text-app-muted">
                {item.contractSymbol} · {item.expiryDate.slice(5)} · DTE {item.dte}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusClassName(item.riskLevel))}>
            {stars} · {item.score}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard?.writeText(item.contractSymbol);
            }}
          >
            {text.opportunitiesCopyContract}
          </Button>
          <Button size="sm" onClick={() => onViewReport(item.symbol)}>
            {text.opportunitiesViewReport}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {[
          [text.opportunityAnnualizedYield, formatPercent(item.annualizedYield)],
          [text.opportunityBuffer, formatPercent(item.downsideBuffer)],
          [text.opportunityDelta, item.delta === null ? "--" : Math.abs(item.delta).toFixed(2)],
          [text.opportunityBidAsk, item.ask === null ? formatMoney(item.bid) : `${formatMoney(item.bid)} / ${formatMoney(item.ask)}`],
          [text.opportunityOi, item.openInterest.toLocaleString()],
          [text.opportunityVolume, item.volume.toLocaleString()],
          [text.opportunityScore, `${item.score}`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-[#f8f5ed] px-3 py-2">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-app-muted uppercase">{label}</p>
            <p className="mt-1 text-sm font-semibold text-app-navy">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.factors.map((factor) => (
          <span key={`${item.contractSymbol}-${factor.label}`} className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClassName(factor.status))}>
            {factor.label} {factor.value}
          </span>
        ))}
      </div>
    </article>
  );
}

function OpportunitiesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[24px] border border-app-line bg-white/80 p-4 shadow-app animate-pulse">
          <div className="h-6 w-64 rounded-full bg-app-navy/10" />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((__, row) => (
              <div key={row} className="h-14 rounded-2xl bg-app-navy/6" />
            ))}
          </div>
          <div className="mt-4 h-20 rounded-2xl bg-app-navy/6" />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [locale, setLocale] = useState<Locale>(LOCALE.ZH);
  const [tab, setTab] = useState<TabKey>(TAB.REPORT);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");
  const [report, setReport] = useState<SellPutReport | null>(null);
  const [opportunities, setOpportunities] = useState<SellPutOpportunitiesResponse | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [query, setQuery] = useState(displaySymbol(DEFAULT_SYMBOL));
  const [securities, setSecurities] = useState<SecuritySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [reportError, setReportError] = useState("");
  const [opportunitiesError, setOpportunitiesError] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const attemptedRemoteQueryRef = useRef<string>("");
  const activeRemoteQueryRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setCurrentUrl(window.location.href);

    const params = new URLSearchParams(window.location.search);
    const nextSymbol = normalizeSymbol(params.get("symbol"));
    const rawTab = params.get("tab");
    const nextTab =
      rawTab === TAB.CALCULATOR
        ? TAB.CALCULATOR
        : rawTab === TAB.OPPORTUNITIES
          ? TAB.OPPORTUNITIES
          : TAB.REPORT;
    setTab(nextTab);
    setSelectedSymbol(nextSymbol);
    setQuery(displaySymbol(nextSymbol));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const rankedSecurities = securities.filter((security) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      security.symbol.toLowerCase().includes(normalizedQuery) ||
      security.name.toLowerCase().includes(normalizedQuery) ||
      displaySymbol(security.symbol).toLowerCase().includes(normalizedQuery)
    );
  }).sort((a, b) => {
    const aCode = displaySymbol(a.symbol).toLowerCase();
    const bCode = displaySymbol(b.symbol).toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const rank = (code: string, name: string) => {
      if (code === normalizedQuery) return 0;
      if (code.startsWith(normalizedQuery)) return 1;
      if (name.startsWith(normalizedQuery)) return 2;
      if (code.includes(normalizedQuery)) return 3;
      return 4;
    };

    const byRank = rank(aCode, aName) - rank(bCode, bName);
    if (byRank !== 0) return byRank;

    const byCodeLength = aCode.length - bCode.length;
    if (byCodeLength !== 0) return byCodeLength;

    return aCode.localeCompare(bCode);
  });

  const results = (() => {
    if (!normalizedQuery) {
      return rankedSecurities.slice(0, 20);
    }

    if (rankedSecurities.length >= 5) {
      return rankedSecurities.slice(0, 20);
    }

    const seen = new Set(rankedSecurities.map((security) => security.symbol));
    const fallback = securities.filter((security) => !seen.has(security.symbol)).slice(0, 5 - rankedSecurities.length);
    return [...rankedSecurities, ...fallback].slice(0, 20);
  })();

  function readCachedSecurities() {
    if (typeof window === "undefined") {
      return [] as SecuritySearchResult[];
    }

    try {
      const raw = window.localStorage.getItem(SECURITIES_STORAGE_KEY);
      if (!raw) {
        return [] as SecuritySearchResult[];
      }

      const parsed = JSON.parse(raw) as
        | SecuritySearchResult[]
        | { version?: number; data?: SecuritySearchResult[] };

      const nextResults = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.data) && parsed.version === SECURITIES_STORAGE_VERSION
          ? parsed.data
          : [];

      return nextResults.length >= MIN_VALID_SECURITIES_CACHE_SIZE ? nextResults : [];
    } catch {
      return [] as SecuritySearchResult[];
    }
  }

  function writeCachedSecurities(nextSecurities: SecuritySearchResult[]) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        SECURITIES_STORAGE_KEY,
        JSON.stringify({
          version: SECURITIES_STORAGE_VERSION,
          data: nextSecurities
        })
      );
    } catch {
      // Ignore localStorage write failures.
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("symbol") === selectedSymbol && params.get("tab") === tab) {
      return;
    }

    params.set("symbol", selectedSymbol);
    params.set("tab", tab);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [selectedSymbol, tab]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      setIsLoadingUser(true);

      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        const payload = (await response.json()) as { user?: CurrentUser | null };
        if (!cancelled) {
          setCurrentUser(payload.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUser(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReport(symbol: string) {
      setIsLoadingReport(true);
      setReportError("");

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/report?symbol=${encodeURIComponent(symbol)}&locale=${locale}`, {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to load report: ${response.status}`);
        }

        const nextReport = (await response.json()) as SellPutReport;
        if (!cancelled) {
          startTransition(() => {
            setReport(nextReport);
          });
        }
      } catch {
        if (!cancelled) {
          setReport(null);
          setReportError(uiCopy[locale].reportLoadFailure);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReport(false);
        }
      }
    }

    void loadReport(selectedSymbol);

    return () => {
      cancelled = true;
    };
  }, [selectedSymbol, locale]);

  useEffect(() => {
    let cancelled = false;

    async function loadOpportunities() {
      setIsLoadingOpportunities(true);
      setOpportunitiesError("");

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/opportunities/sell-put?locale=${locale}`, {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to load opportunities: ${response.status}`);
        }

        const nextOpportunities = (await response.json()) as SellPutOpportunitiesResponse;
        if (!cancelled) {
          setOpportunities(nextOpportunities);
        }
      } catch {
        if (!cancelled) {
          setOpportunities(null);
          setOpportunitiesError(uiCopy[locale].opportunitiesLoadFailure);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOpportunities(false);
        }
      }
    }

    if (tab === TAB.OPPORTUNITIES) {
      void loadOpportunities();
    }

    return () => {
      cancelled = true;
    };
  }, [locale, tab]);

  async function refreshOpportunities() {
    setIsLoadingOpportunities(true);
    setOpportunitiesError("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/opportunities/sell-put?refresh=true&locale=${locale}`, {
        cache: "no-store",
        credentials: "include"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? `Failed to refresh opportunities: ${response.status}`);
      }

      setOpportunities((await response.json()) as SellPutOpportunitiesResponse);
    } catch {
      setOpportunitiesError(uiCopy[locale].opportunitiesLoadFailure);
    } finally {
      setIsLoadingOpportunities(false);
    }
  }

  useEffect(() => {
    const cached = readCachedSecurities();
    if (cached.length > 0) {
      setSecurities(cached);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    async function loadSecurities() {
      setIsSearching(true);
      setSearchError("");
      attemptedRemoteQueryRef.current = SEARCH_BOOTSTRAP_QUERY;
      activeRemoteQueryRef.current = SEARCH_BOOTSTRAP_QUERY;

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/securities`, {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to load securities: ${response.status}`);
        }

        const nextResults = (await response.json()) as SecuritySearchResult[];
        if (!cancelled) {
          setSecurities(nextResults);
          writeCachedSecurities(nextResults);
        }
      } catch {
        if (!cancelled) {
          setSecurities([]);
          setSearchError(uiCopy[locale].securitiesLoadFailure);
        }
        attemptedRemoteQueryRef.current = "";
        activeRemoteQueryRef.current = "";
      } finally {
        if (!cancelled && activeRemoteQueryRef.current === SEARCH_BOOTSTRAP_QUERY) {
          setIsSearching(false);
          activeRemoteQueryRef.current = "";
        }
      }
    }

    void loadSecurities();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setIsSearching(false);
      attemptedRemoteQueryRef.current = "";
      activeRemoteQueryRef.current = "";
      return;
    }

    if (results.length > 0) {
      setIsSearching(false);
      activeRemoteQueryRef.current = "";
      return;
    }

    if (attemptedRemoteQueryRef.current === normalized) {
      return;
    }

    let cancelled = false;

    async function refreshSecurities() {
      setIsSearching(true);
      setSearchError("");
      attemptedRemoteQueryRef.current = normalized;
      activeRemoteQueryRef.current = normalized;

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/securities`, {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to load securities: ${response.status}`);
        }

        const nextResults = (await response.json()) as SecuritySearchResult[];
        if (!cancelled) {
          setSecurities(nextResults);
          writeCachedSecurities(nextResults);
        }
      } catch {
        if (!cancelled) {
          setSearchError(uiCopy[locale].securitiesLoadFailure);
        }
        attemptedRemoteQueryRef.current = "";
        activeRemoteQueryRef.current = "";
      } finally {
        if (!cancelled && activeRemoteQueryRef.current === normalized) {
          setIsSearching(false);
          activeRemoteQueryRef.current = "";
        }
      }
    }

    void refreshSecurities();

    return () => {
      cancelled = true;
    };
  }, [locale, query, results.length]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  function chooseSecurity(security: SecuritySearchResult) {
    setSelectedSymbol(security.symbol);
    setQuery(displaySymbol(security.symbol));
    setOpen(false);
  }

  const text = uiCopy[locale];
  const searchStatusText = isLoadingReport
    ? text.loading
    : isSearching
      ? text.searching
      : report
        ? displaySymbol(report.symbol)
        : "--";
  const showSearchClear = isSearchFocused && Boolean(query) && !isLoadingReport && !isSearching;
  const tabOptions = [
    { value: TAB.REPORT, label: text.reportTab },
    { value: TAB.OPPORTUNITIES, label: text.opportunitiesTab },
    { value: TAB.CALCULATOR, label: text.calculatorTab }
  ] as const;
  const localeOptions = [
    { value: LOCALE.ZH, label: text.localeZh },
    { value: LOCALE.EN, label: text.localeEn }
  ] as const;
  const accountName = currentUser?.name || currentUser?.email?.split("@")[0] || text.accountAnonymous;
  const signOutHref = currentUrl
    ? `${getAuthApiUrl()}/api/public/auth/sign-out?callbackUrl=${encodeURIComponent(currentUrl)}`
    : "#";

  return (
    <main className="px-4 py-3 sm:py-4">
      <section className="mx-auto max-w-[980px]">
        <IOSInstallBanner locale={locale} />

        <div className="mb-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SegmentedControl
                className="shrink-0"
                itemClassName="min-w-12 px-3"
                onValueChange={(value) => setLocale(value as Locale)}
                options={localeOptions}
                value={locale}
              />
            </div>

            <div className="min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-12 max-w-[46vw] rounded-full border border-app-line bg-white/82 px-4 text-sm font-semibold text-app-navy shadow-app hover:bg-white"
                    variant="outline"
                  >
                    <span className="truncate">
                      {isLoadingUser ? text.accountLoading : accountName}
                    </span>
                    <ChevronDown className="ml-2 size-4 shrink-0 text-app-muted" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      window.location.href = signOutHref;
                    }}
                  >
                    <LogOut className="size-4" />
                    {text.accountSignOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <SegmentedControl
            className="min-w-0"
            itemClassName="flex-1"
            onValueChange={(value) => setTab(value as TabKey)}
            options={tabOptions}
            value={tab}
          />
        </div>

        {tab === TAB.REPORT ? (
          <>
            <div ref={boxRef} className="relative mb-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="symbol-search" className="text-xs font-medium tracking-[0.08em] text-app-muted uppercase">
                  {text.searchLabel}
                </label>
              </div>

              <div className="rounded-[22px] border border-app-line bg-white/86 p-2 shadow-app backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-[18px] bg-[#fcfbf8] px-4 py-3">
                  <Input
                    id="symbol-search"
                    className="min-w-0 flex-1 text-lg font-semibold"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setOpen(true);
                    }}
                    onFocus={() => {
                      setOpen(true);
                      setIsSearchFocused(true);
                    }}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder={text.searchPlaceholder}
                    unstyled
                    autoComplete="off"
                  />
                  <div className="flex shrink-0 items-center justify-end">
                    {showSearchClear ? (
                      <Button
                        className="size-7 rounded-full bg-app-navy/8 p-0 text-base leading-none text-app-muted hover:bg-app-navy/12"
                        variant="ghost"
                        size="icon"
                        aria-label={text.clearInput}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuery("");
                          setOpen(true);
                        }}
                      >
                        ×
                      </Button>
                    ) : (
                      <div className="text-right text-sm font-medium text-app-muted">
                        {searchStatusText}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {open && results.length > 0 ? (
                <div className="absolute z-20 mt-2 w-full rounded-[22px] border border-app-line bg-white/96 p-2 shadow-app backdrop-blur-sm">
                  <div className="h-[320px] max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-1">
                      {results.map((security) => (
                        <Button
                          key={security.symbol}
                          className="min-h-15 h-auto w-full justify-start rounded-2xl px-4 py-3 text-left hover:bg-app-navy/6"
                          variant="ghost"
                          onClick={() => chooseSecurity(security)}
                        >
                          <div className="grid gap-0.5">
                            <strong className="text-sm text-app-navy">{displaySymbol(security.symbol)}</strong>
                            <span className="text-xs text-app-muted">{security.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {searchError ? (
                <p className="mt-2 text-sm text-app-rose">{searchError}</p>
              ) : null}
              {reportError ? (
                <p className="mt-2 text-sm text-app-rose">{reportError}</p>
              ) : null}
            </div>

            {report ? <ReportPage report={report} compact locale={locale} /> : null}
            {!report && isLoadingReport ? <ReportSkeleton /> : null}
          </>
        ) : tab === TAB.OPPORTUNITIES ? (
          <section className="rounded-[28px] border border-app-line bg-[#fffaf2]/86 p-3 shadow-app sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-app-navy">{text.opportunitiesTitle}</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-app-muted">{text.opportunitiesSubtitle}</p>
                {opportunities ? (
                  <p className="mt-2 text-xs font-medium text-app-muted">
                    {text.opportunitiesGeneratedAt}: {formatDateTime(opportunities.generatedAt, locale)}
                  </p>
                ) : null}
              </div>

              <Button
                className="rounded-full"
                disabled={isLoadingOpportunities}
                onClick={() => {
                  void refreshOpportunities();
                }}
              >
                {isLoadingOpportunities ? text.loading : text.opportunitiesRefresh}
              </Button>
            </div>

            {opportunitiesError ? (
              <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-app-rose">
                {opportunitiesError}
              </p>
            ) : null}

            {isLoadingOpportunities && !opportunities ? <OpportunitiesSkeleton /> : null}

            {opportunities && opportunities.candidates.length > 0 ? (
              <div className="space-y-3">
                {opportunities.candidates.map((item, index) => (
                  <OpportunityCard
                    key={item.contractSymbol}
                    item={item}
                    rank={index + 1}
                    locale={locale}
                    onViewReport={(symbol) => {
                      setSelectedSymbol(symbol);
                      setQuery(displaySymbol(symbol));
                      setTab(TAB.REPORT);
                    }}
                  />
                ))}
              </div>
            ) : null}

            {opportunities && opportunities.candidates.length === 0 && !isLoadingOpportunities ? (
              <div className="rounded-[24px] border border-app-line bg-white/90 p-5 text-sm font-medium text-app-muted">
                {text.opportunitiesNoCandidates}
              </div>
            ) : null}

            <p className="mt-4 text-xs leading-5 text-app-muted">{text.opportunitiesDisclaimer}</p>
          </section>
        ) : (
          <OptionYieldCalculator locale={locale} />
        )}
      </section>
    </main>
  );
}
