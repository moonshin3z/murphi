const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  });
}

async function generateText(prompt, { maxTokens } = {}) {
  if (!model) {
    return null;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error con Gemini:', error.message);
    return null;
  }
}

async function chat(systemPrompt, messages, { maxTokens = 800 } = {}) {
  if (!model) {
    return null;
  }

  try {
    const chatModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
      }
    });

    // Convertir mensajes al formato de Gemini
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chatSession = chatModel.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chatSession.sendMessage(lastMessage);
    return result.response.text();
  } catch (error) {
    console.error('Error con Gemini chat:', error.message);
    return null;
  }
}

module.exports = { generateText, chat };
