const Anthropic = require('@anthropic-ai/sdk').default;

let client = null;

if (process.env.ANTHROPIC_API_KEY) {
  client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}

async function generateText(prompt, { maxTokens = 500, temperature = 0.7 } = {}) {
  if (!client) {
    return null;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    return message.content[0].text;
  } catch (error) {
    console.error('Error con Claude:', error.message);
    return null;
  }
}

async function chat(systemPrompt, messages, { maxTokens = 800, temperature = 0.7 } = {}) {
  if (!client) {
    return null;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages
    });
    return message.content[0].text;
  } catch (error) {
    console.error('Error con Claude chat:', error.message);
    return null;
  }
}

async function chatWithTools(systemPrompt, messages, tools, { maxTokens = 1024, temperature = 0.7 } = {}) {
  if (!client) {
    return null;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
      tools
    });
    return response;
  } catch (error) {
    console.error('Error con Claude chatWithTools:', error.message);
    return null;
  }
}

module.exports = { generateText, chat, chatWithTools };
