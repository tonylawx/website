import type { Locale } from "@/shared/i18n";
import { uiCopy } from "@/shared/i18n";
import { useMemo, useState } from "react";

type Props = {
  locale?: Locale;
};

type OptionMode = "put" | "call";

function fmt(value: number, digits = 2) {
  return value.toFixed(digits);
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function OptionYieldCalculator({ locale = "zh" }: Props) {
  const text = uiCopy[locale];
  const [mode, setMode] = useState<OptionMode>("put");
  const [premium, setPremium] = useState("2.35");
  const [strike, setStrike] = useState("500");
  const [daysToExpiry, setDaysToExpiry] = useState("35");
  const [contracts, setContracts] = useState("1");

  const result = useMemo(() => {
    const premiumValue = Math.max(parseNumber(premium), 0);
    const strikeValue = Math.max(parseNumber(strike), 0);
    const daysValue = Math.max(parseNumber(daysToExpiry), 1);
    const contractsValue = Math.max(parseNumber(contracts), 1);

    const shares = contractsValue * 100;
    const premiumIncome = premiumValue * shares;
    const collateral = strikeValue * shares;
    const simpleReturn = collateral > 0 ? (premiumIncome / collateral) * 100 : 0;
    const annualizedReturn = simpleReturn * (365 / daysValue);
    const breakeven = mode === "put"
      ? Math.max(strikeValue - premiumValue, 0)
      : strikeValue + premiumValue;

    return {
      premiumIncome,
      collateral,
      simpleReturn,
      annualizedReturn,
      breakeven
    };
  }, [contracts, daysToExpiry, mode, premium, strike]);

  return (
    <section style={styles.shell}>
      <div style={styles.hero}>
        <p style={styles.kicker}>{text.calculatorKicker}</p>
        <h2 style={styles.title}>{text.calculatorTitle}</h2>
        <p style={styles.subtitle}>{text.calculatorSubtitle}</p>
        <div style={styles.modeSwitch}>
          <button
            type="button"
            onClick={() => setMode("put")}
            style={mode === "put" ? { ...styles.modeButton, ...styles.modeButtonActive } : styles.modeButton}
          >
            {text.shortPutMode}
          </button>
          <button
            type="button"
            onClick={() => setMode("call")}
            style={mode === "call" ? { ...styles.modeButton, ...styles.modeButtonActive } : styles.modeButton}
          >
            {text.shortCallMode}
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <article style={styles.card}>
          <h3 style={styles.cardTitle}>{text.calculatorInputs}</h3>
          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>{text.premiumLabel}</span>
              <input
                inputMode="decimal"
                value={premium}
                onChange={(event) => setPremium(event.target.value)}
                style={styles.input}
              />
            </label>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>{text.strikeLabel}</span>
              <input
                inputMode="decimal"
                value={strike}
                onChange={(event) => setStrike(event.target.value)}
                style={styles.input}
              />
            </label>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>{text.daysLabel}</span>
              <input
                inputMode="numeric"
                value={daysToExpiry}
                onChange={(event) => setDaysToExpiry(event.target.value)}
                style={styles.input}
              />
            </label>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>{text.contractsLabel}</span>
              <input
                inputMode="numeric"
                value={contracts}
                onChange={(event) => setContracts(event.target.value)}
                style={styles.input}
              />
            </label>
          </div>
          <div style={styles.noteBox}>
            <strong style={styles.noteTitle}>{text.calculatorAssumptionTitle}</strong>
            <p style={styles.noteText}>
              {mode === "put" ? text.calculatorAssumptionBody : text.calculatorAssumptionBodyCall}
            </p>
          </div>
        </article>

        <article style={styles.card}>
          <h3 style={styles.cardTitle}>{text.calculatorResults}</h3>
          <div style={styles.resultGrid}>
            <div style={styles.resultRow}>
              <span>{text.premiumIncomeLabel}</span>
              <strong>${fmt(result.premiumIncome)}</strong>
            </div>
            <div style={styles.resultRow}>
              <span>{text.collateralLabel}</span>
              <strong>${fmt(result.collateral)}</strong>
            </div>
            <div style={styles.resultRow}>
              <span>{text.simpleReturnLabel}</span>
              <strong style={{ color: "#1f9d63" }}>{fmt(result.simpleReturn, 2)}%</strong>
            </div>
            <div style={styles.resultRow}>
              <span>{text.annualizedReturnLabel}</span>
              <strong style={styles.annualizedValue}>{fmt(result.annualizedReturn, 2)}%</strong>
            </div>
            <div style={styles.resultRow}>
              <span>{text.breakevenLabel}</span>
              <strong>${fmt(result.breakeven)}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(29, 32, 56, 0.08)",
    background: "#fffaf2",
    boxShadow: "var(--shadow)"
  },
  hero: {
    padding: "18px 24px",
    background: "linear-gradient(180deg, #1d2038 0%, #252848 100%)",
    color: "white"
  },
  kicker: {
    margin: 0,
    color: "rgba(255,255,255,0.72)",
    fontSize: 11
  },
  title: {
    margin: "4px 0 6px",
    fontSize: 24
  },
  subtitle: {
    margin: 0,
    color: "#d9d6cf",
    fontSize: 13
  },
  modeSwitch: {
    marginTop: 12,
    display: "inline-flex",
    gap: 4,
    padding: 4,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)"
  },
  modeButton: {
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    padding: "7px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  modeButtonActive: {
    background: "#fff",
    color: "#1d2038"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 12,
    padding: 12
  },
  card: {
    background: "white",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(29, 32, 56, 0.07)"
  },
  cardTitle: {
    margin: 0,
    fontSize: 16
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 14
  },
  field: {
    display: "grid",
    gap: 6
  },
  fieldLabel: {
    fontSize: 12,
    color: "var(--muted)"
  },
  input: {
    width: "100%",
    border: "1px solid var(--line)",
    outline: "none",
    background: "#fcfbf8",
    color: "var(--ink)",
    fontSize: 16,
    padding: "10px 12px",
    borderRadius: 14,
    fontFamily: "inherit"
  },
  noteBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: "rgba(40, 73, 129, 0.08)"
  },
  noteTitle: {
    display: "block",
    marginBottom: 4,
    fontSize: 12
  },
  noteText: {
    margin: 0,
    fontSize: 12,
    color: "var(--muted)",
    lineHeight: 1.5
  },
  resultGrid: {
    display: "grid",
    gap: 10,
    marginTop: 14
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "10px 0",
    borderTop: "1px solid var(--line)",
    fontSize: 14
  },
  annualizedValue: {
    color: "var(--amber)"
  }
};
