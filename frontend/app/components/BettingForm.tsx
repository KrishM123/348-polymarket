import React, { useState } from "react";
import { marketsAPI, Market, BetRequest } from "@/lib/markets";
import { usersAPI } from "@/lib/users";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function BettingForm({
  market,
  onBetPlaced,
}: {
  market: Market;
  onBetPlaced: () => void;
}) {
  const { isAuthenticated, user, updateUserBalance } = useAuth();
  const [selectedPrediction, setSelectedPrediction] = useState<
    "YES" | "NO" | null
  >(null);
  const [betAmount, setBetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [betError, setBetError] = useState("");

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
      return ((1 - currentOdds) / currentOdds) * amount;
    } else {
      return (currentOdds / (1 - currentOdds)) * amount;
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

      await marketsAPI.placeBet(market.mid, betData);

      // Fetch updated balance from server and update AuthContext
      try {
        const balanceResponse = await usersAPI.getUserBalance();
        updateUserBalance(balanceResponse.balance);
      } catch (balanceErr) {
        console.error("Failed to fetch updated balance:", balanceErr);
        // Fallback to manual calculation if API call fails
        if (user) {
          const newBalance = user.balance - parseFloat(betAmount);
          updateUserBalance(newBalance);
        }
      }

      setSelectedPrediction(null);
      setBetAmount("");
      setBetSuccess(true);

      onBetPlaced();
    } catch (err) {
      setBetError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setSubmitting(false);
    }
  };

  const profit = calculateProfit();

  return (
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedPrediction === "YES" ? "default" : "outline"}
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
              variant={selectedPrediction === "NO" ? "default" : "outline"}
              className={`h-12 ${
                selectedPrediction === "NO" ? "bg-red-600 hover:bg-red-700" : ""
              }`}
              onClick={() => setSelectedPrediction("NO")}
              disabled={submitting}
            >
              NO ({Math.round((1 - market.podd) * 100)}%)
            </Button>
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
                    <div className="text-xs text-green-700">Multiplier</div>
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
  );
}
