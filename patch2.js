const fs = require('fs');
let code = fs.readFileSync('server/reasoner.ts', 'utf8');

const target = `    try {
      const neuralAnswer = await this.tryLocalNeuralBacking({
        lastUserMessage: params.lastUserMessage,
        temperature: params.temperature,
        memoryHits: params.memoryHits.map(m => m.text),
        onChunk: params.onChunk
      });`;

const replace = `    try {
      const neuralAnswer = await this.tryLocalNeuralBacking({
        lastUserMessage: params.lastUserMessage,
        temperature: params.temperature,
        memoryHits: params.memoryHits.map(m => m.text),
        systemPrompt: params.systemPrompt,
        onChunk: params.onChunk
      });`;

code = code.replace(target, replace);
fs.writeFileSync('server/reasoner.ts', code);
