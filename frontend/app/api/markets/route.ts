import { Market } from '@/types';
import { NextResponse } from 'next/server';

const mockMarkets: Market[] = [
  {
    mId: 1,
    name: "Lakers vs Warriors - Who will win?",
    description: "NBA Championship game between Lakers and Warriors",
    podd: 1.75,
    volume: 15420.50,
    end_date: "2024-02-15T20:00:00Z"
  },
  {
    mId: 2,
    name: "Super Bowl 2024 Winner",
    description: "Which team will win the Super Bowl 2024?",
    podd: 2.1,
    volume: 45780.25,
    end_date: "2024-02-11T23:30:00Z"
  },
  {
    mId: 3,
    name: "Manchester United vs Arsenal",
    description: "Premier League match outcome",
    podd: 1.95,
    volume: 8950.75,
    end_date: "2024-01-28T15:00:00Z"
  },
  {
    mId: 4,
    name: "Tennis Grand Slam - Djokovic Win",
    description: "Will Novak Djokovic win the next Grand Slam?",
    podd: 1.85,
    volume: 12340.00,
    end_date: "2024-03-20T18:00:00Z"
  },
  {
    mId: 5,
    name: "Formula 1 - Red Bull Constructor Championship",
    description: "Will Red Bull win the 2024 Constructor Championship?",
    podd: 1.65,
    volume: 23150.80,
    end_date: "2024-11-30T20:00:00Z"
  }
];

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json(mockMarkets);
} 