import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ marketId: string }> }
) {
    try {
        const { marketId } = await params;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${apiUrl}/markets/${marketId}/comments`, {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Comments API error:', errorText);
            return NextResponse.json(
                { error: 'Failed to fetch comments', details: errorText },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (error) {
        console.error('Error in comments API route:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ marketId: string }> }
) {
    try {
        const { marketId } = await params;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
            const errorText = await response.text();
            console.error('Comment creation error:', errorText);
            return NextResponse.json(
                { error: 'Failed to create comment', details: errorText },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (error) {
        console.error('Error in comments API route:', error);
        return NextResponse.json(
            { error: 'Failed to create comment', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 