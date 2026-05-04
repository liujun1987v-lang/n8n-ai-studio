const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

interface RetryOptions {
  maxRetries?: number;
  initialBackoff?: number;
  timeout?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function invokeOrchestrator(
  goal: string,
  action: string,
  params: Record<string, unknown>,
  options: RetryOptions = {}
): Promise<unknown> {
  const {
    maxRetries = MAX_RETRIES,
    initialBackoff = INITIAL_BACKOFF,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const orchestratorUrl =
    process.env.ORCHESTRATOR_URL ||
    "https://n8n-ai-orchestrator-production.pyaesone-n8n.workers.dev";

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${orchestratorUrl}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal,
          action,
          params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Orchestrator returned ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes("400")) {
        throw error;
      }

      // If this is the last attempt, throw
      if (attempt === maxRetries) {
        throw new Error(
          `Orchestrator invocation failed after ${maxRetries + 1} attempts: ${lastError.message}`
        );
      }

      // Calculate backoff with exponential increase
      const backoff = initialBackoff * Math.pow(2, attempt);
      console.warn(
        `[Orchestrator] Attempt ${attempt + 1} failed, retrying in ${backoff}ms:`,
        lastError.message
      );

      await sleep(backoff);
    }
  }

  throw lastError || new Error("Orchestrator invocation failed");
}

export async function getJobStatus(jobId: string): Promise<unknown> {
  const orchestratorUrl =
    process.env.ORCHESTRATOR_URL ||
    "https://n8n-ai-orchestrator-production.pyaesone-n8n.workers.dev";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(`${orchestratorUrl}/jobs/${jobId}`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("[Orchestrator] Failed to get job status:", error);
    throw error;
  }
}
