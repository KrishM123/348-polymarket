import { tokenStorage } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UserHolding {
  mId: number;
  market_name: string;
  net_units: number;
  avg_buy_price_per_unit: number;
  yes: boolean;
  unrealized_gains: number;
  current_value: number;
  percent_change: number;
  current_odds: number;
  bought_units: number;
  sold_units: number;
  total_invested: number;
}

interface GetUserHoldingsResponse {
  success: boolean;
  holdings: UserHolding[];
  total_holdings: number;
  total_unrealized_gains: number;
  total_current_value: number;
  total_invested: number;
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
  prediction: boolean;
}

export interface UserProfit {
  uid: number;
  uname: string;
  current_balance: number;
  realized_gains: number;
  unrealized_gains: number;
  total_profits: number;
  percent_change: number;
}

interface GetUserProfitsResponse {
  success: boolean;
  users: UserProfit[];
}

export const usersAPI = {
  getUserHoldings: async (): Promise<GetUserHoldingsResponse> => {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new Error("Authentication required to fetch user holdings");
    }

    const response = await fetch(`${API_BASE_URL}/api/user-holdings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  },

  getUserProfits: async (): Promise<GetUserProfitsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user-profits`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user profits");
    }

    return response.json();
  },

  placeBet: async (
    marketId: number,
    betData: BetRequest
  ): Promise<BetResponse> => {
    const token = tokenStorage.getToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/markets/${marketId}/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(betData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to place bet");
    }

    return response.json();
  },
};
