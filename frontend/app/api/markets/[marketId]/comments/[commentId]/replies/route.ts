import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ marketId: string; commentId: string }> }
) {
    try {
        const { marketId, commentId } = await params;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const body = await request.json();
        
        const response = await fetch(
            `${apiUrl}/markets/${marketId}/comments/${commentId}/replies`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Forward the authorization header if present
                    ...(request.headers.get('Authorization')
                        ? { 'Authorization': request.headers.get('Authorization')! }
                        : {})
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to create reply');
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (error) {
        console.error('Error in replies API route:', error);
        return NextResponse.json(
            { error: 'Failed to create reply' },
            { status: 500 }
        );
    }
} 