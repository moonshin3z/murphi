require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'Missing');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ No GEMINI_API_KEY found in .env file');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try listing available models
    console.log('\nTrying to list models...');
    try {
      const models = await genAI.listModels();
      console.log('✅ Available models:');
      for (const model of models) {
        console.log(`  - ${model.name}`);
      }
    } catch (error) {
      console.log('❌ Could not list models:', error.message);
    }

    // Try different model names
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-pro'
    ];

    for (const modelName of modelsToTry) {
      console.log(`\nTrying model: ${modelName}`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello in one word');
        const response = await result.response;
        console.log(`✅ ${modelName} works! Response:`, response.text());
        break;
      } catch (error) {
        console.log(`❌ ${modelName} failed:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testGemini();
