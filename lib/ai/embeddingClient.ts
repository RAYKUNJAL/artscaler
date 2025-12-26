import { pipeline } from "@xenova/transformers";

let embedPipeline: any | null = null;

/**
 * Generates embeddings locally using MiniLM-L6-v2.
 * This saves cost by avoiding API calls for vector search preparation.
 */
export async function embedText(text: string): Promise<number[]> {
    if (!embedPipeline) {
        // Load the model (approx 80MB)
        embedPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    const output = await embedPipeline(text);
    // output is [[...vector]]
    const flat = (output[0] as any).flat();
    return Array.from(flat) as number[];
}
