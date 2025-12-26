// Native fetch is available in Node 18+ and Next.js environments

/**
 * Calls Google Vertex AI Gemini 1.5-Flash via the REST endpoint.
 * This is significantly cheaper for high-volume chat than the standard Generative AI SDK.
 */
export async function generateResponse(
    prompt: string,
    history: any[] = [],
    imageData?: { data: string; mimeType: string }
): Promise<string> {
    const projectId = process.env.VERTEX_PROJECT_ID;
    const location = process.env.VERTEX_LOCATION || "us-central1";
    const model = process.env.VERTEX_MODEL || "gemini-1.5-flash";
    const apiKey = process.env.VERTEX_API_KEY;

    if (!projectId || !apiKey) {
        throw new Error("Missing VERTEX_PROJECT_ID or VERTEX_API_KEY");
    }

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent?key=${apiKey}`;

    // Format parts for current content
    const currentParts: any[] = [{ text: prompt }];
    if (imageData) {
        currentParts.push({
            inline_data: {
                data: imageData.data,
                mime_type: imageData.mimeType,
            }
        });
    }

    // Format history and current prompt
    const contents = [
        ...history,
        { role: "user", parts: currentParts }
    ];

    const body = {
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.8,
            topK: 40,
        },
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error("Vertex AI returned an empty response");
    }

    return text.trim();
}
