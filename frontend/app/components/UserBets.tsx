"use client";

import React, { useState } from "react";
import { UserHolding, usersAPI } from "@/lib/users";
import { useAuth } from "@/app/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserBetsProps {
  holdings: UserHolding[];
  loading: boolean;
  onBetSold: () => void;
  error?: string;
}

export default function UserBets({
  holdings,
  loading,
  onBetSold,
  error,
}: UserBetsProps) {
  const { updateUserBalance } = useAuth();
  const [sellingHolding, setSellingHolding] = useState<UserHolding | null>(
    null
  );
  const [sellAmounts, setSellAmounts] = useState<{ [key: string]: string }>({});

  const handleAmountChange = (key: string, value: string, max: number) => {
    const numericValue = Number(value);
    if (value === "" || (numericValue >= 0 && numericValue <= max)) {
      setSellAmounts((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSell = async (holding: UserHolding) => {
    const key = `${holding.mId}-${holding.yes}`;
    const sellAmount = parseFloat(sellAmounts[key] || "0");

    if (sellAmount <= 0) return;

    setSellingHolding(holding);
    try {
      await usersAPI.placeBet(holding.mId, {
        amount: -sellAmount,
        prediction: holding.yes,
      });

      // Fetch updated balance and update AuthContext
      try {
        const balanceResponse = await usersAPI.getUserBalance();
        updateUserBalance(balanceResponse.balance);
      } catch (balanceErr) {
        console.error("Failed to fetch updated balance:", balanceErr);
      }

      onBetSold(); // Refresh the holdings list and profile data
      setSellAmounts((prev) => ({ ...prev, [key]: "" })); // Clear input
    } catch (err) {
      console.error("Failed to sell holding:", err);
      // Optionally, show an error message to the user
    } finally {
      setSellingHolding(null);
    }
  };

  const handleSellAll = async (holding: UserHolding) => {
    const key = `${holding.mId}-${holding.yes}`;
    
    setSellingHolding(holding);
    try {
      // Sell the entire current market value to avoid precision issues
      const sellAmount = holding.current_value;
      
      await usersAPI.placeBet(holding.mId, {
        amount: -sellAmount,
        prediction: holding.yes,
      });

      // Fetch updated balance and update AuthContext
      try {
        const balanceResponse = await usersAPI.getUserBalance();
        updateUserBalance(balanceResponse.balance);
      } catch (balanceErr) {
        console.error("Failed to fetch updated balance:", balanceErr);
      }

      onBetSold(); // Refresh the holdings list and profile data
      setSellAmounts((prev) => ({ ...prev, [key]: "" })); // Clear input
    } catch (err) {
      console.error("Failed to sell all holding:", err);
      // Optionally, show an error message to the user
    } finally {
      setSellingHolding(null);
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

  if (holdings.filter((holding) => holding.current_value > 0.01).length === 0) {
    return (
      <p className="text-center text-gray-500 py-6">
        You have no active holdings.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_200px] gap-4 p-4 border-gray-200 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
        <div>Market</div>
        <div className="text-center">Prediction</div>
        <div className="text-right">Units</div>
        <div className="text-right">Avg. Price</div>
        <div className="text-right">Current Value</div>
        <div className="text-right">Unrealized Gains</div>
        <div className="text-center">Actions</div>
      </div>

      {holdings
        .filter((holding) => holding.current_value > 0.01)
        .map((holding) => {
          const key = `${holding.mId}-${holding.yes}`;
          const sellAmount = sellAmounts[key] || "";
          const isSelling = sellingHolding === holding;
          const sellAmountNum = parseFloat(sellAmount);
          
          // Use epsilon tolerance for better precision handling
          const EPSILON = 0.01;
          const canSell =
            !isSelling &&
            !isNaN(sellAmountNum) &&
            sellAmountNum > 0 &&
            sellAmountNum <= holding.current_value + EPSILON;

          return (
            <div
              key={key}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_200px] gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors items-center"
            >
              <Link
                href={`/markets/${holding.mId}`}
                className="font-medium text-sm text-blue-600 hover:underline"
              >
                {holding.market_name}
              </Link>
              <div className="text-center">
                <div
                  className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                    holding.yes
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {holding.yes ? "YES" : "NO"}
                </div>
              </div>
              <div className="font-semibold text-sm text-right">
                {holding.net_units.toFixed(2)}
              </div>
              <div className="font-semibold text-sm text-right">
                ${holding.avg_buy_price_per_unit.toFixed(2)}
              </div>
              <div className="font-semibold text-sm text-right">
                ${holding.current_value.toFixed(2)}
              </div>
              <div
                className={`font-semibold text-sm text-right flex items-center justify-end ${
                  holding.unrealized_gains >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {holding.unrealized_gains >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                ${Math.abs(holding.unrealized_gains).toFixed(2)}
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Amount ($)"
                  className="h-8 text-xs"
                  value={sellAmount}
                  onChange={(e) =>
                    handleAmountChange(
                      key,
                      e.target.value,
                      holding.current_value
                    )
                  }
                  disabled={isSelling}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSell(holding)}
                  disabled={!canSell}
                  className="h-8 px-2 text-xs"
                >
                  {isSelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Sell"
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSellAll(holding)}
                  disabled={isSelling}
                  className="h-8 px-2 text-xs bg-red-600 hover:bg-red-700"
                >
                  {isSelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Sell All"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
