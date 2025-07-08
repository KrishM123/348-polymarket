const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Market {
  mid: number;
  name: string;
  description: string;
  podd: number; // probability (0.00 to 1.00)
  volume: number;
  end_date: string;
}

export interface MarketsResponse {
  success: boolean;
  markets: Market[];
  count: number;
}

export const marketsAPI = {
  getMarkets: async (): Promise<MarketsResponse> => {
    const response = await fetch(`${API_BASE_URL}/markets`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch markets");
    }

    return response.json();
  },

  getMarket: async (
    marketId: number
  ): Promise<{ success: boolean; market: Market }> => {
    const response = await fetch(`${API_BASE_URL}/markets/${marketId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch market");
    }

    return response.json();
  },
};
