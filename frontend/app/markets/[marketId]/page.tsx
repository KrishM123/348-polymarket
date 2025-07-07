'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Market, Bet } from '@/types';
import BetForm from '@/components/BetForm';
import BetsList from '@/components/BetsList';
import OddsGraph from '@/components/OddsGraph';

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
    // For client-side, use the API route
    const res = await fetch(`/api/markets`, {
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



export default function MarketPage({ 
  params 
}: { 
  params: Promise<{ marketId: string }> 
}) {
  const [marketId, setMarketId] = useState<string>('');
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshBets, setRefreshBets] = useState<(() => void) | null>(null);
  const [refreshGraph, setRefreshGraph] = useState<(() => void) | null>(null);
  const [betsListReady, setBetsListReady] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { marketId: id } = await params;
      setMarketId(id);
      
      try {
        const [marketData] = await Promise.all([
          getMarket(id)
        ]);
        
        setMarket(marketData);
      } catch (error) {
        console.error('Error loading market data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [params]);

  const handleBetPlaced = () => {
    // Refresh both the bets list and the graph
    if (refreshBets && typeof refreshBets === 'function') {
      refreshBets();
    } else {
      console.log('refreshBets not available yet, skipping refresh');
    }
    
    if (refreshGraph && typeof refreshGraph === 'function') {
      refreshGraph();
    } else {
      console.log('refreshGraph not available yet, skipping refresh');
    }
  };

  const handleManualRefresh = () => {
    // Manual refresh of both components
    if (refreshBets && typeof refreshBets === 'function') {
      refreshBets();
    }
    
    if (refreshGraph && typeof refreshGraph === 'function') {
      refreshGraph();
    }
  };

  const handleBetsListRef = useCallback((refreshFn: () => void) => {
    setRefreshBets(() => refreshFn);
    setBetsListReady(true);
  }, []);

  const handleGraphRef = useCallback((refreshFn: () => void) => {
    setRefreshGraph(() => refreshFn);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading market...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    notFound();
  }

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
            <button
              onClick={handleManualRefresh}
              className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Odds Graph */}
      <div className="mb-8">
        <OddsGraph 
          marketId={parseInt(marketId)} 
          onRef={handleGraphRef}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Bets List */}
        <BetsList 
          marketId={parseInt(marketId)} 
          onRef={handleBetsListRef}
        />

        {/* Bet Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Place a Bet</h2>
            <BetForm 
              marketId={market.mId} 
              onBetPlaced={handleBetPlaced}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 