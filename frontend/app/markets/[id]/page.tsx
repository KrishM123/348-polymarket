"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { marketsAPI, Market, BetRequest } from "../../../lib/markets";
import { useAuth } from "../../../app/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  CheckCircle,
} from "lucide-react";

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = Number(params.id);
  const { isAuthenticated, user } = useAuth();

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Betting form state
  const [selectedPrediction, setSelectedPrediction] = useState<
    "YES" | "NO" | null
  >(null);
  const [betAmount, setBetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [betError, setBetError] = useState("");

  useEffect(() => {
    if (marketId) {
      fetchMarket();
    }
  }, [marketId]);

  const fetchMarket = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await marketsAPI.getMarket(marketId);
      setMarket(response.market);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch market");
    } finally {
      setLoading(false);
    }
  };

  // Calculate potential profit
  const calculateProfit = () => {
    if (
      !market ||
      !selectedPrediction ||
      !betAmount ||
      parseFloat(betAmount) <= 0
    ) {
      return null;
    }

    const amount = parseFloat(betAmount);
    const currentOdds = market.podd;

    if (selectedPrediction === "YES") {
      // If betting YES, profit = (1 - currentOdds) / currentOdds * betAmount
      const profit = ((1 - currentOdds) / currentOdds) * amount;
      return profit;
    } else {
      // If betting NO, profit = currentOdds / (1 - currentOdds) * betAmount
      const profit = (currentOdds / (1 - currentOdds)) * amount;
      return profit;
    }
  };

  const handlePlaceBet = async () => {
    if (!isAuthenticated) {
      setBetError("You must be logged in to place bets");
      return;
    }

    if (!selectedPrediction || !betAmount || parseFloat(betAmount) <= 0) {
      setBetError("Please select a prediction and enter a valid amount");
      return;
    }

    setSubmitting(true);
    setBetError("");
    setBetSuccess(false);

    try {
      const betData: BetRequest = {
        amount: parseFloat(betAmount),
        prediction: selectedPrediction === "YES",
      };

      const response = await marketsAPI.placeBet(marketId, betData);

      // Reset form
      setSelectedPrediction(null);
      setBetAmount("");
      setBetSuccess(true);

      // Refresh market data to get updated odds
      setTimeout(() => {
        fetchMarket();
      }, 1000);
    } catch (err) {
      setBetError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setSubmitting(false);
    }
  };

  const profit = calculateProfit();

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading market...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="px-8 py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Market not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Market Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{market.name}</CardTitle>
                <CardDescription className="text-base">
                  {market.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Current Odds</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round(market.podd * 100)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Total Volume</span>
                    <span className="text-xl font-semibold">
                      ${market.volume.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">End Date</span>
                    <span className="text-lg">
                      {new Date(market.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Betting Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Place Your Bet</CardTitle>
                  <CardDescription>
                    Choose your prediction and enter your bet amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Success Message */}
                  {betSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Bet placed successfully! Market odds have been updated.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Message */}
                  {betError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {betError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Current Odds Display */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Odds</Label>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">
                        YES: {Math.round(market.podd * 100)}%
                      </span>
                      <span className="text-red-600">
                        NO: {Math.round((1 - market.podd) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Prediction Selection */}
                  <div className="space-y-2">
                    <Label>Your Prediction</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          selectedPrediction === "YES" ? "default" : "outline"
                        }
                        className={`h-12 ${
                          selectedPrediction === "YES"
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                        }`}
                        onClick={() => setSelectedPrediction("YES")}
                        disabled={submitting}
                      >
                        YES
                      </Button>
                      <Button
                        variant={
                          selectedPrediction === "NO" ? "default" : "outline"
                        }
                        className={`h-12 ${
                          selectedPrediction === "NO"
                            ? "bg-red-600 hover:bg-red-700"
                            : ""
                        }`}
                        onClick={() => setSelectedPrediction("NO")}
                        disabled={submitting}
                      >
                        NO
                      </Button>
                    </div>
                  </div>

                  {/* Bet Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Bet Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  {/* Potential Profit Display */}
                  {profit !== null && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Potential Profit
                        </span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${profit.toFixed(2)}
                      </div>
                      <div className="text-xs text-green-600">
                        If {selectedPrediction} wins, you'll receive $
                        {(parseFloat(betAmount) + profit).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Place Bet Button */}
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={
                      !selectedPrediction ||
                      !betAmount ||
                      parseFloat(betAmount) <= 0 ||
                      submitting ||
                      !isAuthenticated
                    }
                    onClick={handlePlaceBet}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing Bet...
                      </>
                    ) : (
                      "Place Bet"
                    )}
                  </Button>

                  {/* Info Text */}
                  {!isAuthenticated && (
                    <div className="text-xs text-gray-500 text-center">
                      You must be logged in to place bets
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
