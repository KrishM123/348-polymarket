import Link from 'next/link';
import { Market } from '@/types';

async function getMarkets(): Promise<Market[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/markets`, {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch markets');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

export default async function MarketsPage() {
  const markets = await getMarkets();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Sports Markets</h1>
        <p className="text-gray-600">Browse and place bets on available markets</p>
      </div>

      {markets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No markets available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <Link
              key={market.mId}
              href={`/markets/${market.mId}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {market.name}
                </h2>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {market.podd}x odds
                </span>
              </div>
              
              {market.description && (
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {market.description}
                </p>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                <span>Market #{market.mId}</span>
                <span>Volume: ${market.volume.toFixed(2)}</span>
              </div>
              
              {market.end_date && (
                <div className="text-xs text-gray-500">
                  Ends: {new Date(market.end_date).toLocaleDateString()}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 