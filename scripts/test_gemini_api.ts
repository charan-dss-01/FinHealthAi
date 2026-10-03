import fs from 'fs';
import path from 'path';

let apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
    if (match) {
      apiKey = match[1];
    }
  }
}

apiKey = apiKey.trim().replace(/['"]/g, '');

console.log('Testing Gemini API key...');
console.log(`Key length: ${apiKey.length}`);

async function testModels() {
  // First query ListModels to find all active model names
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log('Available models from Google:');
    if (data.models) {
      data.models.forEach((m: any) => console.log(`  - ${m.name}`));
    } else {
      console.log('ListModels output:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('ListModels error:', err);
  }

  // Try testing candidate models
  const candidates = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
  for (const m of candidates) {
    try {
      console.log(`\nTesting candidate model: ${m}...`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello! You are an AI CFO.' }] }],
        }),
      });

      const data = await res.json();
      if (res.status === 200 && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`✅ SUCCESS WITH MODEL: ${m}`);
        console.log(`AI Output: "${data.candidates[0].content.parts[0].text.substring(0, 200)}..."`);
        return m;
      } else {
        console.log(`❌ Model ${m} returned ${res.status}:`, JSON.stringify(data));
      }
    } catch (e) {
      console.error(`Error with ${m}:`, e);
    }
  }
}

testModels();
