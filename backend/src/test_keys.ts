import dotenv from 'dotenv';
dotenv.config();

async function testKeys() {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';

  console.log('--- TESTING OPENAI ---');
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say hello in 3 words' }],
        max_tokens: 10,
      }),
    });
    console.log('OpenAI Status:', res.status);
    const txt = await res.text();
    console.log('OpenAI Response:', txt);
  } catch (e: any) {
    console.error('OpenAI Error:', e.message);
  }

  console.log('\n--- TESTING GEMINI METHOD 1 (?key=...) ---');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello' }] }] }),
      }
    );
    console.log('Gemini Method 1 Status:', res.status);
    const txt = await res.text();
    console.log('Gemini Method 1 Response:', txt.substring(0, 200));
  } catch (e: any) {
    console.error('Gemini Method 1 Error:', e.message);
  }

  console.log('\n--- TESTING GEMINI METHOD 2 (Bearer Header) ---');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${geminiKey}`,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello' }] }] }),
      }
    );
    console.log('Gemini Method 2 Status:', res.status);
    const txt = await res.text();
    console.log('Gemini Method 2 Response:', txt.substring(0, 200));
  } catch (e: any) {
    console.error('Gemini Method 2 Error:', e.message);
  }

  console.log('\n--- TESTING GEMINI METHOD 3 (x-goog-api-key Header) ---');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello' }] }] }),
      }
    );
    console.log('Gemini Method 3 Status:', res.status);
    const txt = await res.text();
    console.log('Gemini Method 3 Response:', txt.substring(0, 200));
  } catch (e: any) {
    console.error('Gemini Method 3 Error:', e.message);
  }
}

testKeys();
