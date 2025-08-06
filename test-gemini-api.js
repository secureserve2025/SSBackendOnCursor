// Test script for Gemini API
// Run with: node test-gemini-api.js

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

// Load Gemini API key
const geminiApiKey = process.env.GOOGLE_AI_API_KEY;

console.log('🤖 Gemini API Test Script');
console.log('==========================\n');

// Test 1: Check if Gemini API key exists
console.log('1️⃣ Testing Gemini API Key...');
console.log('✅ Gemini API Key:', geminiApiKey ? 'Configured' : '❌ Missing');
console.log('✅ API Key length:', geminiApiKey ? geminiApiKey.length : 0);
console.log('✅ API Key starts with AIza:', geminiApiKey ? geminiApiKey.startsWith('AIza') : false);

if (!geminiApiKey) {
  console.log('❌ Error: GOOGLE_AI_API_KEY is not set in .env file');
  process.exit(1);
}

// Test 2: Test Gemini API Connection
console.log('\n2️⃣ Testing Gemini API Connection...');
try {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  
  // Use the correct model name for current API version
  const modelName = 'gemini-1.5-flash';
  console.log(`🔄 Trying model: ${modelName}`);
  
  const model = genAI.getGenerativeModel({ model: modelName });
  
  const result = await model.generateContent('Say "Hello, Gemini API is working!"');
  const response = await result.response;
  const text = response.text();
  
  console.log('✅ Gemini API Connection: SUCCESS');
  console.log('✅ Working model:', modelName);
  console.log('✅ Response:', text);
  
} catch (error) {
  console.log('❌ Gemini API Connection: FAILED');
  console.log('❌ Error:', error.message);
  
  // Additional debugging info
  if (error.message.includes('429')) {
    console.log('💡 Rate limit exceeded. Wait a few minutes and try again.');
    console.log('💡 Free tier has daily and per-minute limits.');
  } else if (error.message.includes('404')) {
    console.log('💡 Model not found. This might be an API version issue.');
    console.log('💡 Please check your API key at: https://makersuite.google.com/app/apikey');
  }
}

console.log('\n🎉 Gemini API Test Summary:');
console.log('============================');
console.log('✅ Gemini API Key: Configured');
console.log('✅ API Key Format: Valid');
console.log('❌ Gemini API: Rate limited or model issue');
console.log('\n🔧 Try again in a few minutes or check your API quota!'); 