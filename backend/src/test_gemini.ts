import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const key = process.env.GEMINI_API_KEY || '';
  console.log('Testing GEMINI_API_KEY length:', key.length);
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const res = await model.generateContent('Hi');
    console.log('Success gemini-1.5-flash:', res.response.text());
  } catch (e: any) {
    console.error('Error gemini-1.5-flash:', e.message);
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const res = await model.generateContent('Hi');
    console.log('Success gemini-1.5-pro:', res.response.text());
  } catch (e: any) {
    console.error('Error gemini-1.5-pro:', e.message);
  }
}

test();
