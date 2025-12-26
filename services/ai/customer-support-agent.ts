/**
 * AI Customer Support Agent
 * 
 * Powered by Google Gemini to handle buyer inquiries
 * - Shipping questions
 * - Care instructions
 * - Return policy
 * - Custom artwork requests
 */

import { generateResponse } from '@/lib/ai/vertexClient';

export interface SupportMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface SupportContext {
    artistName: string;
    artworkTitle?: string;
    orderNumber?: string;
    buyerName?: string;
}

export class CustomerSupportAgent {
    /**
     * Generate AI response to buyer question
     */
    static async generateSupportResponse(
        question: string,
        context: SupportContext,
        conversationHistory: SupportMessage[] = []
    ): Promise<string> {

        // Build conversation context
        const historyText = conversationHistory
            .map(msg => `${msg.role === 'user' ? 'Buyer' : 'Artist'}: ${msg.content}`)
            .join('\n');

        const systemPrompt = `You are a professional customer support agent for ${context.artistName}, an artist selling original artwork on eBay.

CONTEXT:
- Artist: ${context.artistName}
${context.artworkTitle ? `- Artwork: ${context.artworkTitle}` : ''}
${context.orderNumber ? `- Order: ${context.orderNumber}` : ''}
${context.buyerName ? `- Buyer: ${context.buyerName}` : ''}

YOUR ROLE:
- Answer buyer questions professionally and warmly
- Provide accurate information about shipping, care, and returns
- Maintain the artist's brand voice
- Be helpful, friendly, and concise

GUIDELINES:
1. Keep responses under 3 sentences unless detailed explanation is needed
2. Use a warm, professional tone
3. If you don't know something, say "Let me check with the artist and get back to you"
4. For complex issues, suggest contacting the artist directly
5. Always end with a helpful closing

COMMON TOPICS:
- Shipping: Standard 3-5 business days, tracked shipping
- Care: Keep away from direct sunlight, dust gently
- Returns: 30-day return policy, buyer pays return shipping
- Custom work: Artist accepts commissions, contact for details

CONVERSATION HISTORY:
${historyText}

BUYER'S QUESTION:
${question}

Respond as the artist's support agent:`;

        try {
            // Format history for Vertex AI
            const vertexHistory = conversationHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            return await generateResponse(systemPrompt, vertexHistory);
        } catch (error) {
            console.error('[AI Support] Error:', error);

            // Fallback responses
            return this.getFallbackResponse(question, context);
        }
    }

    /**
     * Fallback responses for common questions
     */
    private static getFallbackResponse(question: string, context: SupportContext): string {
        const lowerQuestion = question.toLowerCase();

        if (lowerQuestion.includes('ship') || lowerQuestion.includes('deliver')) {
            return `Thank you for your interest! Your artwork will ship within 1-2 business days via USPS Priority Mail with tracking. You'll receive the tracking number via email once it ships. Please allow 3-5 business days for delivery.`;
        }

        if (lowerQuestion.includes('return') || lowerQuestion.includes('refund')) {
            return `We offer a 30-day return policy for all original artwork. If you're not completely satisfied, you can return it for a full refund. The buyer is responsible for return shipping costs. The artwork must be returned in its original condition.`;
        }

        if (lowerQuestion.includes('care') || lowerQuestion.includes('clean') || lowerQuestion.includes('maintain')) {
            return `To preserve your artwork: (1) Keep it away from direct sunlight to prevent fading, (2) Display in a climate-controlled environment, (3) Dust gently with a soft, dry cloth, (4) Avoid touching the painted surface. For long-term preservation, consider framing with UV-protective glass.`;
        }

        if (lowerQuestion.includes('custom') || lowerQuestion.includes('commission')) {
            return `Yes, ${context.artistName} accepts custom commissions! Please send a message with details about your vision, preferred size, and timeline. We'll provide a quote and estimated completion date. Custom pieces typically take 2-4 weeks depending on complexity.`;
        }

        if (lowerQuestion.includes('size') || lowerQuestion.includes('dimension')) {
            return `The artwork dimensions are listed in the item description. If you need exact measurements or have questions about how it will fit in your space, please let me know and I'll provide detailed dimensions including frame (if applicable).`;
        }

        if (lowerQuestion.includes('frame') || lowerQuestion.includes('framing')) {
            return `This artwork is sold unframed to allow you to choose framing that matches your decor. We recommend professional framing with UV-protective glass for optimal preservation. If you'd like framing recommendations, I'm happy to help!`;
        }

        if (lowerQuestion.includes('certificate') || lowerQuestion.includes('coa') || lowerQuestion.includes('authenticity')) {
            return `Yes! Every original artwork includes a Certificate of Authenticity (COA) with a unique registration number and QR code for verification. The COA will be included with your shipment and provides provenance documentation for your collection.`;
        }

        // Generic helpful response
        return `Thank you for your question! I want to make sure I give you the most accurate information. Could you provide a bit more detail about what you'd like to know? Alternatively, feel free to send a direct message to ${context.artistName} for personalized assistance.`;
    }

    /**
     * Detect if question requires artist intervention
     */
    static requiresArtistAttention(question: string): boolean {
        const urgentKeywords = [
            'damaged',
            'broken',
            'wrong item',
            'not as described',
            'complaint',
            'dispute',
            'lawyer',
            'legal',
            'sue',
            'fraud'
        ];

        const lowerQuestion = question.toLowerCase();
        return urgentKeywords.some(keyword => lowerQuestion.includes(keyword));
    }

    /**
     * Categorize support question
     */
    static categorizeQuestion(question: string): string {
        const lowerQuestion = question.toLowerCase();

        if (lowerQuestion.includes('ship') || lowerQuestion.includes('deliver') || lowerQuestion.includes('track')) {
            return 'shipping';
        }
        if (lowerQuestion.includes('return') || lowerQuestion.includes('refund') || lowerQuestion.includes('exchange')) {
            return 'returns';
        }
        if (lowerQuestion.includes('care') || lowerQuestion.includes('clean') || lowerQuestion.includes('maintain')) {
            return 'care_instructions';
        }
        if (lowerQuestion.includes('custom') || lowerQuestion.includes('commission') || lowerQuestion.includes('personalize')) {
            return 'custom_work';
        }
        if (lowerQuestion.includes('size') || lowerQuestion.includes('dimension') || lowerQuestion.includes('measurement')) {
            return 'product_details';
        }
        if (lowerQuestion.includes('payment') || lowerQuestion.includes('price') || lowerQuestion.includes('cost')) {
            return 'pricing';
        }

        return 'general';
    }

    /**
     * Generate automated thank you message after purchase
     */
    static async generatePurchaseThankYou(
        buyerName: string,
        artworkTitle: string,
        artistName: string
    ): Promise<string> {
        return `Dear ${buyerName},

Thank you so much for purchasing "${artworkTitle}"! I'm thrilled that my artwork will be part of your collection.

Your order will be carefully packaged and shipped within 1-2 business days. You'll receive a tracking number via email once it ships.

Included with your artwork:
✓ Certificate of Authenticity with unique registration number
✓ Care instructions card
✓ Artist's personal thank you note

If you have any questions, please don't hesitate to reach out. I'm here to help!

With gratitude,
${artistName}`;
    }

    /**
     * Generate shipping confirmation message
     */
    static generateShippingConfirmation(
        buyerName: string,
        trackingNumber: string,
        carrier: string = 'USPS'
    ): string {
        return `Hi ${buyerName},

Great news! Your artwork has been shipped! 📦

Tracking Number: ${trackingNumber}
Carrier: ${carrier}
Expected Delivery: 3-5 business days

You can track your package at: https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}

Your artwork has been carefully packaged to ensure it arrives in perfect condition. If you have any concerns upon delivery, please contact me immediately.

Thank you again for your support!`;
    }

    /**
     * Generate follow-up message after delivery
     */
    static generateDeliveryFollowUp(buyerName: string, artworkTitle: string): string {
        return `Hi ${buyerName},

I hope "${artworkTitle}" arrived safely and you're enjoying it in your space!

I'd love to hear your thoughts and see where you've displayed it. If you're happy with your purchase, I'd be incredibly grateful if you could leave a review.

If there's anything I can do to improve your experience, please let me know.

Thank you for supporting independent artists!`;
    }
}
