import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseClient } from '@supabase/supabase-js';
import { EBAY_ART_KNOWLEDGE_BASE } from './knowledge-base';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export class ArtCoachService {
    /**
     * Get a response from the Art Coach with real-world context and session memory
     */
    static async getCoachAdvice(supabase: SupabaseClient, params: {
        userId: string;
        sessionId?: string;
        message: string;
    }) {
        // 1. Fetch/Create Session
        let sessionId = params.sessionId;
        if (!sessionId) {
            const { data: session } = await supabase
                .from('coach_sessions')
                .insert({
                    user_id: params.userId,
                    title: params.message.substring(0, 50) + (params.message.length > 50 ? '...' : '')
                })
                .select()
                .single();
            sessionId = session?.id;
        }

        // 2. Fetch History from Database
        const { data: history } = await supabase
            .from('coach_messages')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        // 3. Fetch Real Context Data
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

        // 4. Build System Prompt
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

        // 5. Run AI
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const chat = model.startChat({
            history: (history || []).map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }],
            })),
        });

        const result = await chat.sendMessage([
            { text: systemPrompt },
            { text: params.message }
        ]);

        const responseText = result.response.text();

        // 6. Persist Messages
        await supabase.from('coach_messages').insert([
            { session_id: sessionId, user_id: params.userId, role: 'user', content: params.message },
            { session_id: sessionId, user_id: params.userId, role: 'model', content: responseText }
        ]);

        // Update session last message and updated_at
        await supabase.from('coach_sessions')
            .update({ last_message: responseText.substring(0, 100), updated_at: new Date() })
            .eq('id', sessionId);

        return { advice: responseText, sessionId };
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
