import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export interface ArtAttributes {
    subjectType: string;
    theme: string;
    style: string;
    dominantColors: string[];
    secondaryColors: string[];
    backgroundStyle: string;
    compositionType: string;
    brushworkStyle: string;
    visualComplexityScore: number;
    mixedMedia: boolean;
    signatureVisible: boolean;
}

export class ArtPatternAnalyzer {
    /**
     * Extracts deep artistic patterns using AI Analysis (Gemini 1.5 Flash for cost efficiency)
     */
    async analyze(title: string, description: string): Promise<ArtAttributes | null> {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            console.warn('⚠️ Gemini API Key missing. Returning default attributes.');
            return this.getDefaultAttributes();
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `You are an art market expert. Analyze the provided art listing title and description.
            Extract specific patterns into JSON format with these exact keys:
            - subject_type (e.g., Abstract, Landscape, Portrait)
            - theme (e.g., Nature, Urban, Minimalist)
            - style (e.g., Impressionistic, Modern, Realism)
            - dominant_colors (List of 2-3 primary colors)
            - secondary_colors (List of 2-3 accent colors)
            - background_style (e.g., Textured, Flat, Blurred)
            - composition_type (e.g., Rule of Thirds, Central, Dynamic)
            - brushwork_style (e.g., Broad, Impasto, Fine Detail)
            - visual_complexity_score (Integer 1-10)
            - mixed_media (boolean)
            - signature_visible (boolean)
            
            Title: ${title}
            Description: ${description}
            
            Respond ONLY with the valid JSON.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

            return {
                subjectType: raw.subject_type || 'Unknown',
                theme: raw.theme || 'Unknown',
                style: raw.style || 'Unknown',
                dominantColors: raw.dominant_colors || [],
                secondaryColors: raw.secondary_colors || [],
                backgroundStyle: raw.background_style || 'Unknown',
                compositionType: raw.composition_type || 'Unknown',
                brushworkStyle: raw.brushwork_style || 'Unknown',
                visualComplexityScore: raw.visual_complexity_score || 5,
                mixedMedia: !!raw.mixed_media,
                signatureVisible: !!raw.signature_visible
            };

        } catch (error) {
            console.error('❌ AI Art Pattern Analysis failed:', error);
            return this.getDefaultAttributes();
        }
    }

    private getDefaultAttributes(): ArtAttributes {
        return {
            subjectType: 'Unknown',
            theme: 'Unknown',
            style: 'Unknown',
            dominantColors: [],
            secondaryColors: [],
            backgroundStyle: 'Unknown',
            compositionType: 'Unknown',
            brushworkStyle: 'Unknown',
            visualComplexityScore: 5,
            mixedMedia: false,
            signatureVisible: false
        };
    }
}
