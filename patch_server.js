const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // If no active instruction or standard reasoning:
  // Fetch prior conversation history for this specific user/chat to guarantee multi-turn context
  const pastChatMessages = await chatStore.getMessages(userId, chatId);
  const fullConversationHistory = pastChatMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const inferenceRequest: ChatCompletionRequest = {
    ...body,
    messages: fullConversationHistory.length > 0 ? fullConversationHistory : body.messages,
  };`;

const replacement = `  // If no active instruction or standard reasoning:
  // Fetch prior conversation history for this specific user/chat to guarantee multi-turn context
  const pastChatMessages = await chatStore.getMessages(userId, chatId);
  const historyMessages = pastChatMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Preserve any system messages passed via the API payload
  const systemMessages = (body.messages || []).filter((m: any) => m.role === 'system');

  let finalMessages = body.messages;
  if (historyMessages.length > 0) {
    finalMessages = [...systemMessages, ...historyMessages];
  }

  const inferenceRequest: ChatCompletionRequest = {
    ...body,
    messages: finalMessages,
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
