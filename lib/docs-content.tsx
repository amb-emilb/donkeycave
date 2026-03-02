import type { ReactNode } from "react";

export interface DocEntry {
  slug: string;
  title: string;
  content: ReactNode;
}

export const DOCS: DocEntry[] = [
  {
    slug: "overview",
    title: "Overview",
    content: (
      <>
        <h2>What is Donkey Cave?</h2>
        <p>
          Donkey Cave is a <strong>Polymarket divergence monitor</strong> that
          continuously compares Polymarket prediction market prices against
          external real-world signals. When the market price diverges
          significantly from what external data suggests, it flags these as
          potential opportunities.
        </p>

        <h3>How it works</h3>
        <ol>
          <li>
            <strong>Market discovery</strong> — Every 30 minutes, a Supabase
            Edge Function scans all active Polymarket markets via the Gamma API
            and categorizes them into niches (temperature, finance, crypto,
            sports, YouTube, xTracker).
          </li>
          <li>
            <strong>Signal collection</strong> — For each matched market, the
            system fetches real-world data from external APIs (weather forecasts,
            stock prices, crypto prices, sports odds, social media stats) and
            computes a <em>signal probability</em>.
          </li>
          <li>
            <strong>CLOB enrichment</strong> — Market prices are enriched with
            real-time data from the Polymarket CLOB (Central Limit Order Book)
            via batch <code>POST /midpoints</code> and{" "}
            <code>POST /spreads</code> endpoints.
          </li>
          <li>
            <strong>Divergence calculation</strong> — The divergence is simply:{" "}
            <code>signal_probability - market_yes_price</code>. A positive
            divergence means the signal thinks YES is underpriced.
          </li>
          <li>
            <strong>Dashboard display</strong> — Results are stored in Supabase
            and displayed here with filtering, sorting, date ranges, and export.
          </li>
        </ol>

        <h3>Update frequency</h3>
        <p>
          The monitor runs every <strong>30 minutes</strong> via pg_cron. Each
          cycle processes ~200 markets across 7 niches in ~5-7 seconds.
          Data older than 30 days is automatically pruned. Each cycle also
          generates an <strong>LLM insight note</strong> summarizing the
          results via GPT-4o-mini.
        </p>
      </>
    ),
  },
  {
    slug: "concepts",
    title: "Core Concepts",
    content: (
      <>
        <h2>Core Concepts</h2>

        <h3>Divergence</h3>
        <p>
          The core metric. Divergence = Signal Probability - Polymarket YES
          Price. Expressed as a percentage.
        </p>
        <ul>
          <li>
            <strong>+15%</strong> means our signal thinks YES is 15 percentage
            points more likely than the market price reflects. The market may be
            underpricing YES.
          </li>
          <li>
            <strong>-10%</strong> means our signal thinks YES is 10 percentage
            points less likely. The market may be overpricing YES (or
            underpricing NO).
          </li>
          <li>
            <strong>Near 0%</strong> means the market and signal roughly agree.
            No obvious mispricing.
          </li>
        </ul>

        <h3>Signal Probability</h3>
        <p>
          The probability we compute from external data sources. Each niche uses
          a different method — see the Niches section for details. The signal is
          our best estimate of the &quot;true&quot; probability based on
          real-world information.
        </p>

        <h3>Poly YES Price</h3>
        <p>
          The current market price for YES on Polymarket. We prefer the{" "}
          <strong>CLOB midpoint</strong> (average of best bid and best ask) over
          the Gamma API cached price, as it is more current. If the CLOB price
          is unavailable, we fall back to the Gamma price.
        </p>

        <h3>Niches</h3>
        <p>
          Markets are categorized by topic. Each niche has its own signal source
          and probability calculation method. Current niches: Temperature,
          Finance, Crypto Hourly, xTracker, Sports, YouTube.
        </p>

        <h3>Confidence Score</h3>
        <p>
          Each divergence has a confidence score (0.0-1.0) based on source
          count, methodology quality (GBM model &gt; ensemble &gt; heuristic),
          and hours to expiry. Higher confidence means the signal is more
          trustworthy.
        </p>

        <h3>DONKEY IN</h3>
        <p>
          The AI-powered recommendation feature. Enter a dollar amount and
          Kirkster (our AI advisor) analyzes the top divergence opportunities and
          recommends a single best bet with a confidence score and reasoning.
          This is for entertainment and educational purposes — not financial
          advice.
        </p>

        <h3>LLM Tab</h3>
        <p>
          The <strong>Log</strong> sub-tab shows auto-generated insight notes
          from GPT-4o-mini after each monitor cycle — biggest divergences,
          patterns, and notable shifts. The <strong>Chat</strong> sub-tab lets
          you chat with Kirkster about the latest divergence data and strategy.
        </p>
      </>
    ),
  },
  {
    slug: "niches",
    title: "Niches",
    content: (
      <>
        <h2>Niche Breakdown</h2>
        <p>
          Each niche uses a different external data source and probability
          calculation method.
        </p>

        <h3>Temperature</h3>
        <ul>
          <li>
            <strong>Data sources:</strong> OpenWeatherMap 5-day forecast +
            Open-Meteo ensemble forecast (two independent sources)
          </li>
          <li>
            <strong>Markets:</strong> &quot;Will the highest temperature in [city] be
            [X]°F or higher?&quot;
          </li>
          <li>
            <strong>Method:</strong> Ensemble average of OWM + Open-Meteo
            (fetched in a single batch request). Gaussian CDF with
            &sigma;=2.5°C, reduced by &radic;2 when both sources agree.
            For &quot;X or higher&quot;: P = 1 - &Phi;((target - forecast) / &sigma;).
            For ranges: P = &Phi;(high) - &Phi;(low).
            Falls back to GPT-4o-mini parsing for non-standard question formats.
          </li>
        </ul>

        <h3>Finance</h3>
        <ul>
          <li>
            <strong>Data source:</strong> Yahoo Finance API (5-day chart with
            realized volatility) + GPT-4o-mini news sentiment
          </li>
          <li>
            <strong>Markets:</strong> S&P 500, NVIDIA, Gold, Silver price
            thresholds
          </li>
          <li>
            <strong>Method:</strong> Geometric Brownian Motion (GBM) CDF using
            realized annualized volatility from Yahoo chart data. Computes
            P(price &gt; threshold at expiry) via Black-Scholes-style d2 formula.
            News sentiment from GPT-4o-mini nudges probability &plusmn;5%.
            Falls back to LLM parsing for non-standard question formats.
          </li>
        </ul>

        <h3>Crypto Hourly</h3>
        <ul>
          <li>
            <strong>Data source:</strong> Binance spot + klines (24 hourly
            candles) + perpetual futures (funding rate, open interest) +
            GPT-4o-mini news sentiment
          </li>
          <li>
            <strong>Markets:</strong> &quot;Will BTC/ETH be up or down this hour?&quot;
          </li>
          <li>
            <strong>Method:</strong> Historical volatility from 24 hourly
            candles. Time-remaining-adjusted Gaussian CDF: &sigma;_remaining =
            &sigma; &times; &radic;(remaining_fraction). P(up) =
            &Phi;(change% / &sigma;_remaining). Adjusted by funding rate
            (positive = bullish bias) and news sentiment (&plusmn;5% nudge).
          </li>
        </ul>

        <h3>xTracker</h3>
        <ul>
          <li>
            <strong>Data source:</strong> xTracker JSON API
            (xtracker.polymarket.com)
          </li>
          <li>
            <strong>Markets:</strong> &quot;Will [person] post X or more tweets by
            [date]?&quot;
          </li>
          <li>
            <strong>Method:</strong> Decay-weighted projection using actual post
            timestamps. Recent 25% of elapsed period weighted 70%, overall rate
            weighted 30%. Projected final count compared to market threshold.
          </li>
        </ul>

        <h3>Sports</h3>
        <ul>
          <li>
            <strong>Data source:</strong> The Odds API (UFC/MMA)
          </li>
          <li>
            <strong>Markets:</strong> UFC fighter win markets
          </li>
          <li>
            <strong>Method:</strong> American odds → implied probability
            conversion. Odds of -150 → P = 150/250 = 60%. Odds of +200 → P =
            100/300 = 33.3%.
          </li>
        </ul>

        <h3>YouTube</h3>
        <ul>
          <li>
            <strong>Data source:</strong> YouTube Data API v3
          </li>
          <li>
            <strong>Markets:</strong> MrBeast subscriber milestones, video view
            counts
          </li>
          <li>
            <strong>Method:</strong> Current count + linear projection to
            deadline based on recent growth rate. Milestone probability estimated
            from projected vs target.
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "signals",
    title: "Signal Calculation",
    content: (
      <>
        <h2>Signal Calculation Details</h2>

        <h3>Gaussian CDF Method</h3>
        <p>
          Used by temperature and crypto niches. The core idea: model
          uncertainty as a normal distribution around the best estimate.
        </p>
        <pre>
{`// Abramowitz & Stegun approximation (26.2.17)
function normalCDF(x) {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const a1 = 0.254829592, a2 = -0.284496736;
  const a3 = 1.421413741, a4 = -1.453152027;
  const a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5*t + a4)*t + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

// Temperature: "Will it be 80°F or higher?"
// forecast_high = 78°F, sigma = 4.5°F
P = 1 - normalCDF((80 - 78) / 4.5)  // ≈ 0.33

// Crypto: "Will BTC be up this hour?"
// change_so_far = +0.5%, sigma_hourly = 1.2%
// 40 minutes remaining out of 60 → fraction = 0.33
sigma_remaining = 1.2 * sqrt(0.33)  // ≈ 0.69%
P = normalCDF(0.5 / 0.69)  // ≈ 0.76`}
        </pre>

        <h3>CLOB vs Gamma Pricing</h3>
        <p>
          Polymarket has two price sources. The <strong>Gamma API</strong>{" "}
          provides cached <code>outcomePrices</code> that may be stale. The{" "}
          <strong>CLOB API</strong> provides real-time midpoint prices (average
          of best bid and ask). We prefer CLOB when available:
        </p>
        <pre>{`bestPrice = market.clob_yes_price ?? market.yes_price`}</pre>

        <h3>GBM Model (Finance)</h3>
        <p>
          Finance markets use a Geometric Brownian Motion CDF to compute
          probability. Given current price S, threshold K, annualized
          volatility &sigma;, and time T (in years):
        </p>
        <pre>
{`d2 = (ln(S/K) - σ²/2 × T) / (σ × √T)
P(above K) = Φ(d2)
P(in range [L,H]) = P(above L) - P(above H)`}
        </pre>

        <h3>Confidence Score</h3>
        <p>
          Each divergence record now includes a <strong>confidence score</strong>{" "}
          (0.0-1.0) based on: number of data sources (more = higher), methodology
          quality (model &gt; ensemble &gt; heuristic), and hours to market expiry
          (&lt;6h is highest confidence). This helps prioritize which divergences
          to act on.
        </p>

        <h3>Time-to-Expiry Decay</h3>
        <p>
          Divergences are amplified or dampened based on how soon the market
          expires. Markets expiring within 1 hour get a 1.5x multiplier (high
          urgency), while markets &gt;24 hours out get 0.8x (more time for
          correction).
        </p>

        <h3>LLM Fallback Parsing</h3>
        <p>
          When regex can&apos;t parse a market question (non-standard format),
          GPT-4o-mini classifies it into threshold_above, threshold_below,
          range, up_down, milestone, or bucket — then the appropriate probability
          model is applied. Results are cached per cycle.
        </p>

        <h3>Deduplication</h3>
        <p>
          A unique index on{" "}
          <code>(cycle_id, niche, market_question, signal_prob)</code> prevents
          duplicate records. Inserts use{" "}
          <code>upsert with ignoreDuplicates: true</code>.
        </p>

        <h3>Data Retention</h3>
        <p>
          pg_cron runs daily at 3 AM UTC, deleting divergences and cycles older
          than 30 days.
        </p>
      </>
    ),
  },
  {
    slug: "reading-data",
    title: "Reading the Data",
    content: (
      <>
        <h2>How to Read the Dashboard</h2>

        <h3>Stats Bar</h3>
        <ul>
          <li>
            <strong>Total Records</strong> — Number of market/signal comparisons
            in the current time window
          </li>
          <li>
            <strong>Avg Divergence</strong> — Mean absolute divergence. Higher =
            more disagreement between markets and signals
          </li>
          <li>
            <strong>Biggest Opportunity</strong> — The single largest divergence
            by absolute value
          </li>
        </ul>

        <h3>Divergence Table</h3>
        <p>
          The main data table. Click column headers to sort. Key columns:
        </p>
        <ul>
          <li>
            <strong>Poly YES</strong> — Current market price for YES outcome
          </li>
          <li>
            <strong>Signal Prob</strong> — Our computed probability from external
            data
          </li>
          <li>
            <strong>Divergence</strong> — The difference (signal - market).
            Green = signal thinks YES is underpriced. Red = overpriced.
          </li>
          <li>
            <strong>Detail</strong> — Brief explanation of the signal source data
          </li>
        </ul>
        <p>
          Rows with |divergence| &ge; 10% get a left orange border highlight.
        </p>

        <h3>What makes a good opportunity?</h3>
        <ul>
          <li>
            <strong>High absolute divergence</strong> (&gt;10%) — Larger gap
            between market and signal
          </li>
          <li>
            <strong>Low spread</strong> — Tighter bid-ask spread means less
            slippage when trading
          </li>
          <li>
            <strong>High volume</strong> — More liquid markets are easier to
            enter and exit
          </li>
          <li>
            <strong>Signal confidence</strong> — Temperature and crypto signals
            have quantitative uncertainty models. Finance and xTracker are more
            heuristic.
          </li>
        </ul>

        <h3>Market Detail Page</h3>
        <p>
          Click any market row to see its detail page with:
        </p>
        <ul>
          <li>Live orderbook from Polymarket CLOB WebSocket</li>
          <li>Price history chart with adjustable time intervals</li>
          <li>Metadata (CLOB price, Gamma price, spread, volume, end date)</li>
          <li>Full signal history across all monitor cycles</li>
        </ul>

        <h3>Date Range</h3>
        <p>
          Use the date range selector (6H, 12H, 24H, 48H, 7D) to narrow the
          data window. Default is 24 hours.
        </p>

        <h3>Export</h3>
        <p>
          Export the current filtered data as CSV or JSON using the export
          button.
        </p>
      </>
    ),
  },
  {
    slug: "architecture",
    title: "Architecture",
    content: (
      <>
        <h2>Technical Architecture</h2>

        <h3>Stack</h3>
        <ul>
          <li>
            <strong>Frontend:</strong> Next.js 16 (App Router), Tailwind CSS 4,
            Recharts, Framer Motion
          </li>
          <li>
            <strong>Backend:</strong> Supabase Edge Functions (Deno runtime),
            Supabase PostgreSQL
          </li>
          <li>
            <strong>Hosting:</strong> Vercel (frontend), Supabase (backend +
            DB)
          </li>
          <li>
            <strong>Realtime:</strong> Supabase Realtime (DB changes),
            Polymarket CLOB WebSocket (orderbook)
          </li>
        </ul>

        <h3>Data Flow</h3>
        <pre>
{`pg_cron (every 30 min)
  → Supabase Edge Function "monitor"
    → Gamma API: discover markets
    → CLOB API: enrich with midpoints + spreads
    → 8 signal adapters: fetch external data
    → Processors: compute divergences + confidence
    → GPT-4o-mini: generate cycle insight note
    → Supabase DB: upsert results + save insight
      → Supabase Realtime: push to dashboard`}
        </pre>

        <h3>Signal Adapters</h3>
        <pre>
{`signals/
  binance.ts     — Spot price + klines + funding rate + OI
  finance.ts     — Yahoo Finance with realized volatility
  temperature.ts — OWM + Open-Meteo ensemble (batch)
  xtracker.ts    — xTracker post counts
  sports.ts      — The Odds API for UFC
  youtube.ts     — YouTube Data API
  weather.ts     — Rain markets (no active markets)
  llm.ts         — GPT-4o-mini market parsing + sentiment
  insight.ts     — Cycle insight note generator`}
        </pre>

        <h3>API Endpoints</h3>
        <ul>
          <li>
            <code>GET /api/dashboard?lookback=N</code> — Dashboard data for last
            N hours
          </li>
          <li>
            <code>GET /api/auth</code> — Check auth status
          </li>
          <li>
            <code>POST /api/auth</code> — Authenticate with password
          </li>
          <li>
            <code>POST /api/donkey-in</code> — AI recommendation
          </li>
          <li>
            <code>GET /api/polymarket/book</code> — Proxy to CLOB orderbook
          </li>
          <li>
            <code>GET /api/polymarket/prices-history</code> — Proxy to CLOB
            price history
          </li>
          <li>
            <code>POST /api/llm/chat</code> — Chat with Kirkster AI (context-aware)
          </li>
        </ul>

        <h3>Database Schema</h3>
        <pre>
{`cycles
  id UUID PK
  status TEXT (running/completed/failed)
  started_at / completed_at TIMESTAMPTZ
  total_records INT, duration_ms INT
  error_message TEXT, niches_run TEXT[]

divergences
  id BIGINT PK
  cycle_id UUID FK → cycles
  niche, market_question, poly_yes_price
  signal_value, signal_prob, divergence
  signal_detail, confidence NUMERIC(4,3)
  condition_id, yes_token_id, no_token_id
  volume_24h, spread, end_date
  clob_yes_price, neg_risk, timestamp

llm_logs
  id BIGINT PK
  created_at TIMESTAMPTZ
  cycle_id UUID FK → cycles (nullable)
  type TEXT ('insight' | 'chat')
  role TEXT ('user' | 'assistant')
  content TEXT, metadata JSONB`}
        </pre>
      </>
    ),
  },
];

export function getDocBySlug(slug: string): DocEntry | undefined {
  return DOCS.find((d) => d.slug === slug);
}
