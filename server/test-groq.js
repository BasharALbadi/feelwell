import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGroqAPI() {
  console.log('Starting Groq API test...');
  console.log(`API key available: ${process.env.key ? 'YES' : 'NO'}`);
  
  try {
    // Initialize the client
    const groq = new Groq({
      apiKey: process.env.key,
    });
    console.log('Client initialized');
    
    // List models
    try {
      const models = await groq.models.list();
      console.log('Available models:', models.data.map(m => m.id).join(', '));
    } catch (err) {
      console.error('Error listing models:', err.message);
    }
    
    // Test completion
    try {
      console.log('Testing chat completion...');
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'user', content: 'What are symptoms of anxiety?' }
        ],
        model: 'deepseek-r1-distill-llama-70b',
        temperature: 0.5,
        max_tokens: 100
      });
      
      console.log('Completion successful!');
      console.log('Response:', completion.choices[0].message.content);
    } catch (err) {
      console.error('Completion error:', err.message);
      if (err.response) {
        console.error('Error details:', err.response.data);
      }
    }
  } catch (err) {
    console.error('Failed to initialize client:', err.message);
  }
}

// Run the test
testGroqAPI()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err)); 