import type { SellPutOpportunitiesResponse } from "@tonylaw/contracts/report";
import { getSql } from "./client";

let readyPromise: Promise<void> | null = null;

export async function ensureOpportunitySchema() {
  if (readyPromise) {
    return readyPromise;
  }

  readyPromise = (async () => {
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS optix_sell_put_opportunity_runs (
        trade_date DATE PRIMARY KEY,
        generated_at TIMESTAMPTZ NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  })();

  return readyPromise;
}

export async function getSellPutOpportunityRun(tradeDate: string): Promise<SellPutOpportunitiesResponse | null> {
  await ensureOpportunitySchema();
  const sql = getSql();
  const rows = await sql<{ payload: SellPutOpportunitiesResponse }[]>`
    SELECT payload
    FROM optix_sell_put_opportunity_runs
    WHERE trade_date = ${tradeDate}
    LIMIT 1
  `;

  const payload = rows[0]?.payload;
  return payload ? { ...payload, source: "database" } : null;
}

export async function saveSellPutOpportunityRun(payload: SellPutOpportunitiesResponse) {
  await ensureOpportunitySchema();
  const sql = getSql();
  await sql`
    INSERT INTO optix_sell_put_opportunity_runs (trade_date, generated_at, payload)
    VALUES (${payload.tradeDate}, ${payload.generatedAt}, ${sql.json(payload)})
    ON CONFLICT (trade_date)
    DO UPDATE SET
      generated_at = EXCLUDED.generated_at,
      payload = EXCLUDED.payload,
      updated_at = NOW()
  `;
}
