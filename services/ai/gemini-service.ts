/**
 * Google Gemini AI Service
 * 
 * Handles AI-powered brand generation using Google's Gemini API
 * - Logo concept generation
 * - Brand color palette extraction
 * - Artist bio writing
 * - Thank you card copy generation
 */

import { generateResponse } from '@/lib/ai/vertexClient';

export interface BrandIdentity {
    artistName: string;
    tagline: string;
    bio: string;
    colorPalette: {
        primary: string;
        secondary: string;
        accent: string;
    };
    logoPrompt: string; // For image generation
    fonts: {
        primary: string;
        secondary: string;
    };
}

export interface ThankYouCardCopy {
    greeting: string;
    message: string;
    closing: string;
    signature: string;
}

export class GeminiAIService {
    /**
     * Generate complete brand identity for an artist
     */
    static async generateBrandIdentity(params: {
        artistName: string;
        artStyle: string; // e.g., "abstract", "realism", "impressionism"
        medium: string; // e.g., "oil painting", "watercolor", "acrylic"
        targetAudience?: string;
    }): Promise<BrandIdentity> {
        const prompt = `You are a professional brand strategist for artists. Create a complete brand identity for an artist with the following details:

Artist Name: ${params.artistName}
Art Style: ${params.artStyle}
Primary Medium: ${params.medium}
Target Audience: ${params.targetAudience || 'Art collectors and home decorators'}

Generate a JSON response with:
1. A compelling tagline (max 10 words)
2. A professional artist bio (2-3 sentences)
3. A color palette (3 hex colors that match their art style)
4. A logo concept description (for image generation)
5. Font recommendations (2 fonts that match their brand)

Return ONLY valid JSON in this exact format:
{
  "tagline": "...",
  "bio": "...",
  "colorPalette": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode"
  },
  "logoPrompt": "A minimalist logo concept description...",
  "fonts": {
    "primary": "Font Name",
    "secondary": "Font Name"
  }
}`;

        try {
            const text = await generateResponse(prompt);

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse AI response');
            }

            const brandData = JSON.parse(jsonMatch[0]);

            return {
                artistName: params.artistName,
                tagline: brandData.tagline,
                bio: brandData.bio,
                colorPalette: brandData.colorPalette,
                logoPrompt: brandData.logoPrompt,
                fonts: brandData.fonts
            };
        } catch (error) {
            console.error('[Gemini AI] Brand generation error:', error);

            // Fallback to default brand
            return {
                artistName: params.artistName,
                tagline: `Original ${params.artStyle} art by ${params.artistName}`,
                bio: `${params.artistName} is a talented artist specializing in ${params.artStyle} ${params.medium} works. Each piece is created with passion and attention to detail.`,
                colorPalette: {
                    primary: '#2563eb',
                    secondary: '#7c3aed',
                    accent: '#f59e0b'
                },
                logoPrompt: `A minimalist artist signature logo for ${params.artistName}`,
                fonts: {
                    primary: 'Playfair Display',
                    secondary: 'Inter'
                }
            };
        }
    }

    /**
     * Generate thank you card copy
     */
    static async generateThankYouCard(params: {
        buyerName: string;
        artworkTitle: string;
        artistName: string;
        tone?: 'formal' | 'casual' | 'warm';
    }): Promise<ThankYouCardCopy> {
        const prompt = `Write a heartfelt thank you card message for an art buyer.

Buyer Name: ${params.buyerName}
Artwork Title: "${params.artworkTitle}"
Artist Name: ${params.artistName}
Tone: ${params.tone || 'warm'}

Create a thank you message with:
1. A personalized greeting
2. A sincere thank you message (2-3 sentences)
3. A warm closing
4. Signature line

Return ONLY valid JSON:
{
  "greeting": "Dear [Name],",
  "message": "...",
  "closing": "...",
  "signature": "..."
}`;

        try {
            const text = await generateResponse(prompt);

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse AI response');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('[Gemini AI] Thank you card error:', error);

            return {
                greeting: `Dear ${params.buyerName},`,
                message: `Thank you so much for choosing "${params.artworkTitle}" for your collection. It brings me great joy knowing my art will be cherished in your home. I hope it brings you as much happiness as I had creating it.`,
                closing: 'With gratitude and appreciation,',
                signature: params.artistName
            };
        }
    }

    /**
     * Generate simple thank you message (for card generator)
     */
    static async generateThankYouMessage(
        buyerName: string,
        artworkTitle: string,
        artistName: string,
        personalNote?: string
    ): Promise<string> {
        const prompt = `Write a warm, heartfelt thank you message for an art buyer.

Buyer Name: ${buyerName}
Artwork Title: "${artworkTitle}"
Artist Name: ${artistName}
${personalNote ? `Personal Note: ${personalNote}` : ''}

Write a 3-4 sentence thank you message that:
1. Thanks the buyer personally
2. Expresses joy that they chose this specific artwork
3. Wishes them happiness with their purchase
${personalNote ? '4. Incorporates the personal note naturally' : ''}

Write in a warm, genuine tone. Return ONLY the message text, no JSON, no formatting.`;

        try {
            return await generateResponse(prompt);
        } catch (error) {
            console.error('[Gemini AI] Thank you message error:', error);

            return `Dear ${buyerName},\n\nThank you so much for choosing "${artworkTitle}" for your collection! It brings me immense joy knowing my art will be cherished in your home. I hope this piece brings you as much happiness as I had creating it.${personalNote ? `\n\n${personalNote}` : ''}\n\nWith heartfelt gratitude,\n${artistName}`;
        }
    }

    /**
     * Extract color palette from artwork image
     */
    static async extractColorPalette(imageUrl: string): Promise<string[]> {
        const prompt = `Analyze this artwork and extract the 5 most dominant colors. Return ONLY a JSON array of hex color codes.

Example: ["#ff5733", "#33ff57", "#3357ff", "#f0f0f0", "#333333"]`;

        try {
            // Note: Vertex AI REST also works here
            const text = await generateResponse(prompt);

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Failed to parse color palette');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('[Gemini AI] Color extraction error:', error);

            // Fallback palette
            return ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#ef4444'];
        }
    }

    /**
     * Generate artwork description for eBay listing
     */
    static async generateArtworkDescription(params: {
        title: string;
        medium: string;
        size: string;
        style: string;
        colors?: string[];
    }): Promise<string> {
        const colorText = params.colors?.length
            ? `featuring ${params.colors.join(', ')} tones`
            : '';

        const prompt = `Write a compelling eBay listing description for an original artwork.

Title: ${params.title}
Medium: ${params.medium}
Size: ${params.size}
Style: ${params.style}
${colorText}

Write a 3-4 sentence description that:
1. Captures the essence of the artwork
2. Highlights the quality and craftsmanship
3. Appeals to art collectors
4. Mentions it's an original, one-of-a-kind piece

Keep it professional but engaging. Do NOT use markdown or special formatting.`;

        try {
            return await generateResponse(prompt);
        } catch (error) {
            console.error('[Gemini AI] Description generation error:', error);

            return `This stunning ${params.style} ${params.medium} artwork titled "${params.title}" measures ${params.size}. Each brushstroke showcases exceptional craftsmanship and attention to detail. This is an original, one-of-a-kind piece perfect for collectors and art enthusiasts seeking unique, museum-quality work.`;
        }
    }

    /**
     * Generate care instructions for artwork
     */
    static async generateCareInstructions(medium: string): Promise<string[]> {
        const prompt = `Generate 5 care instructions for preserving ${medium} artwork. Return as a JSON array of strings.

Example: ["Keep away from direct sunlight", "Dust gently with a soft cloth", ...]`;

        try {
            const text = await generateResponse(prompt);

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Failed to parse care instructions');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('[Gemini AI] Care instructions error:', error);

            return [
                'Keep away from direct sunlight to prevent fading',
                'Display in a climate-controlled environment',
                'Dust gently with a soft, dry cloth',
                'Avoid touching the painted surface',
                'Frame with UV-protective glass for long-term preservation'
            ];
        }
    }
}
