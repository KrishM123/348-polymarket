"use client";

import React, { useState } from "react";
import { UserHolding, usersAPI } from "@/lib/users";
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
      onBetSold(); // Refresh the holdings list
      setSellAmounts((prev) => ({ ...prev, [key]: "" })); // Clear input
    } catch (err) {
      console.error("Failed to sell holding:", err);
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

  if (holdings.length === 0) {
    return (
      <p className="text-center text-gray-500 py-6">
        You have no active holdings.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_180px] gap-4 p-4 border-gray-200 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
        <div>Market</div>
        <div className="text-center">Prediction</div>
        <div className="text-right">Units</div>
        <div className="text-right">Avg. Price</div>
        <div className="text-right">Current Value</div>
        <div className="text-right">Unrealized Gains</div>
        <div className="text-center">Action</div>
      </div>

      {holdings.map((holding) => {
        const key = `${holding.mId}-${holding.yes}`;
        const sellAmount = sellAmounts[key] || "";
        const isSelling = sellingHolding === holding;
        const sellAmountNum = parseFloat(sellAmount);
        const canSell =
          !isSelling &&
          !isNaN(sellAmountNum) &&
          sellAmountNum > 0 &&
          sellAmountNum <= holding.current_value;

        return (
          <div
            key={key}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_180px] gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors items-center"
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
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Amount ($)"
                className="h-9"
                value={sellAmount}
                onChange={(e) =>
                  handleAmountChange(key, e.target.value, holding.current_value)
                }
                disabled={isSelling}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSell(holding)}
                disabled={!canSell}
              >
                {isSelling ? (
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
