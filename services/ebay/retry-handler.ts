/**
 * Retry Handler with Exponential Backoff
 */

export interface RetryOptions {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    shouldRetry: (error: any) => boolean;
}

const defaultOptions: RetryOptions = {
    maxRetries: 5,
    initialDelay: 1000, // 1s
    maxDelay: 30000,   // 30s
    shouldRetry: (error: any) => {
        // Retry on 429 (Rate Limit) or 5xx (Server Error)
        const status = error.status || (error.response && error.response.status);
        return status === 429 || (status >= 500 && status <= 599);
    }
};

export async function withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const config = { ...defaultOptions, ...options };
    let lastError: any;
    let delay = config.initialDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            if (attempt === config.maxRetries || !config.shouldRetry(error)) {
                throw error;
            }

            console.warn(`[Retry] Attempt ${attempt + 1} failed. Retrying in ${delay}ms... (Error: ${error.message})`);

            await new Promise(resolve => setTimeout(resolve, delay));

            // Exponential backoff
            delay = Math.min(delay * 2, config.maxDelay);
        }
    }

    throw lastError;
}
