export type ScoreDimension = {
  label: string;
  value: string;
  progress: number;
};

export type SecuritySearchResult = {
  symbol: string;
  name: string;
};

export type ImportantEventItem = {
  label: string;
  name: string;
  dateLabel: string;
  countdownLabel: string;
  severity: string;
  impactsScore: boolean;
};

export type SellPutReport = {
  symbol: string;
  header: {
    kicker: string;
    dateLine: string;
    starLine: string;
  };
  summary: {
    actionLabel: string;
  };
  score: {
    starScore: number;
    vci: number;
    trend: number;
  };
  vciItems: ScoreDimension[];
  vciConclusion: string;
  market: {
    symbolLabel: string;
    symbolLast: number;
    ma120: number;
    distanceToMa120: number;
    trendLabel: string;
  };
  support: {
    underlyingLast: number;
    keySupport: number;
    keySupportDistance: number;
    commentary: string;
    windows: Array<{
      label: string;
      low: number;
      distancePercent: number;
    }>;
    fibLevels: Array<{
      label: string;
      price: number;
      distancePercent: number;
    }>;
  };
  event: {
    name: string;
    dateLabel: string;
    countdownLabel: string;
    severity: string;
    items: ImportantEventItem[];
  };
  earnings: {
    title: string;
    nextDateLabel: string;
    countdownLabel: string;
    severity: string;
    latestFilingTitle: string;
    latestFilingDateLabel: string;
  };
};

export type OpportunityFactor = {
  label: string;
  value: string;
  status: "good" | "watch" | "avoid";
};

export type SellPutOpportunity = {
  symbol: string;
  underlyingLast: number;
  contractSymbol: string;
  expiryDate: string;
  strike: number;
  dte: number;
  bid: number | null;
  ask: number | null;
  last: number | null;
  volume: number;
  openInterest: number;
  delta: number | null;
  impliedVolatility: number | null;
  annualizedYield: number | null;
  downsideBuffer: number;
  score: number;
  rating: number;
  actionLabel: "open" | "cautious" | "avoid";
  riskLevel: "good" | "watch" | "avoid";
  eventRisk: {
    label: string;
    status: "good" | "watch" | "avoid";
  };
  factors: OpportunityFactor[];
  reasons: string[];
  risks: string[];
};

export type SellPutOpportunitiesResponse = {
  generatedAt: string;
  tradeDate: string;
  source: "database" | "generated";
  universe: string[];
  candidates: SellPutOpportunity[];
  avoided: Array<{
    symbol: string;
    reason: string;
  }>;
  errors: Array<{
    symbol: string;
    message: string;
  }>;
};
