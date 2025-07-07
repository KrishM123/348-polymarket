'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bet } from '@/types';

interface BetsListProps {
  marketId: number;
  onRef?: (refreshFn: () => void) => void;
}

export default function BetsList({ marketId, onRef }: BetsListProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/markets/${marketId}/bets`);
      if (response.ok) {
        const data = await response.json();
        setBets(data.bets || data);
      } else {
        setError('Failed to fetch bets');
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
      setError('Failed to fetch bets');
    } finally {
      setIsLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  useEffect(() => {
    if (onRef) {
      onRef(fetchBets);
    }
  }, [onRef, fetchBets]);

  // Calculate stats
  const totalBets = bets.length;
  const totalStake = bets.reduce((sum, bet) => sum + bet.amt, 0);
  const yesCount = bets.filter(bet => bet.yes).length;
  const noCount = bets.filter(bet => !bet.yes).length;

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Bets</h2>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Loading bets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Bets</h2>
        <div className="bg-red-50 rounded-lg border border-red-200 p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Bets</h2>
      
      {bets.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No bets placed yet. Be the first to place a bet!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map((bet) => (
            <div key={bet.bId} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      bet.yes ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bet.yes ? 'YES' : 'NO'}
                    </span>
                    <span className="font-medium text-gray-900">#{bet.bId}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {bet.uname ? `${bet.uname} (ID: ${bet.uId})` : `User #${bet.uId}`}
                  </div>
                  {bet.createdAt && (
                    <div className="text-xs text-gray-500">
                      {new Date(bet.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{bet.podd}x</div>
                    <div className="text-gray-600">Odds</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">${bet.amt.toFixed(2)}</div>
                    <div className="text-gray-600">Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">${(
                      bet.yes
                        ? (1 / bet.podd) * bet.amt
                        : (1 / (1 - bet.podd)) * bet.amt
                    ).toFixed(2)}</div>
                    <div className="text-gray-600">Potential Win</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 