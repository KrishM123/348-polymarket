"use client";

import { useAuth } from "./contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Loader2, TrendingUp, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { marketsAPI, Market } from "../lib/markets";
import MarketCard from "./components/MarketCard";
import UserProfitsLeaderboard from "./components/UserProfitsLeaderboard";
import { Button } from "@/components/ui/button";

type ViewMode = "latest" | "trending";
type TabMode = "markets" | "leaderboard";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("latest");
  const [tabMode, setTabMode] = useState<TabMode>("markets");

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          viewMode === "trending"
            ? await marketsAPI.getTrendingMarkets()
            : await marketsAPI.getMarkets();
        setMarkets(response.markets);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch markets"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [viewMode]);

  return (
    <div className="px-8 py-6">
      <div className="mx-auto">
        {/* Main Tab Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button
              variant={tabMode === "markets" ? "default" : "outline"}
              onClick={() => setTabMode("markets")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-5 w-5" />
              Markets
            </Button>
            <Button
              variant={tabMode === "leaderboard" ? "default" : "outline"}
              onClick={() => setTabMode("leaderboard")}
              className="flex items-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              Leaderboard
            </Button>
          </div>

          {/* Market View Toggle - only show when on markets tab */}
          {tabMode === "markets" && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === "latest" ? "default" : "outline"}
                onClick={() => setViewMode("latest")}
                size="sm"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Latest
              </Button>
              <Button
                variant={viewMode === "trending" ? "default" : "outline"}
                onClick={() => setViewMode("trending")}
                size="sm"
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </Button>
            </div>
          )}
        </div>

        {/* Render content based on selected tab */}
        {tabMode === "markets" ? (
          <>
            {!isAuthenticated && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Please login or create an account</AlertTitle>
                <AlertDescription>
                  You can browse markets, but you need to authenticate to place bets
                  and participate in trades.
                </AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading markets...</span>
              </div>
            )}

            {error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error loading markets</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!loading && !error && markets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No markets available at the moment.</p>
              </div>
            )}

            {!loading && !error && markets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets.map((market) => (
                  <MarketCard key={market.mid} market={market} />
                ))}
              </div>
            )}
          </>
        ) : (
          <UserProfitsLeaderboard />
        )}
      </div>
    </div>
  );
}
