export interface Market {
  mid: number;
  name: string;
  description: string;
  podd: number;
  volume: number;
  end_date: string;
}

export interface MarketsResponse {
  success: boolean;
  markets: Market[];
  count: number;
}

export interface Bet {
  bId: number;
  uId: number;
  mId: number;
  podd: number;
  amt: number;
  yes: number;
  createdAt: string;
  uname: string;
}

export interface BetRequest {
  amount: number;
  prediction: boolean;
}

export interface BetResponse {
  success: boolean;
  message: string;
  bet_id: number;
  market_id: number;
  user_id: number;
  amount: number;
  odds_at_bet: number;
  new_market_odds: number;
  prediction: boolean;
}

export interface BetsResponse {
  success: boolean;
  market_id: number;
  bets: Bet[];
  count: number;
}

export interface Comment {
  cId: number;
  content: string;
  created_at: string;
  uId: number;
  uname: string;
  parent_id?: number;
  level: number;
}

export interface CommentsResponse {
  success: boolean;
  market_id: number;
  comments: Comment[];
  count: number;
}

export const marketsAPI = {
  getMarkets: async (): Promise<MarketsResponse> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch markets");
    }

    return response.json();
  },

  getMarket: async (
    marketId: number
  ): Promise<{ success: boolean; market: Market }> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/markets/${marketId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch market");
    }

    return response.json();
  },

  getMarketBets: async (marketId: number): Promise<BetsResponse> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/markets/${marketId}/bets`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch bets");
    }

    return response.json();
  },

  placeBet: async (
    marketId: number,
    betData: BetRequest
  ): Promise<BetResponse> => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/markets/${marketId}/bets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(betData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to place bet");
    }

    return response.json();
  },

  getMarketComments: async (marketId: number): Promise<CommentsResponse> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/markets/${marketId}/comments`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch comments");
    }
    return response.json();
  },

  postMarketComment: async (
    marketId: number,
    userId: number,
    content: string
  ): Promise<any> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/markets/${marketId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to post comment");
    }
    return response.json();
  },

  postMarketReply: async (
    marketId: number,
    parentId: number,
    userId: number,
    content: string
  ): Promise<any> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/markets/${marketId}/comments/${parentId}/replies`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to post reply");
    }
    return response.json();
  },

  async getTrendingMarkets(): Promise<MarketsResponse> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/markets/trending`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch trending markets");
    }
    return response.json();
  },
};
