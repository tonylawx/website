type EarningsSnapshot = {
  date: Date | null;
  fiscalQuarter: string | null;
};

type CachedEarnings = {
  snapshot: EarningsSnapshot;
  expiresAt: number;
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, CachedEarnings>();

function extractYahooEarningsSnapshot(html: string): EarningsSnapshot {
  const normalized = html.replace(/\\"/g, "\"");

  if (!/Earnings Date/i.test(normalized)) {
    return { date: null, fiscalQuarter: null };
  }

  const trendMatch = normalized.match(/"earningsTrend":\{[\s\S]{0,6000}?"earningsDate":\[\{"raw":(\d+),"fmt":"(\d{4}-\d{2}-\d{2})"/);
  const fallbackMatch = normalized.match(/"earningsDate":\[\{"raw":(\d+),"fmt":"(\d{4}-\d{2}-\d{2})"/);
  const match = trendMatch ?? fallbackMatch;
  const fiscalQuarterMatch = normalized.match(/"currentFiscalQuarter":"([1-4]Q\d{4}|FY\d{4}Q[1-4]|Q[1-4]\d{4}|\d{4}Q[1-4])"/i);
  const fiscalQuarter = fiscalQuarterMatch?.[1] ?? null;

  if (!match) {
    return { date: null, fiscalQuarter };
  }

  const timestamp = Number(match[1]);
  if (Number.isFinite(timestamp)) {
    return { date: new Date(timestamp * 1000), fiscalQuarter };
  }

  const parsed = new Date(match[2]);
  return { date: Number.isNaN(parsed.getTime()) ? null : parsed, fiscalQuarter };
}

export async function getNextEarningsDate(symbol: string) {
  const ticker = symbol.replace(/\.US$/, "").toUpperCase();
  const now = Date.now();
  const cached = cache.get(ticker);

  if (cached && cached.expiresAt > now) {
    return cached.snapshot;
  }

  const response = await fetch(`https://finance.yahoo.com/quote/${ticker}`, {
    headers: {
      "user-agent": "Mozilla/5.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to load earnings page for ${ticker}: ${response.status}`);
  }

  const html = await response.text();
  const snapshot = extractYahooEarningsSnapshot(html);

  cache.set(ticker, {
    snapshot,
    expiresAt: now + CACHE_TTL_MS
  });

  return snapshot;
}
