"use client";

import { useAuth } from "../contexts/AuthContext";
import {
  Loader2,
  DollarSign,
  BarChart,
  TrendingUp,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import UserBets from "@/app/components/UserBets";
import { usersAPI, UserHolding, UserProfit, UserBet } from "@/lib/users";
import { useEffect, useState } from "react";
import AllUserBets from "../components/AllUserBets";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [bets, setBets] = useState<UserBet[]>([]);
  const [profileData, setProfileData] = useState<UserProfit | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [holdingsExpanded, setHoldingsExpanded] = useState(true);
  const [betsExpanded, setBetsExpanded] = useState(true);

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const [holdingsRes, profitsRes, betsRes] = await Promise.all([
        usersAPI.getUserHoldings(),
        usersAPI.getUserProfits(),
        usersAPI.getUserBets(),
      ]);
      setHoldings(holdingsRes.holdings);
      setBets(betsRes.bets);
      const userProfit = profitsRes.users.find((p) => p.uid === user.id);
      setProfileData(userProfit || null);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  if (loading) {
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">Loading markets...</span>
    </div>;
  }

  return (
    <div className="px-8 py-6 mx-auto">
      {!user && !loading && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Please login or create an account</AlertTitle>
          <AlertDescription>
            You can browse markets, but you need to authenticate to place bets
            and participate in trades.
          </AlertDescription>
        </Alert>
      )}
      {user && (
        <>
          <div className="flex items-center justify-between mb-8 gap-4">
            <div className="flex items-center space-x-4 w-full">
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src="/placeholder-avatar.png"
                  alt={user.username}
                />
                <AvatarFallback>
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{user.username}</h1>
                <p className="text-gray-500">Welcome to your profile</p>
              </div>
            </div>

            <Card className="gap-0 py-4 px-0 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${user.balance?.toFixed(2) ?? "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4 px-0 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Bets
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dataLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    holdings.length
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-4 px-0 w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dataLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : profileData ? (
                    `$${
                      profileData.total_profits.toFixed(2) === "-0.00"
                        ? "0.00"
                        : profileData.total_profits.toFixed(2)
                    }`
                  ) : (
                    "$0.00"
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between mb-4">
              <div className="text-lg font-semibold text-gray-900">
                Active Bets
              </div>
              <Button
                variant="ghost"
                onClick={() => setHoldingsExpanded(!holdingsExpanded)}
              >
                {holdingsExpanded ? (
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
            {holdingsExpanded && (
              <UserBets
                holdings={holdings}
                loading={dataLoading}
                onBetSold={fetchProfileData}
              />
            )}
          </div>
          <div className="mt-8">
            <div className="flex items-end justify-between mb-4">
              <div className="text-lg font-semibold text-gray-900">
                Transactions
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
            {betsExpanded && <AllUserBets bets={bets} loading={dataLoading} />}
          </div>
        </>
      )}
    </div>
  );
}
