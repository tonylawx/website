import { getFinanceCalendar, symbolToCounterIdCandidates, type FinanceCalendarInfo } from "@/server/report/longbridge";
import { FINANCE_CALENDAR_TYPE } from "@/shared/constants";

type CachedEarnings = {
  data: EarningsSnapshot | null;
  expiresAt: number;
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, CachedEarnings>();

export type EarningsSnapshot = {
  date: Date;
  fiscalQuarterLabel: string | null;
};

function extractInfoDate(info: FinanceCalendarInfo, fallbackDate: string) {
  const explicitDate = info.date?.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (explicitDate) {
    return `${explicitDate[1]}-${explicitDate[2]}-${explicitDate[3]}`;
  }

  const dateFromTimestamp =
    info.datetime && Number.isFinite(Number(info.datetime))
      ? new Date(Number(info.datetime) * 1000).toISOString().slice(0, 10)
      : null;

  return dateFromTimestamp ?? fallbackDate;
}

function extractFiscalQuarterLabel(info: FinanceCalendarInfo) {
  const content = info.content ?? "";
  const fiscalMatch = content.match(/(\d{4})\s*财年.*?第\s*([1-4])\s*季度/);
  if (fiscalMatch) {
    const [, year, quarter] = fiscalMatch;
    return `FY${year}Q${quarter}`;
  }

  const standardYearQuarterMatch = content.match(/(\d{4})\s*[Qq]([1-4])/);
  if (standardYearQuarterMatch) {
    const [, year, quarter] = standardYearQuarterMatch;
    return `${year}Q${quarter}`;
  }

  const standardQuarterYearMatch = content.match(/[Qq]([1-4])\s*(\d{4})/);
  if (standardQuarterYearMatch) {
    const [, quarter, year] = standardQuarterYearMatch;
    return `${year}Q${quarter}`;
  }

  const period = info.ext?.financial_report?.period;
  const year = content.match(/(\d{4})/)?.[1];

  if (!period || !year) {
    return null;
  }

  const quarter = Number(period);
  if (!Number.isFinite(quarter) || quarter < 1 || quarter > 4) {
    return null;
  }

  return `${year}Q${quarter}`;
}

export async function getNextEarningsDate(symbol: string) {
  const ticker = symbol.replace(/\.US$/, "").toUpperCase();
  const now = Date.now();
  const cached = cache.get(ticker);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + 180);
  const response = await getFinanceCalendar({
    date: startDate,
    dateEnd: endDate.toISOString().slice(0, 10),
    count: 50,
    offset: 0,
    next: true,
    types: [FINANCE_CALENDAR_TYPE.REPORT, FINANCE_CALENDAR_TYPE.FINANCIAL],
    counterIds: symbolToCounterIdCandidates(symbol)
  });

  const days = response.list ?? [];
  const item = days.flatMap((day) =>
    (day.infos ?? []).map((info) => ({
      dayDate: day.date,
      info
    }))
  )[0];

  const data = item
    ? {
        date: new Date(`${extractInfoDate(item.info, item.dayDate)}T00:00:00.000Z`),
        fiscalQuarterLabel: extractFiscalQuarterLabel(item.info)
      }
    : null;

  cache.set(ticker, {
    data,
    expiresAt: now + CACHE_TTL_MS
  });

  return data;
}
