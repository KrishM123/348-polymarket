import Link from 'next/link';
import { Market } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

// Define a more specific type for our market data
interface BettingMarket {
  id: string | number;
  title: string;
  description: string;
  status: string;
  endDate: string;
  totalVolume: number;
  odds: number;
}

interface BackendMarket {
  mid?: number;
  mId?: number;
  name: string;
  description?: string;
  podd: number;
  volume: number;
  end_date?: string;
}

async function getMarkets(): Promise<Market[]> {
  try {
    // For server-side rendering, always use the local API route
    // For client-side, use the full URL if needed
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    
    const res = await fetch(`${apiUrl}/api/markets`, {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch markets');
    }
    
    const markets: BackendMarket[] = await res.json();
    
    // Transform backend response to frontend format if needed
    return markets.map((market: BackendMarket) => ({
      mId: market.mid || market.mId || 0,
      name: market.name,
      description: market.description,
      podd: market.podd,
      volume: market.volume,
      end_date: market.end_date
    }));
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

function MarketsContent({ markets }: { markets: Market[] }) {
  // Transform the Market[] to our BettingMarket[]
  const bettingMarkets: BettingMarket[] = markets.map(market => ({
    id: market.mId,
    title: market.name,
    description: market.description || 'No description available',
    status: 'Active', // Default status since it's not in the Market type
    endDate: market.end_date || new Date().toISOString(),
    totalVolume: market.volume || 0,
    odds: market.podd || 1.0
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Betting Markets
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Place your bets on upcoming sports events
          </p>
          <p className="text-gray-400 text-sm mt-2">Make sure the backend server is running on port 5000.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bettingMarkets.map((market) => (
            <Link
              key={market.id}
              href={`/markets/${market.id}`}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{market.title}</h3>
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {market.odds}x odds
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 mb-4 flex-grow">{market.description}</p>
                  <div className="mt-auto">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
                      <span>{market.totalVolume} ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function MarketsPage() {
  const markets = await getMarkets();
  
  return (
    <ProtectedRoute>
      <MarketsContent markets={markets} />
    </ProtectedRoute>
  );
}