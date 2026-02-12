import { HermesClient } from "@pythnetwork/hermes-client";
import {
  PYTH_HERMES_URL,
  PYTH_PRICE_FEEDS,
  type StablecoinSymbol,
} from "./config";

export interface PriceData {
  symbol: StablecoinSymbol;
  price: number;
  confidence: number;
  timestamp: Date;
}

export class PriceMonitor {
  private hermesClient: HermesClient;
  private priceHistory: Map<StablecoinSymbol, PriceData[]> = new Map();
  private readonly MAX_HISTORY = 360; // ~1 hour at 10s intervals

  constructor() {
    this.hermesClient = new HermesClient(PYTH_HERMES_URL);
    // Initialize history arrays
    for (const symbol of Object.keys(PYTH_PRICE_FEEDS) as StablecoinSymbol[]) {
      this.priceHistory.set(symbol, []);
    }
  }

  async fetchPrices(): Promise<PriceData[]> {
    const symbols = Object.keys(PYTH_PRICE_FEEDS) as StablecoinSymbol[];
    const prices: PriceData[] = [];

    // Fetch each feed individually so one failure doesn't block others
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        const feedId = PYTH_PRICE_FEEDS[symbol];
        const response = await this.hermesClient.getLatestPriceUpdates([feedId]);

        if (!response?.parsed?.[0]?.price) return null;

        const update = response.parsed[0];
        const price = Number(update.price.price) * Math.pow(10, update.price.expo);
        const confidence = Number(update.price.conf) * Math.pow(10, update.price.expo);

        return { symbol, price, confidence, timestamp: new Date() } as PriceData;
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const priceData = result.value;
        prices.push(priceData);

        // Store in history
        const history = this.priceHistory.get(priceData.symbol)!;
        history.push(priceData);
        if (history.length > this.MAX_HISTORY) {
          history.shift();
        }
      }
    }

    if (prices.length === 0) {
      console.error("[Monitor] No prices received from any feed");
    } else if (prices.length < symbols.length) {
      const fetched = prices.map((p) => p.symbol).join(", ");
      console.warn(`[Monitor] Partial data: got ${fetched} (${prices.length}/${symbols.length})`);
    }

    return prices;
  }

  getHistory(symbol: StablecoinSymbol): PriceData[] {
    return this.priceHistory.get(symbol) || [];
  }

  getAveragePrice(symbol: StablecoinSymbol, windowSize: number = 60): number | null {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length === 0) return null;

    const window = history.slice(-windowSize);
    const sum = window.reduce((acc, p) => acc + p.price, 0);
    return sum / window.length;
  }

  getVolatility(symbol: StablecoinSymbol, windowSize: number = 60): number {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < 2) return 0;

    const window = history.slice(-windowSize);
    const avg = window.reduce((acc, p) => acc + p.price, 0) / window.length;
    const variance = window.reduce((acc, p) => acc + Math.pow(p.price - avg, 2), 0) / window.length;
    return Math.sqrt(variance);
  }
}
