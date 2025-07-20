"use client";

import React, { useState } from "react";
import { UserBet, usersAPI } from "@/lib/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UserBetsProps {
  bets: UserBet[];
  loading: boolean;
  onBetSold: () => void;
  error?: string;
}

export default function UserBets({
  bets,
  loading,
  onBetSold,
  error,
}: UserBetsProps) {
  const [sellingBetId, setSellingBetId] = useState<number | null>(null);

  const handleSellBet = async (betId: number) => {
    console.log("Selling bet:", betId);
    setSellingBetId(betId);
    try {
      await usersAPI.sellBet(betId);
      onBetSold(); // Refresh the bets list
    } catch (err) {
      console.error("Failed to sell bet:", err);
      // Optionally, show an error message to the user
    } finally {
      setSellingBetId(null);
    }
  };

  const formatBetTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (bets.length === 0) {
    return (
      <p className="text-center text-gray-500 py-6">No bets placed yet.</p>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-[2fr_70px_1fr_1fr_1fr_1fr_80px] gap-4 p-4 border-gray-200 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
        <div>Market</div>
        <div>Prediction</div>
        <div>Amount</div>
        <div>Date</div>
        <div>Odds</div>
        <div>Potential Profit</div>
        <div>Action</div>
      </div>

      {bets
        .filter((bet) => bet.amt > 0)
        .map((bet) => {
          const potentialWin = bet.prediction
            ? ((1 - bet.podd) / bet.podd) * bet.amt
            : (bet.podd / (1 - bet.podd)) * bet.amt;

          return (
            <div
              key={bet.bId}
              className="grid grid-cols-[2fr_70px_1fr_1fr_1fr_1fr_80px] gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors items-center"
            >
              <Link
                href={`/markets/${bet.mId}`}
                className="font-medium text-sm text-blue-600 hover:underline"
              >
                {bet.marketName}
              </Link>
              <div>
                <div
                  className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                    bet.prediction
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {bet.prediction ? "YES" : "NO"}
                </div>
              </div>
              <div className="font-semibold text-sm">${bet.amt.toFixed(2)}</div>
              <div className="text-xs text-gray-500">
                {formatBetTime(bet.createdAt)}
              </div>
              <div className="font-semibold text-sm">
                {Math.round(bet.podd * 100)}%
              </div>
              <div className="font-semibold text-sm text-green-600">
                ${potentialWin.toFixed(2)}
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSellBet(bet.bId)}
                  disabled={sellingBetId === bet.bId}
                >
                  {sellingBetId === bet.bId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sell"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
