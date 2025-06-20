import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Market, Bet } from '@/types';
import BetForm from '@/components/BetForm';

interface BackendMarket {
  mid?: number;
  mId?: number;
  name: string;
  description?: string;
  podd: number;
  volume: number;
  end_date?: string;
}

interface BackendBet {
  bId: number;
  uId: number;
  mId: number;
  podd: number;
  amt: number;
  yes: boolean;
  uname?: string;
  createdAt?: string;
}

async function getMarket(marketId: string): Promise<Market | null> {
  try {
    // For server-side rendering, always use the local API route
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    
    const res = await fetch(`${apiUrl}/api/markets`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch markets');
    }
    
    const markets: BackendMarket[] = await res.json();
    const market = markets.find(market => (market.mId || market.mid) === parseInt(marketId));
    
    if (!market) {
      return null;
    }
    
    // Transform backend response to frontend format if needed
    return {
      mId: market.mId || market.mid || 0,
      name: market.name,
      description: market.description,
      podd: market.podd,
      volume: market.volume,
      end_date: market.end_date
    };
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
}

async function getBets(marketId: string): Promise<Bet[]> {
  try {
    // For server-side rendering, always use the local API route
    const isServer = typeof window === 'undefined';
    const apiUrl = isServer ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    
    const res = await fetch(`${apiUrl}/api/markets/${marketId}/bets`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch bets');
    }
    
    const bets: BackendBet[] = await res.json();
    
    // Transform backend response to frontend format if needed
    return bets.map((bet: BackendBet) => ({
      bId: bet.bId,
      uId: bet.uId,
      mId: bet.mId,
      podd: bet.podd,
      amt: bet.amt,
      yes: bet.yes,
      uname: bet.uname,
      createdAt: bet.createdAt
    }));
  } catch (error) {
    console.error('Error fetching bets:', error);
    return [];
  }
}

export default async function MarketPage({ 
  params 
}: { 
  params: Promise<{ marketId: string }> 
}) {
  const { marketId } = await params;
  
  const [market, bets] = await Promise.all([
    getMarket(marketId),
    getBets(marketId)
  ]);

  if (!market) {
    notFound();
  }

  const totalBets = bets.length;
  const totalStake = bets.reduce((sum, bet) => sum + bet.amt, 0);
  const yesCount = bets.filter(bet => bet.yes).length;
  const noCount = bets.filter(bet => !bet.yes).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/markets" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Back to Markets
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{market.name}</h1>
            {market.description && (
              <p className="text-gray-600">{market.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
              {market.podd}x odds
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
              ${market.volume.toFixed(2)} volume
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalBets}</div>
          <div className="text-sm text-gray-600">Total Bets</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">${totalStake.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Amount</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{yesCount}</div>
          <div className="text-sm text-gray-600">YES Bets</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{noCount}</div>
          <div className="text-sm text-gray-600">NO Bets</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Bets List */}
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
                        <div className="font-medium text-green-600">${(bet.amt * bet.podd).toFixed(2)}</div>
                        <div className="text-gray-600">Potential Win</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bet Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Place a Bet</h2>
            <BetForm marketId={market.mId} />
          </div>
        </div>
      </div>
    </div>
  );
} 