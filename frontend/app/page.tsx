'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import LoginPopup from '@/components/LoginPopup';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const handleProtectedAction = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLogin(true);
    } else {
      router.push(path);
    }
  };
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">Polymarket</h1>
          <p className="text-xl text-gray-600 mb-12">
            Your gateway to sports betting markets. Place bets, track odds, and win big.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">🏟️</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Browse Markets</h3>
              <p className="text-gray-600 mb-4">
                Explore all available sports betting markets and find the perfect opportunity.
              </p>
              <Link
                href="/markets"
                onClick={(e) => handleProtectedAction(e, '/markets')}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                View Markets
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Live Betting</h3>
              <p className="text-gray-600 mb-4">
                Place bets in real-time and track your potential winnings instantly.
              </p>
              <Link
                href="/markets"
                onClick={(e) => handleProtectedAction(e, '/markets')}
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
              >
                Start Betting
              </Link>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Choose a Market</h4>
                <p className="text-gray-600 text-sm">Browse through our available sports markets and find the event you want to bet on.</p>
              </div>
              <div>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Place Your Bet</h4>
                <p className="text-gray-600 text-sm">Enter your selection, set your odds, and decide how much you want to stake.</p>
              </div>
              <div>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Win & Collect</h4>
                <p className="text-gray-600 text-sm">Watch the event unfold and collect your winnings if your prediction is correct.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <LoginPopup 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => {
          setShowLogin(false);
          router.push('/markets');
        }}
      />
    </div>
  );
}
