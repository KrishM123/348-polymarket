"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { marketsAPI, Market } from "@/lib/markets";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import CommentsSection from "@/app/components/CommentsSection";
import RecentBets from "@/app/components/RecentBets";
import BettingForm from "@/app/components/BettingForm";

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = Number(params.id);

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [betsExpanded, setBetsExpanded] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(true);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    } else {
      return `${volume.toFixed(0)}`;
    }
  };

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

  useEffect(() => {
    if (marketId) {
      fetchMarket();
    }
  }, [marketId]);

  const handleBetPlaced = () => {
    setTimeout(() => {
      fetchMarket();
    }, 500);
  };

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

  const yesPercentage = Math.round(market.podd * 100);
  const noPercentage = 100 - yesPercentage;

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto grid grid-cols-3 gap-12">
      {/* Market Information */}
      <div className="col-span-2">
        <>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {market.name}
          </div>
          <div className="mb-6">
            <div className={`${!descriptionExpanded ? "line-clamp-2" : ""}`}>
              {market.description}
            </div>
            {market.description.length > 100 && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 -ml-2 h-auto text-blue-600 hover:text-blue-700 text-sm"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              >
                {descriptionExpanded ? (
                  <>
                    Show less <ChevronUp className="ml-1 h-4 w-4 inline" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="ml-1 h-4 w-4 inline" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Compact Stats Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <div className="text-green-600">YES</div>
                <div className="text-red-600">NO</div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>

              {/* Percentage Display */}
              <div className="flex justify-between text-sm font-medium">
                <div className="text-green-600">{yesPercentage}%</div>
                <div className="text-red-600">{noPercentage}%</div>
              </div>
            </div>

            {/* Bottom Info Row */}
            <div className="flex justify-between items-center pt-4 border-t text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <div>{formatVolume(market.volume)}</div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <div>{formatEndDate(market.end_date)}</div>
              </div>
            </div>
          </div>
        </>

        {/* Recent Bets Section */}
        <div className="mt-8">
          <div className="flex items-end justify-between mb-4">
            <div className="text-lg font-semibold text-gray-900">
              Recent Bets
            </div>
            <Button
              variant="ghost"
              onClick={() => setBetsExpanded(!betsExpanded)}
            >
              {betsExpanded ? (
                <>
                  Hide <ChevronUp className="ml-1 h-4 w-4 inline" />
                </>
              ) : (
                <>
                  Show <ChevronDown className="ml-1 h-4 w-4 inline" />
                </>
              )}
            </Button>
          </div>
          {betsExpanded && <RecentBets marketId={marketId} />}
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-4">
            <div className="text-lg font-semibold text-gray-900">Comments</div>
            <Button
              variant="ghost"
              onClick={() => setCommentsExpanded(!commentsExpanded)}
            >
              {commentsExpanded ? (
                <>
                  Hide <ChevronUp className="ml-1 h-4 w-4 inline" />
                </>
              ) : (
                <>
                  Show <ChevronDown className="ml-1 h-4 w-4 inline" />
                </>
              )}
            </Button>
          </div>
          {commentsExpanded && <CommentsSection marketId={marketId} />}
        </div>
      </div>

      {/* Betting Form */}
      <div className="col-span-1">
        <BettingForm market={market} onBetPlaced={handleBetPlaced} />
      </div>
    </div>
  );
}
