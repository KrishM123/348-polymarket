'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewBet } from '@/types';

interface BetFormProps {
  marketId: number;
}

export default function BetForm({ marketId }: BetFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<NewBet>({
    podd: 1.5,
    amt: 0,
    yes: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Basic validation
    if (formData.podd <= 0) {
      setError('Odds must be greater than 0');
      setIsSubmitting(false);
      return;
    }

    if (formData.amt <= 0) {
      setError('Amount must be greater than 0');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/markets/${marketId}/bets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to place bet');
      }

      // Reset form and show success
      setFormData({ podd: 1.5, amt: 0, yes: true });
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

  const potentialWin = formData.amt * formData.podd;

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

      {/* Odds */}
      <div>
        <label htmlFor="podd" className="block text-sm font-medium text-gray-700 mb-1">
          Odds Multiplier
        </label>
        <input
          type="number"
          id="podd"
          value={formData.podd}
          onChange={(e) => handleInputChange('podd', parseFloat(e.target.value) || 0)}
          step="0.1"
          min="1.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        />
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
      {formData.amt > 0 && formData.podd > 0 && (
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