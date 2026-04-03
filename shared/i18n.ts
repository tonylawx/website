export type Locale = "zh" | "en";

export function normalizeLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "zh";
}

export const uiCopy = {
  zh: {
    pageTitle: "卖出看跌期权日报",
    searchLabel: "美股标的",
    searchPlaceholder: "输入代码或公司名，例如 AAPL / Tesla",
    loading: "加载中...",
    searching: "搜索中...",
    searchLoadError: "长桥标的池加载失败，请检查本地 LONGPORT_ACCESS_TOKEN 是否有效。",
    reportLoadError: "长桥行情拉取失败，请检查凭证、权限或标的代码。",
    installBannerTitle: "iPhone 添加到桌面",
    installBannerBody: "在 Safari 点分享按钮，再选“添加到主屏幕”，就能像 App 一样打开。",
    reportTab: "日报",
    calculatorTab: "年化收益计算器",
    vciTitle: "波动率综合指数 [VCI]",
    marketTitle: "市场趋势",
    ticker: "标的",
    ma120: "MA 120",
    status: "状态",
    distance: "距离",
    score: "评分",
    supportTitle: "支撑位分析",
    keySupport: "关键支撑位",
    supportMetaLeft: "支撑位来源：近周期低点 + 斐波那契回撤",
    supportMetaRight: "越接近关键支撑，卖方缓冲越薄",
    recentLows: "近期低点",
    price: "价格",
    fib: "斐波那契",
    eventTitle: "重要事件",
    calculatorKicker: "基于现金担保卖 Put 的简化收益测算",
    calculatorTitle: "期权年化收益计算器",
    calculatorSubtitle: "快速估算权利金收入、占用保证金与年化收益率",
    calculatorInputs: "输入参数",
    calculatorResults: "结果",
    shortPutMode: "卖 Put",
    shortCallMode: "卖 Call",
    premiumLabel: "权利金 / Premium",
    strikeLabel: "行权价 / Strike",
    daysLabel: "到期天数 / Days",
    contractsLabel: "张数 / Contracts",
    premiumIncomeLabel: "总权利金",
    collateralLabel: "占用资金",
    simpleReturnLabel: "区间收益率",
    annualizedReturnLabel: "年化收益率",
    breakevenLabel: "盈亏平衡价",
    calculatorAssumptionTitle: "说明",
    calculatorAssumptionBody: "默认按现金担保卖 Put 计算：占用资金 = 行权价 × 100 × 张数，不含手续费与滑点。",
    calculatorAssumptionBodyCall: "默认按备兑卖 Call 计算：占用名义仓位 = 行权价 × 100 × 张数，不含手续费与滑点。"
  },
  en: {
    pageTitle: "Daily Sell Put Report",
    searchLabel: "US Stock",
    searchPlaceholder: "Enter ticker or company, e.g. AAPL / Tesla",
    loading: "Loading...",
    searching: "Searching...",
    searchLoadError: "Security list failed to load.",
    reportLoadError: "Report failed to load.",
    installBannerTitle: "Add to Home Screen",
    installBannerBody: "In Safari, tap Share and then Add to Home Screen to launch it like an app.",
    reportTab: "Report",
    calculatorTab: "Annualized Yield",
    vciTitle: "Volatility Composite Index [VCI]",
    marketTitle: "Market Trend",
    ticker: "Ticker",
    ma120: "MA 120",
    status: "Status",
    distance: "Distance",
    score: "Score",
    supportTitle: "Support Map",
    keySupport: "Key Support",
    supportMetaLeft: "Support source: recent lows + Fibonacci retracement",
    supportMetaRight: "Less cushion when price gets closer to support",
    recentLows: "Recent Lows",
    price: "Price",
    fib: "Fibonacci",
    eventTitle: "Key Events",
    calculatorKicker: "A simplified model for cash-secured short puts",
    calculatorTitle: "Option Annualized Yield Calculator",
    calculatorSubtitle: "Quickly estimate premium income, collateral usage, and annualized return",
    calculatorInputs: "Inputs",
    calculatorResults: "Results",
    shortPutMode: "Short Put",
    shortCallMode: "Short Call",
    premiumLabel: "Premium",
    strikeLabel: "Strike",
    daysLabel: "Days to Expiry",
    contractsLabel: "Contracts",
    premiumIncomeLabel: "Premium Income",
    collateralLabel: "Collateral",
    simpleReturnLabel: "Period Return",
    annualizedReturnLabel: "Annualized Return",
    breakevenLabel: "Breakeven",
    calculatorAssumptionTitle: "Assumption",
    calculatorAssumptionBody: "Assumes a cash-secured short put: collateral = strike × 100 × contracts, excluding fees and slippage.",
    calculatorAssumptionBodyCall: "Assumes a covered short call: notional exposure = strike × 100 × contracts, excluding fees and slippage."
  }
} as const;

export function translateActionLabel(label: string, locale: Locale) {
  if (locale === "en") {
    if (label === "开仓") return "Open";
    if (label === "谨慎") return "Cautious";
    if (label === "回避") return "Avoid";
  }

  return label;
}

export function translateTrendLabel(label: string, locale: Locale) {
  if (locale === "en") {
    if (label === "均线上方") return "Above MA";
    if (label === "均线下方") return "Below MA";
  }

  return label;
}

export function translateSeverity(label: string, locale: Locale) {
  if (locale === "en") {
    if (label === "常规观察") return "Routine Watch";
    if (label === "事件窗口") return "Event Window";
    if (label === "黑窗期") return "Blackout";
  }

  return label;
}

export function translateVciConclusion(label: string, locale: Locale) {
  if (locale === "en") {
    return label
      .replace("适合开仓", "Good to Sell")
      .replace("观望", "Watch")
      .replace("回避", "Avoid");
  }

  return label;
}

export function getVciHint(label: string, locale: Locale) {
  const copy = {
    zh: {
      IVR: "当前 VIX 位于过去 252 个交易日区间的百分位",
      VIX: "15-25 区间更友好，过高通常意味着系统性风险上升",
      VVIX: "衡量波动率本身的波动，越低通常越稳定",
      TS: "观察 VIX3M 与 VIX 差值，正值代表正常 contango"
    },
    en: {
      IVR: "Percentile of current VIX within the last 252 trading days",
      VIX: "The 15-25 zone is usually friendlier; very high VIX signals stress",
      VVIX: "Measures volatility of volatility; lower usually means more stability",
      TS: "Tracks VIX3M minus VIX; positive values imply normal contango"
    }
  } as const;

  return copy[locale][label as keyof typeof copy.zh] ?? "";
}

export function reportKicker(locale: Locale) {
  return locale === "en"
    ? "This report is a quantitative framework for options only, not investment advice."
    : "本策略仅作为期权量化思路，不作为投资建议。";
}

export function actionLabelFromStars(stars: number, locale: Locale) {
  const label = stars >= 4 ? "开仓" : stars === 3 ? "谨慎" : "回避";
  return translateActionLabel(label, locale);
}

export function vciConclusionLabel(vci: number, locale: Locale) {
  const label = vci > 0.6 ? "适合开仓" : vci < 0.4 ? "回避" : "观望";
  return locale === "en"
    ? vci > 0.6
      ? "Good to Sell"
      : vci < 0.4
        ? "Avoid"
        : "Watch"
    : label;
}

export function supportCommentary(supportDistance: number, locale: Locale) {
  if (supportDistance >= 7) {
    return locale === "en"
      ? "Price still has some cushion above key lows, so deeper OTM strikes remain worth screening."
      : "价格离关键低点仍有缓冲，适合继续筛选更深虚值行权价。";
  }

  return locale === "en"
    ? "Price is not far from key lows, so the seller's margin of safety looks thinner."
    : "价格距离关键低点不远，卖方安全垫偏薄。";
}

export function formatMarketDate(date: Date, locale: Locale) {
  const year = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric"
  }).format(date);
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    month: "2-digit"
  }).format(date);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    day: "2-digit"
  }).format(date);
  const weekday = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    timeZone: "America/New_York",
    weekday: "long"
  }).format(date);

  return `${year}-${month}-${day} ${weekday}`;
}

export function formatCountdown(days: number, locale: Locale) {
  return locale === "en" ? `${days} days` : `${days} 天`;
}

export function translateEventName(name: string, locale: Locale) {
  if (locale === "en") {
    return name;
  }

  if (name === "FOMC Meeting") return "FOMC 会议";
  if (name === "US CPI") return "美国 CPI";
  if (name === "US PPI") return "美国 PPI";
  return name;
}
