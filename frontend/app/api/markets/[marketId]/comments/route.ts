import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { marketId: string } }
) {
    try {
        const marketId = params.marketId;
        const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${apiUrl}/markets/${marketId}/comments`, {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (error) {
        console.error('Error in comments API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { marketId: string } }
) {
    try {
        const marketId = params.marketId;
        const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
        const body = await request.json();
        
        const response = await fetch(`${apiUrl}/markets/${marketId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward the authorization header if present
                ...(request.headers.get('Authorization') 
                    ? { 'Authorization': request.headers.get('Authorization')! }
                    : {})
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create comment');
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (error) {
        console.error('Error in comments API route:', error);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
} 