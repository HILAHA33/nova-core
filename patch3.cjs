const fs = require('fs');
let code = fs.readFileSync('server/reasoner.ts', 'utf8');

const target = `      if (result && result.length > 0) {
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
      }`;

const replace = `      if (result && result.length > 0) {
        let generatedText = result[0].generated_text;
        
        // The generator strips special tokens like <|im_start|> by default.
        // So the output looks like "system\\n...\\nuser\\n...\\nassistant\\nTHE_RESPONSE"
        const assistantMarker = 'assistant\\n';
        const lastAssistantIndex = generatedText.lastIndexOf(assistantMarker);
        if (lastAssistantIndex !== -1) {
          generatedText = generatedText.substring(lastAssistantIndex + assistantMarker.length);
        }
        
        // If it starts trailing off into another role, cut it off
        const nextUserMarker = 'user\\n';
        const nextUserIndex = generatedText.indexOf(nextUserMarker);
        if (nextUserIndex !== -1) {
          generatedText = generatedText.substring(0, nextUserIndex);
        }

        const nextSystemMarker = 'system\\n';
        const nextSystemIndex = generatedText.indexOf(nextSystemMarker);
        if (nextSystemIndex !== -1) {
          generatedText = generatedText.substring(0, nextSystemIndex);
        }
        
        return generatedText.trim();
      }`;

code = code.replace(target, replace);
fs.writeFileSync('server/reasoner.ts', code);
