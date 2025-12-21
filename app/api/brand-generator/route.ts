/**
 * Brand Generator API Route
 * 
 * Server-side endpoint for AI brand identity generation
 * Keeps Gemini API key secure on the server
 */

import { NextRequest, NextResponse } from 'next/server';
import { GeminiAIService } from '@/services/ai/gemini-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { artistName, artStyle, medium, targetAudience } = body;

        // Validate input
        if (!artistName || !artStyle || !medium) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate brand identity using Gemini AI (server-side)
        const brandIdentity = await GeminiAIService.generateBrandIdentity({
            artistName,
            artStyle,
            medium,
            targetAudience
        });

        return NextResponse.json({
            success: true,
            brandIdentity
        });

    } catch (error: any) {
        console.error('[Brand Generator API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate brand identity' },
            { status: 500 }
        );
    }
}
