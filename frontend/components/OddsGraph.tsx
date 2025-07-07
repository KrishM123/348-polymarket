'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Bet } from '@/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface OddsGraphProps {
  marketId: number;
  onRef?: (refreshFn: () => void) => void;
}

interface OddsDataPoint {
  timestamp: string;
  odds: number;
  betId: number;
  amount: number;
  prediction: string;
  username?: string;
}

const OddsGraph = forwardRef<any, OddsGraphProps>(({ marketId, onRef }, ref) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/markets/${marketId}/bets`);
      if (response.ok) {
        const data = await response.json();
        setBets(data.bets || data);
      } else {
        setError('Failed to fetch betting data');
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
      setError('Failed to fetch betting data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [marketId]);

  useEffect(() => {
    if (onRef) {
      onRef(fetchBets);
    }
  }, [onRef]);

  // Process bets data for the chart
  const processDataForChart = (bets: Bet[]): OddsDataPoint[] => {
    if (!bets || bets.length === 0) return [];

    // Sort bets by creation time
    const sortedBets = [...bets]
      .filter(bet => bet.createdAt) // Only bets with timestamps
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

    // Convert to chart data points
    return sortedBets.map(bet => ({
      timestamp: bet.createdAt!,
      odds: bet.podd,
      betId: bet.bId,
      amount: bet.amt,
      prediction: bet.yes ? 'YES' : 'NO',
      username: bet.uname
    }));
  };

  const chartData = processDataForChart(bets);

  const data = {
    datasets: [
      {
        label: 'Odds Over Time',
        data: chartData.map(point => ({
          x: point.timestamp,
          y: point.odds
        })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointBackgroundColor: chartData.map(point => 
          point.prediction === 'YES' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        pointBorderColor: chartData.map(point => 
          point.prediction === 'YES' ? 'rgb(21, 128, 61)' : 'rgb(185, 28, 28)'
        ),
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Odds Progression Over Time',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const dataPoint = chartData[context[0].dataIndex];
            return `${dataPoint.username || 'Unknown'} • Bet #${dataPoint.betId}`;
          },
          label: (context: any) => {
            const dataPoint = chartData[context.dataIndex];
            return [
              `Odds: ${dataPoint.odds.toFixed(2)}x`,
              `Amount: $${dataPoint.amount.toFixed(2)}`,
              `Prediction: ${dataPoint.prediction}`,
              `Time: ${new Date(dataPoint.timestamp).toLocaleString()}`
            ];
          },
        },
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(107, 114, 128, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          tooltipFormat: 'MMM dd, yyyy HH:mm',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
          },
        },
        title: {
          display: true,
          text: 'Time',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
      },
      y: {
        beginAtZero: false,
        min: 0,
        max: 1,
        title: {
          display: true,
          text: 'Odds (Probability)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return `${(value * 100).toFixed(0)}%`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Odds Over Time</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Odds Over Time</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Odds Over Time</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500">No betting data available to display</p>
            <p className="text-sm text-gray-400 mt-1">Place the first bet to start the odds progression!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Odds Over Time</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>YES bets</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>NO bets</span>
          </div>
        </div>
      </div>
      
      <div className="h-64 sm:h-80">
        <Line data={data} options={options} />
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>• Each point represents a bet placed at that time and odds</p>
        <p>• Green dots = YES bets, Red dots = NO bets</p>
        <p>• Hover over points for detailed information</p>
      </div>
    </div>
  );
});

OddsGraph.displayName = 'OddsGraph';

export default OddsGraph; 