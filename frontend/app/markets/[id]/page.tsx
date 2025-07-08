"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { marketsAPI, Market, BetRequest, Bet } from "@/lib/markets";
import { useAuth } from "@/app/contexts/AuthContext";
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
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
} from "lucide-react";
import CommentsSection from "@/app/components/CommentsSection";

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = Number(params.id);
  const { isAuthenticated, user, updateUserBalance } = useAuth();

  const [market, setMarket] = useState<Market | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [betsLoading, setBetsLoading] = useState(false);
  const [error, setError] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [betsExpanded, setBetsExpanded] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(true);

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
      fetchBets();
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

  const fetchBets = async () => {
    setBetsLoading(true);
    try {
      const response = await marketsAPI.getMarketBets(marketId);
      setBets(response.bets);
    } catch (err) {
      console.error("Failed to fetch bets:", err);
    } finally {
      setBetsLoading(false);
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

      // Update user balance in context
      if (user) {
        const newBalance = user.balance - parseFloat(betAmount);
        updateUserBalance(newBalance);
      }

      // Reset form
      setSelectedPrediction(null);
      setBetAmount("");
      setBetSuccess(true);

      // Refresh market data and bets to get updated odds and new bet
      setTimeout(() => {
        fetchMarket();
        fetchBets();
      }, 1000);
    } catch (err) {
      setBetError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setSubmitting(false);
    }
  };

  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    } else {
      return `${volume.toFixed(0)}`;
    }
  };

  // Format end date
  const formatEndDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "Ended";
    } else if (diffDays === 0) {
      return "Ends today";
    } else if (diffDays === 1) {
      return "Ends tomorrow";
    } else {
      return `Ends in ${diffDays} days`;
    }
  };

  // Format bet time
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

  // Calculate percentage for display
  const yesPercentage = Math.round(market.podd * 100);
  const noPercentage = 100 - yesPercentage;

  return (
    <div className="px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-12">
          {/* Left Column - Market Information */}
          <div className="col-span-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {market.name}
              </h1>
              <div className="mb-6">
                <div
                  className={`${!descriptionExpanded ? "line-clamp-3" : ""}`}
                >
                  {market.description}
                </div>
                {market.description.length > 150 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 -ml-2 h-auto text-blue-600 hover:text-blue-700"
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  >
                    {descriptionExpanded ? (
                      <>
                        Show less <ChevronUp className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show more <ChevronDown className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Compact Stats Section */}
              <div className="space-y-4">
                {/* Visual Odds Representation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-green-600">YES</span>
                    <span className="text-red-600">NO</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${yesPercentage}%` }}
                    />
                  </div>

                  {/* Percentage Display */}
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">
                      {yesPercentage}%
                    </span>
                    <span className="text-red-600 font-semibold">
                      {noPercentage}%
                    </span>
                  </div>
                </div>

                {/* Bottom Info Row */}
                <div className="flex justify-between items-center pt-4 border-t text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatVolume(market.volume)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatEndDate(market.end_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bets Table */}
            <div className="mt-8">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Bets
                  </h3>
                  <p className="text-sm text-gray-500">
                    All bets placed on this market
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBetsExpanded(!betsExpanded)}
                  className="flex items-center gap-2"
                >
                  {betsExpanded ? (
                    <>
                      Hide <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {betsExpanded && (
                <div>
                  {betsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">
                        Loading bets...
                      </span>
                    </div>
                  ) : bets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No bets placed yet. Be the first to bet on this market!
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {/* Column Headers */}
                      <div className="grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr] gap-4 p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">
                              Prediction
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">
                              User
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">
                              Date
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-medium text-gray-600">
                            Amount
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-medium text-gray-600">
                            Odds
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-medium text-gray-600">
                            Potential Win
                          </span>
                        </div>
                      </div>

                      {/* Bet Items */}
                      {bets.map((bet) => {
                        // Calculate potential win
                        const potentialWin = bet.yes
                          ? ((1 - bet.podd) / bet.podd) * bet.amt
                          : (bet.podd / (1 - bet.podd)) * bet.amt;

                        return (
                          <div
                            key={bet.bId}
                            className="grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr] gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-start">
                              <span
                                className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                                  bet.yes
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {bet.yes ? "YES" : "NO"}
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="font-medium text-sm">
                                {bet.uname}
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="text-xs text-gray-500">
                                {formatBetTime(bet.createdAt)}
                              </span>
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-sm">
                                ${bet.amt.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-sm">
                                {Math.round(bet.podd * 100)}%
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-sm text-green-600">
                                ${potentialWin.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Comments
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentsExpanded(!commentsExpanded)}
                  className="flex items-center gap-2"
                >
                  {commentsExpanded ? (
                    <>
                      Hide <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <CommentsSection
                marketId={marketId}
                expanded={commentsExpanded}
              />
            </div>
          </div>

          {/* Right Column - Betting Form */}
          <div className="col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader className="-mb-4">
                  <CardTitle>Place Your Bet</CardTitle>
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

                  {/* Prediction Selection */}
                  <div className="space-y-2">
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
                        YES ({Math.round(market.podd * 100)}%)
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
                        NO ({Math.round((1 - market.podd) * 100)}%)
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
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-end gap-6">
                      {/* Left: Heading and Large Profit */}
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-green-700 mb-1">
                          Potential Profit
                        </div>
                        <div className="text-3xl font-bold text-green-700">
                          ${profit.toFixed(2)}
                        </div>
                      </div>
                      {/* Right: Details */}
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <div className="flex gap-4">
                          <div>
                            <div className="text-xs text-green-700">Payout</div>
                            <div className="text-sm font-semibold text-green-700">
                              ${(parseFloat(betAmount) + profit).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-green-700">
                              Multiplier
                            </div>
                            <div className="text-sm font-semibold text-green-700">
                              {betAmount && parseFloat(betAmount) > 0
                                ? (
                                    (parseFloat(betAmount) + profit) /
                                    parseFloat(betAmount)
                                  ).toFixed(2) + "x"
                                : "--"}
                            </div>
                          </div>
                        </div>
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
