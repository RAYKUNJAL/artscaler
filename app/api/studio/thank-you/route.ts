import { NextRequest, NextResponse } from 'next/server';
import { GeminiAIService } from '@/services/ai/gemini-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { buyerName, artworkTitle, artistName, personalNote } = body;

        if (!buyerName || !artworkTitle || !artistName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const message = await GeminiAIService.generateThankYouMessage(
            buyerName,
            artworkTitle,
            artistName,
            personalNote
        );

        return NextResponse.json({
            success: true,
            message
        });

    } catch (error: any) {
        console.error('[Thank You API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate thank you message' },
            { status: 500 }
        );
    }
}
