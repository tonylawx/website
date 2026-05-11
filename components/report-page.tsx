import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { SellPutReport } from "@/server/report/types";
import { LOCALE } from "@/shared/constants";
import { getVciHint, type Locale, uiCopy, vciConclusionLabel } from "@/shared/i18n";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Props = {
  report: SellPutReport;
  compact?: boolean;
  locale?: Locale;
};

function fmt(value: number, digits = 2) {
  return value.toFixed(digits);
}

function displaySymbol(symbol: string) {
  return symbol.replace(/\.US$/, "");
}

function percentColorClass(value: number) {
  return value >= 0 ? "text-[#1f9d63]" : "text-app-rose";
}

function starScoreColorClass(starScore: number) {
  if (starScore <= 2) {
    return "text-app-rose";
  }

  if (starScore === 3) {
    return "text-[#c89a2d]";
  }

  return "text-[#1f9d63]";
}

function vciConclusionColorClass(vci: number) {
  if (vci > 0.6) {
    return "text-[#1f9d63]";
  }

  if (vci < 0.4) {
    return "text-app-rose";
  }

  return "text-[#c89a2d]";
}

type FactorTone = "green" | "yellow" | "red";

const factorToneClass: Record<FactorTone, { text: string; badge: string; border: string; dot: string }> = {
  green: {
    text: "text-[#1f9d63]",
    badge: "bg-[#e6f6ee] text-[#1f7e52]",
    border: "border-[#1f9d63]/22",
    dot: "bg-[#1f9d63]"
  },
  yellow: {
    text: "text-[#c89a2d]",
    badge: "bg-[#fff3d6] text-[#9c741f]",
    border: "border-[#c89a2d]/24",
    dot: "bg-[#c89a2d]"
  },
  red: {
    text: "text-app-rose",
    badge: "bg-app-soft-rose text-app-rose",
    border: "border-app-rose/20",
    dot: "bg-app-rose"
  }
};

function vciTone(vci: number): FactorTone {
  if (vci > 0.6) {
    return "green";
  }

  if (vci < 0.4) {
    return "red";
  }

  return "yellow";
}

function marketTone(distanceToMa120: number): FactorTone {
  if (distanceToMa120 >= 0) {
    return "green";
  }

  if (distanceToMa120 >= -3) {
    return "yellow";
  }

  return "red";
}

function supportTone(distance: number): FactorTone {
  if (distance >= 10) {
    return "green";
  }

  if (distance >= 5) {
    return "yellow";
  }

  return "red";
}

function eventTone(items: SellPutReport["event"]["items"] = []): FactorTone {
  if (items.some((item) => item.impactsScore)) {
    return "red";
  }

  if (items.length > 0) {
    return "yellow";
  }

  return "green";
}

function CollapsibleCard({
  title,
  summary,
  tone,
  children
}: {
  title: string;
  summary: string;
  tone: FactorTone;
  children: ReactNode;
}) {
  const toneClass = factorToneClass[tone];

  return (
    <Collapsible className={cn("group rounded-[18px] border bg-white", toneClass.border)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{title}</h3>
          <div className={cn("mt-1 inline-flex max-w-full items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold", toneClass.badge)}>
            <span className={cn("size-1.5 shrink-0 rounded-full", toneClass.dot)} />
            <span className="truncate">{summary}</span>
          </div>
        </div>
        <ChevronDown className="size-4 shrink-0 text-app-muted transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="border-t border-app-line pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ReportPage({ report, compact = false, locale = LOCALE.ZH }: Props) {
  const text = uiCopy[locale];
  const eventItems = report.event.items ?? [];
  const starColor = starScoreColorClass(report.score.starScore);
  const vciConclusionColor = vciConclusionColorClass(report.score.vci);
  const vciConclusionText = vciConclusionLabel(report.score.vci, locale);
  const vciSummaryTone = vciTone(report.score.vci);
  const marketSummaryTone = marketTone(report.market.distanceToMa120);
  const supportSummaryTone = supportTone(report.support.keySupportDistance);
  const eventSummaryTone = eventTone(eventItems);
  const impactingEvent = eventItems.find((item) => item.impactsScore);
  const closestEvent = eventItems[0];
  const eventSummary =
    impactingEvent
      ? `${text.eventImpact} · ${impactingEvent.name}`
      : closestEvent
        ? `${closestEvent.name} · ${closestEvent.countdownLabel}`
      : text.eventNone;

  return (
    <main className={cn(compact ? "p-0" : "px-4 py-8 sm:py-10")}>
      <section
        className={cn(
          "mx-auto max-w-[980px]",
          compact
            ? ""
            : "rounded-[28px] border border-app-line bg-app-paper px-5 py-10 shadow-app backdrop-blur-xl sm:px-8"
        )}
      >
        <section className={cn("overflow-hidden rounded-3xl border border-app-navy/8 bg-[#fffaf2]", compact && "shadow-app")}>
          <div className="bg-gradient-to-b from-app-navy to-[#252848] px-6 py-5 text-center text-white">
            <p className="text-[11px] text-white/72">{report.header.kicker}</p>
            <h2 className="mt-1 text-2xl font-semibold">{displaySymbol(report.symbol)} {text.pageTitle}</h2>
            <p className="mt-1 text-[13px] text-app-gold">{report.header.dateLine}</p>
            <div className="mt-3 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2">
              <span className={cn("tracking-[0.2em]", starColor)}>{report.header.starLine}</span>
              <span className={cn("text-2xl font-semibold", starColor)}>
                {report.score.starScore}/5 {report.summary.actionLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-3 lg:grid-cols-2">
            <CollapsibleCard
              title={text.vciTitle}
              summary={`VCI ${fmt(report.score.vci, 3)}`}
              tone={vciSummaryTone}
            >
              {report.vciItems.map((item) => (
                <div key={item.label} className="mt-3">
                  <div className="grid grid-cols-[minmax(72px,112px)_1fr_40px] items-center gap-3">
                    <div>
                      <p className="text-[11px] text-app-muted">{item.label}</p>
                      <strong className="text-[15px]">{item.value}</strong>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-app-navy/8">
                      <div
                        className="h-full bg-gradient-to-r from-[#e76e78] to-[#e8b05b]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-right text-[11px] text-app-muted">{Math.round(item.progress)}</span>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-4 text-app-muted">{getVciHint(item.label, locale)}</p>
                </div>
              ))}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-app-line pt-4">
                <strong className={cn("text-2xl", vciConclusionColor)}>VCI {fmt(report.score.vci, 3)}</strong>
                <span className={cn("text-2xl font-semibold", vciConclusionColor)}>{vciConclusionText}</span>
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              title={text.marketTitle}
              summary={`${text.distance} ${fmt(report.market.distanceToMa120, 2)}%`}
              tone={marketSummaryTone}
            >
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt>{displaySymbol(report.market.symbolLabel)}</dt>
                  <dd>${fmt(report.market.symbolLast)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>{text.ma120}</dt>
                  <dd>${fmt(report.market.ma120)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>{text.status}</dt>
                  <dd>{report.market.trendLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>{text.distance}</dt>
                  <dd className={percentColorClass(report.market.distanceToMa120)}>
                    {fmt(report.market.distanceToMa120, 2)}%
                  </dd>
                </div>
              </dl>
            </CollapsibleCard>
          </div>

          <div className="mx-3 mb-3">
            <CollapsibleCard
              title={text.supportTitle}
              summary={`${text.keySupport} ${fmt(report.support.keySupportDistance, 1)}%`}
              tone={supportSummaryTone}
            >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:items-start">
              <div>
                <p className="text-[11px] text-[#7b8db1]">{displaySymbol(report.symbol)} {text.supportTitle}</p>
                <h3 className="mt-0.5 text-[clamp(15px,4.6vw,18px)] leading-tight font-semibold">
                  {displaySymbol(report.symbol)} ${fmt(report.support.underlyingLast)}
                </h3>
              </div>
              <div className="grid justify-items-start gap-2 text-left">
                <strong className="text-[clamp(15px,5vw,18px)] leading-tight text-app-amber">
                  {text.keySupport} ${fmt(report.support.keySupport)}
                  <span className={cn("ml-1.5 text-[clamp(12px,4vw,14px)] font-semibold", percentColorClass(report.support.keySupportDistance))}>
                    ({fmt(report.support.keySupportDistance, 1)}%)
                  </span>
                </strong>
                <span className="max-w-[420px] text-[11px] leading-[1.55] text-app-muted">{report.support.commentary}</span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <div>
                <div className="grid grid-cols-[0.9fr_1fr_0.8fr] gap-2 text-[10px] font-semibold text-[#8a7b52]">
                  <span>{text.recentLows}</span>
                  <span>{text.price}</span>
                  <span>{text.distance}</span>
                </div>
                <div className="mt-2 grid gap-1.5">
                  {report.support.windows.map((window) => (
                    <div key={window.label} className="grid grid-cols-[0.9fr_1fr_0.8fr] items-center gap-2 border-t border-app-line py-1.5 text-xs">
                      <span>{window.label}</span>
                      <span>${fmt(window.low)}</span>
                      <span className={percentColorClass(window.distancePercent)}>
                        {fmt(window.distancePercent, 1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="grid grid-cols-[0.9fr_1fr_0.8fr] gap-2 text-[10px] font-semibold text-[#8a7b52]">
                  <span>{text.fib}</span>
                  <span>{text.price}</span>
                  <span>{text.distance}</span>
                </div>
                <div className="mt-2 grid gap-1.5">
                  {report.support.fibLevels.map((level) => (
                    <div key={level.label} className="grid grid-cols-[0.9fr_1fr_0.8fr] items-center gap-2 border-t border-app-line py-1.5 text-xs">
                      <span>{level.label}</span>
                      <span>${fmt(level.price)}</span>
                      <span className={percentColorClass(level.distancePercent)}>
                        {fmt(level.distancePercent, 1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </CollapsibleCard>
          </div>

          <div className="mx-3 mb-3">
            <CollapsibleCard title={text.eventTitle} summary={eventSummary} tone={eventSummaryTone}>
            <p className="text-xs leading-6 text-app-muted">{text.eventHint}</p>
            {eventItems.length > 0 ? (
              <div className="mt-3 grid gap-1">
                {eventItems.map((item) => (
                  <div
                    key={`${item.label}-${item.name}`}
                    className="border-t border-app-navy/6 py-3 first:border-t-0 first:pt-0"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                      <strong className="text-base leading-5">{item.name}</strong>
                      <span
                        className={cn(
                          "col-start-2 row-span-2 self-center shrink-0 rounded-full px-2.5 py-1 text-[11px]",
                          item.impactsScore
                            ? "bg-app-soft-rose text-app-rose"
                            : "bg-app-soft-blue text-[#4f658c]"
                        )}
                      >
                        {item.severity}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {item.impactsScore ? (
                          <span className="text-xs font-semibold text-app-rose">{text.eventImpact}</span>
                        ) : null}
                        <span className={cn("text-xs", item.impactsScore ? "text-app-rose" : "text-app-muted")}>
                          {item.dateLabel} · {item.countdownLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 border-t border-app-navy/6 pt-3 text-sm text-app-muted">{text.eventNone}</div>
            )}
            </CollapsibleCard>
          </div>
        </section>
      </section>
    </main>
  );
}
