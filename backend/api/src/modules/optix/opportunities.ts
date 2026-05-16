import type { Context } from "hono";
import type {
  SellPutOpportunitiesResponse,
  SellPutOpportunity
} from "@tonylaw/contracts/report";
import {
  getSellPutOpportunityRun,
  saveSellPutOpportunityRun
} from "@tonylaw/db/opportunities";
import { buildSellPutReport } from "./report/build-report";
import {
  createLongbridgeDate,
  getOptionChainByDate,
  getOptionChainExpiryDates,
  getOptionCalcIndexes,
  getOptionDepth
} from "./report/longbridge";

type CalcIndexLike = {
  symbol?: unknown;
  lastDone?: unknown;
  volume?: unknown;
  openInterest?: unknown;
  impliedVolatility?: unknown;
  delta?: unknown;
  gamma?: unknown;
  theta?: unknown;
  vega?: unknown;
  rho?: unknown;
  toJSON?: () => Record<string, unknown>;
};

type DepthLike = {
  bids?: Array<{ price?: unknown; volume?: unknown }>;
  asks?: Array<{ price?: unknown; volume?: unknown }>;
  toJSON?: () => Record<string, unknown>;
};

type QuoteSnapshot = {
  symbol: string;
  last: number | null;
  bid: number | null;
  ask: number | null;
  volume: number;
  openInterest: number;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  rho: number | null;
};

const UNIVERSE = [
  "SPY.US",
  "QQQ.US",
  "NVDA.US",
  "TSLA.US",
  "AAPL.US",
  "MSFT.US",
  "AMZN.US",
  "META.US",
  "AMD.US",
  "PLTR.US"
] as const;

const MIN_DTE = 7;
const MAX_DTE = 45;
const MIN_BID = 0.2;
const MIN_ANNUALIZED_YIELD = 20;
const MAX_SPREAD_RATIO = 0.2;
const MIN_OPEN_INTEREST = 300;
const MIN_VOLUME = 50;
const MIN_DELTA = 0.1;
const MAX_DELTA = 0.3;
const MIN_DOWNSIDE_BUFFER = 5;
const MAX_DOWNSIDE_BUFFER = 25;
const TARGET_DOWNSIDE_BUFFER = 12;
const MAX_QUOTES_PER_EXPIRY = 20;
const MAX_DEPTH_CHECKS_PER_SYMBOL = 1;
const TOP_CANDIDATES = 10;
const CACHE_TTL_MS = 15 * 60 * 1000;
const SYMBOL_SCAN_DELAY_MS = 2500;
const RATE_LIMIT_RETRY_DELAY_MS = 45_000;
const RATE_LIMIT_RETRY_COUNT = 2;
const MARKET_OPEN_SNAPSHOT_HOUR_NY = 10;
const MARKET_OPEN_SNAPSHOT_MINUTE_NY = 0;
const WEEKDAY_INDEX = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7
} as const;

let cachedResponse: { expiresAt: number; data: SellPutOpportunitiesResponse } | null = null;

function num(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function nullableNum(value: unknown) {
  const parsed = num(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateString(value: unknown) {
  return String(value).slice(0, 10);
}

function dteFromDate(date: string) {
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [year, month, day] = date.split("-").map(Number);
  const expiry = Date.UTC(year, month - 1, day);
  return Math.ceil((expiry - start) / (24 * 60 * 60 * 1000));
}

function todayTradeDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function newYorkTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";

  return {
    weekday: WEEKDAY_INDEX[get("weekday") as keyof typeof WEEKDAY_INDEX] ?? 1,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second"))
  };
}

function nextSnapshotDelayMs(now = new Date()) {
  const parts = newYorkTimeParts(now);
  const currentMinutes = parts.hour * 60 + parts.minute + parts.second / 60;
  const targetMinutes = MARKET_OPEN_SNAPSHOT_HOUR_NY * 60 + MARKET_OPEN_SNAPSHOT_MINUTE_NY;
  let daysUntilRun = 0;

  if (parts.weekday >= 6 || currentMinutes >= targetMinutes) {
    daysUntilRun = 1;
  }

  while (true) {
    const nextWeekday = ((parts.weekday + daysUntilRun - 1) % 7) + 1;
    if (nextWeekday <= 5) {
      break;
    }
    daysUntilRun += 1;
  }

  const minuteDelta = daysUntilRun === 0
    ? targetMinutes - currentMinutes
    : daysUntilRun * 24 * 60 + targetMinutes - currentMinutes;

  return Math.max(1000, Math.round(minuteDelta * 60 * 1000));
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calcIndexToSnapshot(calcIndex: CalcIndexLike): QuoteSnapshot {
  const json = calcIndex.toJSON?.() ?? {};
  const read = (camelKey: keyof CalcIndexLike, snakeKey?: string) =>
    calcIndex[camelKey] ?? json[camelKey as string] ?? (snakeKey ? json[snakeKey] : undefined);

  return {
    symbol: String(read("symbol") ?? ""),
    last: nullableNum(read("lastDone", "last_done")),
    bid: null,
    ask: null,
    volume: num(read("volume")),
    openInterest: num(read("openInterest", "open_interest")),
    impliedVolatility: (() => {
      const value = nullableNum(read("impliedVolatility", "implied_volatility"));
      return value !== null && value > 1 ? value / 100 : value;
    })(),
    delta: nullableNum(read("delta")),
    gamma: nullableNum(read("gamma")),
    theta: nullableNum(read("theta")),
    vega: nullableNum(read("vega")),
    rho: nullableNum(read("rho"))
  };
}

function mergeQuoteSnapshots(base: QuoteSnapshot | undefined, next: QuoteSnapshot): QuoteSnapshot {
  if (!base) {
    return next;
  }

  return {
    symbol: next.symbol || base.symbol,
    last: next.last ?? base.last,
    bid: next.bid ?? base.bid,
    ask: next.ask ?? base.ask,
    volume: next.volume || base.volume,
    openInterest: next.openInterest || base.openInterest,
    impliedVolatility: next.impliedVolatility ?? base.impliedVolatility,
    delta: next.delta ?? base.delta,
    gamma: next.gamma ?? base.gamma,
    theta: next.theta ?? base.theta,
    vega: next.vega ?? base.vega,
    rho: next.rho ?? base.rho
  };
}

function bestDepthPrice(depth: DepthLike, side: "bids" | "asks") {
  const json = depth.toJSON?.() ?? {};
  const rows = depth[side] ?? (Array.isArray(json[side]) ? json[side] : []);
  const first = rows[0];
  if (!first) {
    return null;
  }

  return nullableNum(first.price);
}

function spreadRatio(bid: number | null, ask: number | null) {
  if (bid === null || ask === null || bid <= 0 || ask <= 0 || ask < bid) {
    return null;
  }

  return (ask - bid) / ((ask + bid) / 2);
}

function scoreRatio(value: number, min: number, max: number) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function ratingFromScore(score: number) {
  if (score >= 82) return 5;
  if (score >= 68) return 4;
  if (score >= 52) return 3;
  if (score >= 36) return 2;
  return 1;
}

function factorStatus(score: number): "good" | "watch" | "avoid" {
  if (score >= 0.72) return "good";
  if (score >= 0.45) return "watch";
  return "avoid";
}

function eventStatus(report: Awaited<ReturnType<typeof buildSellPutReport>>) {
  const hasBlackout = report.event.items.some((item) => item.impactsScore);
  const hasNearbyEvent = report.event.items.length > 0;

  if (hasBlackout) {
    return {
      label: "黑窗",
      status: "avoid" as const,
      score: 0.1
    };
  }

  if (hasNearbyEvent) {
    return {
      label: "临近事件",
      status: "watch" as const,
      score: 0.55
    };
  }

  return {
    label: "无近端事件",
    status: "good" as const,
    score: 1
  };
}

async function getPutQuotesForSymbol(symbol: string, underlyingLast: number) {
  const expiryDates = await getOptionChainExpiryDates(symbol);
  const targetExpiries = expiryDates
    .map((date) => dateString(date))
    .map((date) => ({ date, dte: dteFromDate(date) }))
    .filter((item) => item.dte >= MIN_DTE && item.dte <= MAX_DTE);

  const putRows: Array<{ symbol: string; strike: number; expiryDate: string; dte: number }> = [];

  for (const expiry of targetExpiries) {
    const date = await createLongbridgeDate(expiry.date);
    const chain = await getOptionChainByDate(symbol, date);
    const rows = chain
      .map((row) => ({
        symbol: row.putSymbol,
        strike: num(row.price),
        expiryDate: expiry.date,
        dte: expiry.dte
      }))
      .map((row) => ({
        ...row,
        buffer: ((underlyingLast - row.strike) / underlyingLast) * 100
      }))
      .filter((row) => row.symbol && row.strike > 0 && row.buffer >= MIN_DOWNSIDE_BUFFER && row.buffer <= MAX_DOWNSIDE_BUFFER)
      .sort((left, right) => Math.abs(left.buffer - TARGET_DOWNSIDE_BUFFER) - Math.abs(right.buffer - TARGET_DOWNSIDE_BUFFER))
      .slice(0, MAX_QUOTES_PER_EXPIRY);

    putRows.push(...rows);
  }

  const limitedRows = putRows;
  const quoteMap = new Map<string, QuoteSnapshot>();

  await sleep(250);

  for (const symbols of chunk(limitedRows.map((row) => row.symbol), 50)) {
    const calcIndexes = await getOptionCalcIndexes(symbols);
    for (const calcIndex of calcIndexes as CalcIndexLike[]) {
      const snapshot = calcIndexToSnapshot(calcIndex);
      if (snapshot.symbol) {
        quoteMap.set(snapshot.symbol, mergeQuoteSnapshots(quoteMap.get(snapshot.symbol), snapshot));
      }
    }
  }

  return limitedRows.map((row) => ({
    ...row,
    quote: quoteMap.get(row.symbol)
  }));
}

async function scanSymbol(symbol: string) {
  const report = await buildSellPutReport(symbol, "zh");
  const underlyingLast = report.support.underlyingLast;
  const rows = await getPutQuotesForSymbol(symbol, underlyingLast);
  const event = eventStatus(report);

  const candidates: SellPutOpportunity[] = [];
  const prefiltered = rows
    .map((row) => {
      const quote = row.quote;
      const deltaAbs = quote?.delta === null || quote?.delta === undefined ? null : Math.abs(quote.delta);
      return { ...row, quote, deltaAbs };
    })
    .filter((row) => {
      if (!row.quote || row.deltaAbs === null) return false;
      if (row.deltaAbs < MIN_DELTA || row.deltaAbs > MAX_DELTA) return false;
      if (row.quote.openInterest < MIN_OPEN_INTEREST) return false;
      if (row.quote.volume < MIN_VOLUME) return false;
      return true;
    })
    .sort((left, right) => {
      const leftBuffer = ((underlyingLast - left.strike) / underlyingLast) * 100;
      const rightBuffer = ((underlyingLast - right.strike) / underlyingLast) * 100;
      return Math.abs(leftBuffer - TARGET_DOWNSIDE_BUFFER) - Math.abs(rightBuffer - TARGET_DOWNSIDE_BUFFER);
    })
    .slice(0, MAX_DEPTH_CHECKS_PER_SYMBOL);

  for (const row of prefiltered) {
    const quote = row.quote;
    if (!quote) {
      continue;
    }

    await sleep(80);
    const depth = await getOptionDepth(row.symbol) as DepthLike;
    const bid = bestDepthPrice(depth, "bids") ?? quote.bid;
    const ask = bestDepthPrice(depth, "asks") ?? quote.ask;
    const deltaAbs = row.deltaAbs;
    const spread = spreadRatio(bid, ask);

    if (deltaAbs === null) continue;
    if (bid === null || bid < MIN_BID) continue;
    if (ask === null || spread === null || spread > MAX_SPREAD_RATIO) continue;

    const annualizedYield = (bid / row.strike) * (365 / row.dte) * 100;
    if (annualizedYield < MIN_ANNUALIZED_YIELD) continue;

    const downsideBuffer = ((underlyingLast - row.strike) / underlyingLast) * 100;
    const liquidityScore = Math.min(1, scoreRatio(quote.openInterest, MIN_OPEN_INTEREST, 3000) * 0.6 + scoreRatio(quote.volume, MIN_VOLUME, 1000) * 0.4);
    const yieldScore = scoreRatio(annualizedYield, MIN_ANNUALIZED_YIELD, 35);
    const deltaScore = 1 - Math.abs(deltaAbs - 0.18) / 0.12;
    const dteScore = 1 - Math.abs(row.dte - 30) / 30;
    const supportScore = scoreRatio(report.support.keySupportDistance, 4, 16);
    const trendScore = scoreRatio(report.market.distanceToMa120, -5, 12);
    const vciScore = report.score.vci;
    const bufferScore = scoreRatio(downsideBuffer, 5, 20);
    const totalScore =
      liquidityScore * 14 +
      yieldScore * 18 +
      Math.max(0, deltaScore) * 12 +
      Math.max(0, dteScore) * 8 +
      supportScore * 14 +
      trendScore * 10 +
      vciScore * 14 +
      bufferScore * 10 +
      event.score * 10;
    const cappedScore = Math.round(Math.min(event.status === "avoid" ? 45 : 100, Math.max(0, totalScore)));
    const rating = ratingFromScore(cappedScore);
    const riskLevel = cappedScore >= 68 ? "good" : cappedScore >= 52 ? "watch" : "avoid";

    candidates.push({
      symbol,
      underlyingLast,
      contractSymbol: row.symbol,
      expiryDate: row.expiryDate,
      strike: row.strike,
      dte: row.dte,
      bid,
      ask,
      last: quote.last,
      volume: quote.volume,
      openInterest: quote.openInterest,
      delta: quote.delta,
      impliedVolatility: quote.impliedVolatility,
      annualizedYield,
      downsideBuffer,
      score: cappedScore,
      rating,
      actionLabel: cappedScore >= 68 ? "open" : cappedScore >= 52 ? "cautious" : "avoid",
      riskLevel,
      eventRisk: {
        label: event.label,
        status: event.status
      },
      factors: [
        { label: "年化收益", value: `${annualizedYield.toFixed(1)}%`, status: factorStatus(yieldScore) },
        { label: "Delta", value: deltaAbs.toFixed(2), status: factorStatus(Math.max(0, deltaScore)) },
        { label: "安全垫", value: `${downsideBuffer.toFixed(1)}%`, status: factorStatus(bufferScore) },
        { label: "支撑距离", value: `${report.support.keySupportDistance.toFixed(1)}%`, status: factorStatus(supportScore) },
        { label: "VCI", value: report.score.vci.toFixed(3), status: factorStatus(vciScore) },
        { label: "事件", value: event.label, status: event.status }
      ],
      reasons: [
        `DTE ${row.dte} 天，处于 14-45 天筛选区间。`,
        `Delta ${deltaAbs.toFixed(2)}，属于偏保守卖 Put 区间。`,
        `年化收益约 ${annualizedYield.toFixed(1)}%，权利金补偿具备观察价值。`,
        `行权价距离现价约 ${downsideBuffer.toFixed(1)}%，留有一定下跌缓冲。`
      ],
      risks: [
        event.status === "avoid" ? "当前存在黑窗事件，候选仅保留作观察。" : `事件风险：${event.label}。`,
        `若跌破关键支撑 $${report.support.keySupport.toFixed(2)}，卖方缓冲会明显变薄。`,
        "Delta 来自长桥 calc-index，bid/ask 来自长桥 depth。",
        `bid/ask 价差约 ${(spread * 100).toFixed(1)}%。`
      ]
    });
  }

  return {
    symbol,
    candidates,
    avoidedReason: candidates.length === 0 ? "没有通过流动性、Delta、收益或事件过滤的合约" : null
  };
}

function isLongbridgeRateLimit(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("301607") || message.toLowerCase().includes("too many");
}

async function scanSymbolWithRetry(symbol: string) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_COUNT; attempt += 1) {
    try {
      return await scanSymbol(symbol);
    } catch (error) {
      lastError = error;
      if (!isLongbridgeRateLimit(error) || attempt === RATE_LIMIT_RETRY_COUNT) {
        throw error;
      }

      await sleep(RATE_LIMIT_RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

async function generateSellPutOpportunities(tradeDate = todayTradeDate()): Promise<SellPutOpportunitiesResponse> {
  const response: SellPutOpportunitiesResponse = {
    generatedAt: new Date().toISOString(),
    tradeDate,
    source: "generated",
    universe: [...UNIVERSE],
    candidates: [],
    avoided: [],
    errors: []
  };

  for (const symbol of UNIVERSE) {
    try {
      const result = await scanSymbolWithRetry(symbol);
      response.candidates.push(...result.candidates);
      if (result.avoidedReason) {
        response.avoided.push({ symbol, reason: result.avoidedReason });
      }
    } catch (error) {
      response.errors.push({
        symbol,
        message: error instanceof Error ? error.message : "扫描失败"
      });
    }

    await sleep(SYMBOL_SCAN_DELAY_MS);
  }

  response.candidates = response.candidates
    .sort((left, right) => right.score - left.score || (right.annualizedYield ?? 0) - (left.annualizedYield ?? 0))
    .slice(0, TOP_CANDIDATES);

  await saveSellPutOpportunityRun(response);

  return response;
}

export async function buildSellPutOpportunities(force = false): Promise<SellPutOpportunitiesResponse> {
  if (!force && cachedResponse && cachedResponse.expiresAt > Date.now()) {
    return cachedResponse.data;
  }

  const tradeDate = todayTradeDate();
  if (!force) {
    const stored = await getSellPutOpportunityRun(tradeDate);
    if (stored) {
      cachedResponse = {
        data: stored,
        expiresAt: Date.now() + CACHE_TTL_MS
      };

      return stored;
    }
  }

  const response = await generateSellPutOpportunities(tradeDate);

  cachedResponse = {
    data: response,
    expiresAt: Date.now() + CACHE_TTL_MS
  };

  return response;
}

export function startSellPutOpportunityScheduler() {
  const run = async () => {
    try {
      const tradeDate = todayTradeDate();
      const stored = await getSellPutOpportunityRun(tradeDate);
      if (!stored) {
        const response = await generateSellPutOpportunities(tradeDate);
        cachedResponse = {
          data: response,
          expiresAt: Date.now() + CACHE_TTL_MS
        };
      }
    } catch (error) {
      console.error("Failed to generate sell put opportunity snapshot", error);
    }
  };

  const scheduleNext = () => {
    const timer = setTimeout(() => {
      void run().finally(() => {
        scheduleNext();
      });
    }, nextSnapshotDelayMs());
    timer.unref?.();
  };

  scheduleNext();
}

export async function sellPutOpportunitiesRoute(c: Context) {
  const force = c.req.query("refresh") === "true";
  const opportunities = await buildSellPutOpportunities(force);
  return c.json(opportunities);
}
