# Optix Product Path and MVP

## 1. Product North Star

Optix should evolve from a single-symbol option report into an options opportunity screening engine.

The long-term product is:

> A risk-filtered option opportunity scanner for US options sellers, with broker-ready conversion paths.

For retail users, Optix sells filtering efficiency:

- What can I look at today?
- Which contracts are liquid enough?
- Which opportunities have enough premium for the risk?
- Which names should be avoided because of earnings, CPI, PPI, FOMC, trend, or support risk?

For brokers, Optix sells trading conversion:

- Convert option-curious users into option-chain viewers.
- Reduce the user's discovery friction before placing trades.
- Provide an educational and risk-aware funnel into broker order pages.
- Support campaign pages, broker H5 embeds, affiliate links, or white-label widgets.

The product should not position itself as an investment adviser or a signal service. The durable positioning is:

> Pre-trade screening and risk explanation, not trade instructions.

## 2. Reference Category

BestOpts-style products are the nearest category reference:

- "Today best SellPut" style entry point.
- Single-stock option analysis.
- Smart bullish and bearish option combinations.
- Broker brand or broker CTA surface.

Optix should not simply become a highest-yield ranking board. The stronger differentiation is:

> Risk-filtered candidates, not highest-return recommendations.

This makes the product more credible for serious retail users and easier to discuss with brokers.

## 3. MVP Scope

The smallest paid-worthy MVP is:

> Today Sell Put Candidates.

This is a daily list of concrete option contracts, not only stocks.

Example row:

```text
NVDA 2026-06-19 120 Put
Rating: 4 stars
Type: Conservative Sell Put
Delta: 0.18
DTE: 34
Annualized yield: 18.6%
Downside buffer: 12.4%
Event risk: earnings avoided
Liquidity: good
```

Clicking a row opens the existing report-style detail page with the reasons and risks.

The first MVP should support only Sell Put. Sell Call, covered call, spreads, and custom strategy builder come later.

## 4. Initial Tradable Universe

Do not start with the entire US market. Start with a controlled, liquid universe.

Initial universe:

- ETFs: `SPY`, `QQQ`, `IWM`, `DIA`
- Mega-cap tech: `AAPL`, `MSFT`, `NVDA`, `AMD`, `META`, `AMZN`, `GOOGL`, `TSLA`
- High-interest names: `PLTR`, `COIN`, `MSTR`, `SOFI`, `TSM`, `AVGO`

The universe should be configurable in backend code or database later. For MVP, a static server-side list is acceptable.

## 5. Candidate Filtering Funnel

The scanner should work as a funnel.

### Layer 1: Hard Exclusion

Remove contracts that are not worth showing.

Initial hard filters:

- Option type: put only.
- DTE: 14 to 45 days.
- Delta: 0.10 to 0.30.
- Bid premium: at least `0.20` or `0.30`.
- Bid/ask spread: less than 15% to 20%.
- Open interest: at least 300.
- Volume: at least 50.
- Underlying price: avoid extremely low-priced or unstable names.
- Missing quote or stale quote: exclude.
- Earnings within hard blackout window: exclude or downgrade, depending on product mode.

### Layer 2: Risk Downgrade

Keep candidates but lower their score when risk is visible.

Downgrade factors:

- Earnings within 14 days.
- CPI, PPI, or FOMC within 14 days.
- Current macro blackout window active.
- VCI too low.
- Distance to support too thin.
- Trend deteriorating.
- Recent sharp gap or unusually high realized volatility.
- Poor risk/reward after spread cost.

### Layer 3: Ranking

Rank candidates by a transparent multi-factor score.

Initial factors:

- Liquidity score.
- Premium score.
- Annualized yield score.
- Delta quality score.
- DTE quality score.
- VCI score.
- Support buffer score.
- Trend score.
- Event risk score.

AI should not decide the score. AI should explain the score.

## 6. MVP User Experience

The new primary page should be an Opportunity Scanner.

Recommended top-level tabs:

- Today Candidates
- Watchlist
- Avoid List
- Single Symbol Report

MVP can start with only:

- Today Candidates
- Single Symbol Report

Candidate list columns:

- Symbol
- Contract
- DTE
- Delta
- Bid
- Annualized yield
- Downside buffer
- Event risk
- Rating
- Action

The action should not say "Buy" or "Sell now". Use safer wording:

- View details
- View option chain
- Copy contract
- Open broker

Detail page should explain:

- Why it was selected.
- Main risks.
- What would invalidate the setup.
- Relevant event windows.
- Liquidity and spread warning.

## 7. AI Role

AI should be used as an explanation and personalization layer, not as the source of truth.

Good AI jobs:

- Turn factor results into plain-language explanations.
- Summarize the top risks.
- Explain why a contract was excluded.
- Rank candidates according to user risk preference after the deterministic score is calculated.
- Generate broker-friendly educational copy.

Bad AI jobs:

- Secretly deciding trade recommendations.
- Producing unsupported claims.
- Replacing deterministic filters.
- Creating "guaranteed return" style language.

## 8. Broker Cooperation Path

The broker-facing story is not "AI recommends trades".

The broker-facing story is:

> Optix converts complex option chains into understandable, risk-filtered opportunities and creates a compliant path from education to option-chain engagement.

Potential broker products:

- Embeddable H5 opportunity scanner.
- Campaign landing page for option education.
- White-label daily opportunity list.
- Broker deep links into option chain pages.
- Affiliate tracking on "open broker" actions.
- Weekly options education and candidate digest.

Metrics to collect before serious broker outreach:

- Daily active users.
- Candidate detail click-through rate.
- Broker CTA click-through rate.
- Watchlist creation rate.
- Repeat usage rate.
- Email or alert open rate.
- Symbols and contract types users actually inspect.

Without these metrics, broker conversations will stay abstract.

## 9. Monetization Path

### Phase 1: B2C Validation

Free:

- Limited candidates per day.
- ETF-only or delayed candidate list.
- Basic explanation.

Pro:

- Full candidate list.
- Individual stock universe.
- Complete factor breakdown.
- Watchlist scanner.
- Email or push alerts.
- Avoid list.

Initial price range:

- Monthly: USD 9.9 to 29.9.
- Annual: discounted.

### Phase 2: B2B Broker Funnel

Possible models:

- Monthly SaaS fee for white-label scanner.
- CPA for account opening.
- Revenue share or activity-based fee if allowed.
- Sponsored education campaign.
- Custom broker-branded landing page.

## 10. Compliance and Copy Boundaries

Use:

- Candidate
- Screening
- Watch
- Risk-filtered
- For research
- Not investment advice
- User makes final decision

Avoid:

- Must trade
- Guaranteed profit
- Best trade
- Buy now
- Sell now
- Stable income
- Risk-free

Every candidate page should include:

> This output is for research and education only. It is not investment advice or a solicitation to buy or sell securities or options.

## 11. Development Slices

### Slice 1: Data Contract

Add backend contracts for:

- Option contract candidate.
- Candidate factor scores.
- Exclusion reason.
- Event risk summary.
- AI explanation summary.

### Slice 2: Static Universe Scanner

Create a backend scanner endpoint:

```text
GET /optix/api/opportunities/sell-put
```

It should scan the initial symbol universe and return ranked candidates.

If live option chain data is not complete yet, start with one provider and cache responses aggressively.

### Slice 3: Opportunity Scanner Page

Create frontend page:

```text
/opportunities
```

MVP page sections:

- Header: "Today Sell Put Candidates"
- Filter chips: conservative, balanced, high premium
- Candidate table/cards
- Risk disclaimer
- Empty/loading/error states

### Slice 4: Candidate Detail

Candidate detail can reuse the existing report components:

- VCI
- Market trend
- Support analysis
- Important events
- Earnings and macro windows

Add contract-specific explanation:

- Why selected.
- Why downgraded.
- What to watch.

### Slice 5: Broker CTA

Add broker CTA abstraction:

- Copy contract code.
- Open broker link.
- Track click event.

Do not hardcode a single broker deeply into core ranking logic.

## 12. Definition of MVP Done

The MVP is done when:

- User can open an opportunity scanner page.
- Backend returns at least 10 ranked Sell Put candidates from a fixed universe.
- Each candidate has transparent factors and risk labels.
- Candidate detail explains selection reasons and risks.
- Event blackout and earnings windows affect score or exclusion.
- The page has a clear broker CTA placeholder.
- The product copy avoids direct trade instruction language.

## 13. Immediate Next Step

Build the scanner data contract and backend endpoint first.

Do not start with a complex AI layer.
Do not start with broker integration.
Do not start with full-market scanning.

Start with:

> Static universe -> option chain filtering -> deterministic score -> candidate list.

