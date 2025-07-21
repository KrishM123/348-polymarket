import React, { useEffect, useState } from "react";
import { marketsAPI, Bet } from "@/lib/markets";
import { Loader2 } from "lucide-react";

export default function RecentBets({ marketId }: { marketId: number }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const fetchBets = async () => {
      setLoading(true);
      try {
        const response = await marketsAPI.getMarketBets(marketId);
        setBets(response.bets);
      } catch (err) {
        console.error("Failed to fetch bets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [marketId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading bets...</span>
      </div>
    );
  }

  return (
    <div>
      {bets.length === 0 ? (
        <div className="text-center py-0 text-gray-500 text-sm">
          No bets placed yet. Be the first to bet on this market!
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[60px_70px_1fr_1fr_1fr_1fr_1fr] gap-4 p-4 border-gray-200 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
            <div>Type</div>
            <div>Prediction</div>
            <div>User</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Odds</div>
            <div>Potential Profit</div>
          </div>

          {/* Bet Items */}
          {bets.map((bet) => {
            const isBuy = bet.amt > 0;
            const amount = Math.abs(bet.amt);

            // Calculate potential win only for buys
            const potentialWin = isBuy
              ? bet.yes
                ? ((1 - bet.podd) / bet.podd) * amount
                : (bet.podd / (1 - bet.podd)) * amount
              : 0;

            return (
              <div
                key={bet.bId}
                className="grid grid-cols-[60px_70px_1fr_1fr_1fr_1fr_1fr] gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div
                    className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                      isBuy
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {isBuy ? "BUY" : "SELL"}
                  </div>
                </div>
                <div>
                  <div
                    className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                      bet.yes
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {bet.yes ? "YES" : "NO"}
                  </div>
                </div>
                <div className="font-medium text-sm">{bet.uname}</div>
                <div className="text-xs text-gray-500">
                  {formatBetTime(bet.createdAt)}
                </div>
                <div className="font-semibold text-sm">
                  ${amount.toFixed(2)}
                </div>
                <div className="font-semibold text-sm">
                  {Math.round(bet.podd * 100)}%
                </div>
                <div
                  className={`font-semibold text-sm ${
                    isBuy ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {isBuy ? `$${potentialWin.toFixed(2)}` : "-"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
