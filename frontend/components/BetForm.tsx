'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewBet, Market } from '@/types';

interface BetFormProps {
  marketId: number;
}

export default function BetForm({ marketId }: BetFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<NewBet>({
    amt: 0,
    yes: true
  });
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current market data to get odds
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await fetch(`/api/markets`);
        if (response.ok) {
          const markets = await response.json();
          const market = markets.find((m: any) => (m.mId || m.mid) === marketId);
          if (market) {
            setCurrentMarket(market);
          }
        }
      } catch (error) {
        console.error('Error fetching market:', error);
      }
    };
    
    fetchMarket();
  }, [marketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Basic validation
    if (formData.amt <= 0) {
      setError('Amount must be greater than 0');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/markets/${marketId}/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to place bet');
      }

      // Reset form and show success
      setFormData({ amt: 0, yes: true });
      setSuccess(true);
      
      // Refresh the page to show the new bet
      router.refresh();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof NewBet, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const potentialWin = currentMarket ? formData.amt * currentMarket.podd : 0;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Bet Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bet Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleInputChange('yes', true)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              formData.yes
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isSubmitting}
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => handleInputChange('yes', false)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              !formData.yes
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isSubmitting}
          >
            NO
          </button>
        </div>
      </div>

      {/* Current Market Odds Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Market Odds
        </label>
        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
          {currentMarket ? (
            <span className="font-medium">{currentMarket.podd}x ({Math.round(currentMarket.podd * 100)}% probability)</span>
          ) : (
            <span className="text-gray-500">Loading...</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">You will bet at these current market odds</p>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amt" className="block text-sm font-medium text-gray-700 mb-1">
          Bet Amount ($)
        </label>
        <input
          type="number"
          id="amt"
          value={formData.amt}
          onChange={(e) => handleInputChange('amt', parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        />
      </div>

      {/* Potential Win Display */}
      {formData.amt > 0 && currentMarket && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="text-sm text-green-800">
            <strong>Potential Win: ${potentialWin.toFixed(2)}</strong>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Profit: ${(potentialWin - formData.amt).toFixed(2)}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="text-sm text-green-800">Bet placed successfully!</div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {isSubmitting ? 'Placing Bet...' : 'Place Bet'}
      </button>
    </form>
  );
} 