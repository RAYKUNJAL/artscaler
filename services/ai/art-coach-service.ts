import { generateResponse } from '@/lib/ai/vertexClient';
import { SupabaseClient } from '@supabase/supabase-js';
import { EBAY_ART_KNOWLEDGE_BASE } from './knowledge-base';

// genAI is no longer needed - we use generateResponse from vertexClient

export class ArtCoachService {
    /**
     * Get a response from the Art Coach with real-world context and session memory
     */
    static async getCoachAdvice(supabase: SupabaseClient, params: {
        userId: string;
        sessionId?: string;
        message: string;
    }) {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Configuration Error: Google Gemini API Key is missing.');
        }

        // 1. Fetch/Create Session
        let sessionId = params.sessionId;
        if (!sessionId) {
            const { data: session, error: sessionError } = await supabase
                .from('coach_sessions')
                .insert({
                    user_id: params.userId,
                    title: params.message.substring(0, 50) + (params.message.length > 50 ? '...' : '')
                })
                .select()
                .single();

            if (sessionError || !session) {
                console.error('Failed to create coaching session:', sessionError);
                throw new Error('Failed to initialize conversation session.');
            }
            sessionId = session.id;
        }

        // 2. Fetch History from Database
        const { data: history, error: historyError } = await supabase
            .from('coach_messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (historyError) {
            console.error('Error fetching chat history:', historyError);
            // We can proceed without history if it fails, but logging is good.
        }

        // 3. Fetch Real Context Data
        // ... (Context fetching remains the same, assuming valid supabase client)
        const { data: plan } = await supabase
            .from('revenue_plans')
            .select('*')
            .eq('user_id', params.userId)
            .eq('is_active', true)
            .maybeSingle();

        const { data: topStyles } = await supabase
            .from('styles')
            .select('style_term, avg_wvs, demand_score')
            .order('demand_score', { ascending: false })
            .limit(5);

        const { data: queue } = await supabase
            .from('paint_queue')
            .select('style, size, status')
            .eq('user_id', params.userId)
            .limit(5);

        // 4. Build System Prompt (Using Knowledge Base)
        const systemPrompt = `
You are the "Art Pulse Coach", an elite eBay Art Strategist and Business Mentor. 
You help artists maximize their sales on eBay by interpreting real market data and providing actionable business advice.

REAL-TIME CONTEXT:
- Target Monthly Revenue: $${plan?.target_monthly || 'Not set'}
- Top Trending Styles: ${topStyles?.map(s => `${s.style_term} (WVS: ${s.avg_wvs})`).join(', ')}
- Current Output: ${queue?.map(q => `${q.style} in ${q.size} (${q.status})`).join(', ')}

${EBAY_ART_KNOWLEDGE_BASE}

PERSONALITY:
- Encouraging but data-driven. Reference the context data above.
- Concise and professional. Never mention you are an AI.
`;

        try {
            // 5. Run AI
            // Format history for Vertex AI REST format
            const vertexHistory = (history || []).map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }],
            }));

            // Include system prompt as first user message or as context?
            // Vertex AI REST usually takes it as separate systemInstruction, 
            // but for simple chat we can prepend it to the history or prompt.
            const fullPrompt = `SYSTEM: ${systemPrompt}\n\nUSER: ${params.message}`;
            const responseText = await generateResponse(fullPrompt, vertexHistory);

            // 6. Persist Messages
            const { error: msgError } = await supabase.from('coach_messages').insert([
                { session_id: sessionId, user_id: params.userId, role: 'user', content: params.message },
                { session_id: sessionId, user_id: params.userId, role: 'model', content: responseText }
            ]);

            if (msgError) console.error('Error saving messages:', msgError);

            // Update session last message and updated_at
            await supabase.from('coach_sessions')
                .update({ last_message: responseText.substring(0, 100), updated_at: new Date() })
                .eq('id', sessionId);

            return { advice: responseText, sessionId };

        } catch (aiError: any) {
            console.error('Art Coach AI Error:', aiError);
            throw new Error(`AI processing failed: ${aiError.message}`);
        }
    }

    /**
     * Fetch all coaching sessions for a user
     */
    static async getSessions(supabase: SupabaseClient, userId: string) {
        const { data } = await supabase
            .from('coach_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        return data || [];
    }

    /**
     * Fetch messages for a specific session
     */
    static async getSessionMessages(supabase: SupabaseClient, sessionId: string) {
        const { data } = await supabase
            .from('coach_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        return data || [];
    }
}
