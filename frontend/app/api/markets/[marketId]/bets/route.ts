import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ marketId: string }> }
) {
  const { marketId } = await context.params;
  
  try {
    const response = await fetch(`${BACKEND_URL}/markets/${marketId}/bets`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 });
      }
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the bets array from the backend response
    return NextResponse.json(data.bets || []);
  } catch (error) {
    console.error('Error fetching bets from backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bets from backend' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ marketId: string }> }
) {
  const { marketId } = await context.params;
  
  try {
    const requestBody = await request.json();
    
    // Transform the frontend request to match backend expected format
    const backendRequest = {
      user_id: 1, // Default user ID - you might want to implement proper user authentication
      odds: requestBody.podd,
      amount: requestBody.amt,
      prediction: requestBody.yes
    };
    
    const response = await fetch(`${BACKEND_URL}/markets/${marketId}/bets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to create bet' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform the backend response to match frontend expected format
    const frontendBet = {
      bId: data.bet_id,
      uId: data.user_id,
      mId: data.market_id,
      podd: data.odds,
      amt: data.amount,
      yes: data.prediction
    };
    
    return NextResponse.json(frontendBet, { status: 201 });
  } catch (error) {
    console.error('Error creating bet on backend:', error);
    return NextResponse.json(
      { error: 'Failed to create bet' },
      { status: 500 }
    );
  }
} 