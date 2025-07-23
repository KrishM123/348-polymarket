"use client";

import { useEffect, useState } from "react";
import { marketsAPI, UserProfit } from "../../lib/markets";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UserProfitsLeaderboard() {
  const [users, setUsers] = useState<UserProfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfits = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await marketsAPI.getUserProfits();
        const sortedUsers = response.users.sort((a, b) => b.percent_change - a.percent_change);
        setUsers(sortedUsers);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch user profits"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfits();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(percent / 100);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getPercentColor = (percent: number) => {
    if (percent > 0) return "text-green-600";
    if (percent < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading leaderboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading leaderboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profit Leaderboard</h1>
        <p className="text-gray-600">Top traders ranked by total profits</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            User Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Profits</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">% Change</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.uid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {getRankBadge(index + 1)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {user.uname}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <span className={getProfitColor(user.total_profits)}>
                        {formatCurrency(user.total_profits)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`flex items-center justify-end gap-1 ${getPercentColor(user.percent_change)}`}>
                        {user.percent_change > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : user.percent_change < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <Percent className="h-4 w-4" />
                        )}
                        {formatPercent(user.percent_change)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No user data available.</p>
        </div>
      )}
    </div>
  );
} 