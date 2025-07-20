import { tokenStorage } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UserBet {
  bId: number;
  mId: number;
  marketName: string;
  amt: number;
  podd: number;
  prediction: boolean;
  createdAt: string;
}

interface GetUserBetsResponse {
  success: boolean;
  bets: UserBet[];
  count: number;
}

export const usersAPI = {
  getUserBets: async (userId: number): Promise<GetUserBetsResponse> => {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new Error("Authentication required to fetch user bets");
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/bets`, {
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

  sellBet: async (
    betId: number
  ): Promise<{ success: boolean; message: string }> => {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new Error("Authentication required to sell a bet");
    }

    const response = await fetch(`${API_BASE_URL}/bets/${betId}/sell`, {
      method: "POST",
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
};
