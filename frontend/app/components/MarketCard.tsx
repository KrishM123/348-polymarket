"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Market } from "../../lib/markets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Calendar } from "lucide-react";

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const router = useRouter();

  // Calculate percentage for display
  const yesPercentage = Math.round(market.podd * 100);
  const noPercentage = 100 - yesPercentage;

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

  const handleClick = () => {
    router.push(`/markets/${market.mid}`);
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex-1">
          <CardTitle className="text-lg line-clamp-2">{market.name}</CardTitle>
          <CardDescription className="line-clamp-2 mt-2">
            {market.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
            <span className="text-red-600 font-semibold">{noPercentage}%</span>
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
      </CardContent>
    </Card>
  );
};

export default MarketCard;
