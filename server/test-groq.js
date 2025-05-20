import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure API request
const client = new Groq({
  apiKey: process.env.key,
});

async function testGroqAPI() {
  console.log("Testing Groq API...");
  
  try {
    // Construct the payload
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Keep your answers very brief."
        },
        {
          role: "user",
          content: "Hello, can you tell me about yourself?"
        }
      ],
      model: 'gemma2-9b-it',
      temperature: 0.7,
      max_tokens: 200
    });
    
    console.log("API call successful!");
    console.log("Response:", chatCompletion.choices[0].message.content);
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("API call failed:", error.message);
    return null;
  }
}

// Run the test
testGroqAPI()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err)); 