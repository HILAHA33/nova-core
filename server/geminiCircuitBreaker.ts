class GeminiCircuitBreaker {
  private cooledDownUntil = 0;
  private consecutiveErrors = 0;
  private lastErrorMessage = '';

  public isCoolingDown(): boolean {
    return Date.now() < this.cooledDownUntil;
  }

  public getRemainingCooldownMs(): number {
    return Math.max(0, this.cooledDownUntil - Date.now());
  }

  public recordSuccess(): void {
    this.consecutiveErrors = 0;
    this.cooledDownUntil = 0;
    this.lastErrorMessage = '';
  }

  public recordError(error: any): { isRateLimited: boolean; cooldownSeconds: number } {
    const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
    this.lastErrorMessage = errStr;

    // Detect 429 / Quota Exceeded / RESOURCE_EXHAUSTED
    const isRateLimited = 
      errStr.includes('429') ||
      errStr.includes('RESOURCE_EXHAUSTED') ||
      errStr.toLowerCase().includes('quota exceeded') ||
      errStr.toLowerCase().includes('rate limit');

    let delaySeconds = 45;

    if (isRateLimited) {
      // Attempt to parse recommended retry delay (e.g. "retry in 41.6s" or "retryDelay": "41s")
      const retryMatch = errStr.match(/retry in\s+([0-9.]+)\s*s/i) || errStr.match(/"retryDelay":\s*"([0-9]+)s"/i);
      if (retryMatch && retryMatch[1]) {
        delaySeconds = Math.max(15, Math.ceil(parseFloat(retryMatch[1])) + 2);
      } else {
        delaySeconds = Math.min(120, 45 * Math.pow(1.5, Math.min(this.consecutiveErrors, 3)));
      }

      this.consecutiveErrors++;
      this.cooledDownUntil = Date.now() + (delaySeconds * 1000);
      console.log(`[Gemini Circuit Breaker] Quota/Rate Limit (429) active. Pausing Gemini for ${delaySeconds}s. Routing smoothly to Nova Autonomous Core & Hugging Face.`);
    } else {
      this.consecutiveErrors++;
      if (this.consecutiveErrors >= 2) {
        delaySeconds = 15;
        this.cooledDownUntil = Date.now() + 15000;
      }
    }

    return { isRateLimited, cooldownSeconds: delaySeconds };
  }
}

export const geminiCircuitBreaker = new GeminiCircuitBreaker();
