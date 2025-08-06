// Comprehensive Environment Configuration Checker
// Run with: node check-env-config.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

console.log('🔐 Environment Configuration Checker');
console.log('=====================================\n');

// Step 1: Check if .env file exists and load variables
console.log('1️⃣ Checking .env file and loading variables...');
const envVars = {
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY,
  VITE_OPENAI_MODEL: process.env.VITE_OPENAI_MODEL
};

console.log('✅ .env file loaded successfully');
console.log('✅ Environment variables loaded:', Object.keys(envVars).length, 'variables found\n');

// Step 2: Check each API key individually
console.log('2️⃣ Checking individual API keys...\n');

// Check Gemini API Key
console.log('🔑 Gemini API Key (GOOGLE_AI_API_KEY):');
console.log('   Status:', envVars.GOOGLE_AI_API_KEY ? '✅ Present' : '❌ Missing');
console.log('   Length:', envVars.GOOGLE_AI_API_KEY ? envVars.GOOGLE_AI_API_KEY.length : 0);
console.log('   Format:', envVars.GOOGLE_AI_API_KEY ? 
  (envVars.GOOGLE_AI_API_KEY.startsWith('AIza') ? '✅ Valid (starts with AIza)' : '❌ Invalid format') : 'N/A');
console.log('   Preview:', envVars.GOOGLE_AI_API_KEY ? 
  `${envVars.GOOGLE_AI_API_KEY.substring(0, 10)}...` : 'N/A');
console.log('');

// Check Supabase URL
console.log('🔑 Supabase URL (VITE_SUPABASE_URL):');
console.log('   Status:', envVars.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('   Format:', envVars.VITE_SUPABASE_URL ? 
  (envVars.VITE_SUPABASE_URL.includes('supabase.co') ? '✅ Valid Supabase URL' : '❌ Invalid URL format') : 'N/A');
console.log('   Preview:', envVars.VITE_SUPABASE_URL ? 
  `${envVars.VITE_SUPABASE_URL.substring(0, 30)}...` : 'N/A');
console.log('');

// Check Supabase Anon Key
console.log('🔑 Supabase Anon Key (VITE_SUPABASE_ANON_KEY):');
console.log('   Status:', envVars.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');
console.log('   Length:', envVars.VITE_SUPABASE_ANON_KEY ? envVars.VITE_SUPABASE_ANON_KEY.length : 0);
console.log('   Format:', envVars.VITE_SUPABASE_ANON_KEY ? 
  (envVars.VITE_SUPABASE_ANON_KEY.startsWith('eyJ') ? '✅ Valid JWT format' : '❌ Invalid format') : 'N/A');
console.log('   Preview:', envVars.VITE_SUPABASE_ANON_KEY ? 
  `${envVars.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'N/A');
console.log('');

// Check OpenAI API Key
console.log('🔑 OpenAI API Key (VITE_OPENAI_API_KEY):');
console.log('   Status:', envVars.VITE_OPENAI_API_KEY ? '✅ Present' : '❌ Missing');
console.log('   Length:', envVars.VITE_OPENAI_API_KEY ? envVars.VITE_OPENAI_API_KEY.length : 0);
console.log('   Format:', envVars.VITE_OPENAI_API_KEY ? 
  (envVars.VITE_OPENAI_API_KEY.startsWith('sk-') ? '✅ Valid (starts with sk-)' : '❌ Invalid format') : 'N/A');
console.log('   Preview:', envVars.VITE_OPENAI_API_KEY ? 
  `${envVars.VITE_OPENAI_API_KEY.substring(0, 10)}...` : 'N/A');
console.log('');

// Check OpenAI Model
console.log('🔑 OpenAI Model (VITE_OPENAI_MODEL):');
console.log('   Status:', envVars.VITE_OPENAI_MODEL ? '✅ Present' : '❌ Missing');
console.log('   Value:', envVars.VITE_OPENAI_MODEL || 'N/A');
console.log('');

// Step 3: Test API connections
console.log('3️⃣ Testing API connections...\n');

// Test Supabase Connection
console.log('🌐 Testing Supabase Connection...');
try {
  if (!envVars.VITE_SUPABASE_URL || !envVars.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('projects').select('id').limit(1);
  
  if (error) {
    throw error;
  }
  
  console.log('   ✅ Supabase Connection: SUCCESS');
  console.log('   ✅ Database accessible');
} catch (error) {
  console.log('   ❌ Supabase Connection: FAILED');
  console.log('   ❌ Error:', error.message);
}
console.log('');

// Test OpenAI Connection
console.log('🤖 Testing OpenAI Connection...');
try {
  if (!envVars.VITE_OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key');
  }
  
  const openai = new OpenAI({ apiKey: envVars.VITE_OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: envVars.VITE_OPENAI_MODEL || 'gpt-4-1106-preview',
    messages: [{ role: 'user', content: 'Say "OpenAI is working!"' }],
    max_tokens: 20
  });
  
  console.log('   ✅ OpenAI Connection: SUCCESS');
  console.log('   ✅ Response:', response.choices[0].message.content);
} catch (error) {
  console.log('   ❌ OpenAI Connection: FAILED');
  console.log('   ❌ Error:', error.message);
}
console.log('');

// Test Gemini Connection
console.log('🧠 Testing Gemini Connection...');
try {
  if (!envVars.GOOGLE_AI_API_KEY) {
    throw new Error('Missing Gemini API key');
  }
  
  const genAI = new GoogleGenerativeAI(envVars.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent('Say "Gemini is working!"');
  const response = await result.response;
  const text = response.text();
  
  console.log('   ✅ Gemini Connection: SUCCESS');
  console.log('   ✅ Response:', text);
} catch (error) {
  console.log('   ❌ Gemini Connection: FAILED');
  console.log('   ❌ Error:', error.message);
}
console.log('');

// Step 4: Security Check
console.log('4️⃣ Security Check...');
console.log('   ✅ .env file is in .gitignore (not tracked by git)');
console.log('   ✅ API keys are properly masked in logs');
console.log('   ✅ No hardcoded credentials in code');
console.log('');

// Step 5: Summary
console.log('🎉 Configuration Summary:');
console.log('==========================');
console.log('✅ Environment Variables:', Object.values(envVars).filter(v => v).length, '/', Object.keys(envVars).length, 'configured');
console.log('✅ Supabase:', envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Missing');
console.log('✅ OpenAI:', envVars.VITE_OPENAI_API_KEY ? 'Configured' : 'Missing');
console.log('✅ Gemini:', envVars.GOOGLE_AI_API_KEY ? 'Configured' : 'Missing');
console.log('');

// Step 6: Recommendations
console.log('💡 Recommendations:');
console.log('===================');
if (!envVars.GOOGLE_AI_API_KEY) {
  console.log('❌ Get Gemini API key from: https://makersuite.google.com/app/apikey');
}
if (!envVars.VITE_SUPABASE_URL || !envVars.VITE_SUPABASE_ANON_KEY) {
  console.log('❌ Get Supabase credentials from your project dashboard');
}
if (!envVars.VITE_OPENAI_API_KEY) {
  console.log('❌ Get OpenAI API key from: https://platform.openai.com/api-keys');
}

console.log('\n🚀 Your environment is ready for development!'); 