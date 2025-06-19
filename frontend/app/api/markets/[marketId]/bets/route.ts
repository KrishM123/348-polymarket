import { Bet, NewBet } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// Mock bets data - in a real app this would be in a database
const mockBets: { [marketId: string]: Bet[] } = {
  '1': [
    {
      bId: 1,
      uId: 101,
      mId: 1,
      podd: 1.75,
      amt: 100.00,
      yes: true
    },
    {
      bId: 2,
      uId: 102,
      mId: 1,
      podd: 1.80,
      amt: 250.00,
      yes: false
    },
    {
      bId: 3,
      uId: 103,
      mId: 1,
      podd: 1.70,
      amt: 50.00,
      yes: true
    }
  ],
  '2': [
    {
      bId: 4,
      uId: 104,
      mId: 2,
      podd: 2.1,
      amt: 500.00,
      yes: true
    },
    {
      bId: 5,
      uId: 105,
      mId: 2,
      podd: 2.0,
      amt: 150.00,
      yes: false
    }
  ],
  '3': [
    {
      bId: 6,
      uId: 106,
      mId: 3,
      podd: 1.95,
      amt: 75.00,
      yes: true
    }
  ]
};

let nextBetId = 7;

export async function GET(
  request: NextRequest,
  { params }: { params: { marketId: string } }
) {
  const marketId = params.marketId;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const bets = mockBets[marketId] || [];
  return NextResponse.json(bets);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { marketId: string } }
) {
  const marketId = params.marketId;
  
  try {
    const newBetData: NewBet = await request.json();
    
    // Create new bet with generated ID and random user ID
    const newBet: Bet = {
      bId: nextBetId++,
      uId: Math.floor(Math.random() * 1000) + 100, // Random user ID
      mId: parseInt(marketId),
      podd: newBetData.podd,
      amt: newBetData.amt,
      yes: newBetData.yes
    };
    
    // Add to mock data
    if (!mockBets[marketId]) {
      mockBets[marketId] = [];
    }
    mockBets[marketId].push(newBet);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return NextResponse.json(newBet, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid bet data' },
      { status: 400 }
    );
  }
} 