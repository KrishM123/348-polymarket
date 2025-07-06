import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the markets array from the backend response
    return NextResponse.json(data.markets || []);
  } catch (error) {
    console.error('Error fetching markets from backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets from backend' },
      { status: 500 }
    );
  }
} 