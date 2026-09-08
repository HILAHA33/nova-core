const fs = require('fs');
let code = fs.readFileSync('server/reasoner.ts', 'utf8');

const target = `  private async tryLocalNeuralBacking(params: {
    lastUserMessage: string;
    temperature: number;
    memoryHits: string[];
    onChunk?: (chunkText: string) => void;
  }): Promise<string | null> {
    try {
      await this.initializeLocalAI();
      if (!this.generator) return null;

      let memoryContext = '';
      if (params.memoryHits && params.memoryHits.length > 0) {
        memoryContext = \`\\nYou have learned these facts over time:\\n\${params.memoryHits.map(m => \`- \${m}\`).join('\\n')}\\nUse these facts to improve your answer.\`;
      }

      const prompt = \`System: You are Nova Core AI, an expert AI created by the developer. You are highly intelligent, practical, and provide customized responses to all subjects including DIY projects.\${memoryContext}\\nUser: \${params.lastUserMessage}\\nNova Core AI:\`;
      
      const result = await this.generator(prompt, { 
        max_new_tokens: 300,
        temperature: params.temperature || 0.7,
        do_sample: true
      });

      if (result && result.length > 0) {
        let generatedText = result[0].generated_text;
        if (generatedText.startsWith(prompt)) {
          generatedText = generatedText.substring(prompt.length).trim();
        }
        return generatedText;
      }
      return null;
    } catch (e) {
      console.error('[Nova] Local neural backing failed:', e);
      return null;
    }
  }`;

const replace = `  private async tryLocalNeuralBacking(params: {
    lastUserMessage: string;
    temperature: number;
    memoryHits: string[];
    systemPrompt: string;
    onChunk?: (chunkText: string) => void;
  }): Promise<string | null> {
    try {
      await this.initializeLocalAI();
      if (!this.generator) return null;

      let memoryContext = '';
      if (params.memoryHits && params.memoryHits.length > 0) {
        memoryContext = \`\\nYou have learned these facts over time:\\n\${params.memoryHits.map(m => \`- \${m}\`).join('\\n')}\\nUse these facts to improve your answer.\`;
      }

      const baseSystem = params.systemPrompt || 'You are Nova Core AI, an expert AI created by the developer. You are highly intelligent, practical, and provide customized responses to all subjects including DIY projects.';
      const systemContent = \`\${baseSystem}\${memoryContext}\`;
      
      const prompt = \`<|im_start|>system\\n\${systemContent}<|im_end|>\\n<|im_start|>user\\n\${params.lastUserMessage}<|im_end|>\\n<|im_start|>assistant\\n\`;
      
      const result = await this.generator(prompt, { 
        max_new_tokens: 300,
        temperature: params.temperature || 0.7,
        do_sample: true
      });

      if (result && result.length > 0) {
        let generatedText = result[0].generated_text;
        if (generatedText.startsWith(prompt)) {
          generatedText = generatedText.substring(prompt.length);
        }
        
        const stopIndex = generatedText.indexOf('<|im_end|>');
        if (stopIndex !== -1) {
          generatedText = generatedText.substring(0, stopIndex);
        }
        
        const nextUserIndex = generatedText.indexOf('<|im_start|>');
        if (nextUserIndex !== -1) {
          generatedText = generatedText.substring(0, nextUserIndex);
        }
        
        return generatedText.trim();
      }
      return null;
    } catch (e) {
      console.error('[Nova] Local neural backing failed:', e);
      return null;
    }
  }`;

code = code.replace(target, replace);
fs.writeFileSync('server/reasoner.ts', code);
