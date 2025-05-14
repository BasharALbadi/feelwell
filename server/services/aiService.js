import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Groq } from 'groq-sdk';

// Force dotenv to reload with path to server directory
const envPath = path.resolve(process.cwd(), 'server/.env');
dotenv.config({ path: envPath });

// Hard-code the API key as well to ensure it's available
const API_KEY = process.env.key || "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";
console.log("API Key available:", API_KEY ? "YES" : "NO");

// Initialize Groq client directly with the API key
const groqClient = new Groq({
  apiKey: API_KEY,
});

// Load context data
let contextData = "";
try {
  const rootDataPath = path.resolve(process.cwd(), '../data.txt');
  if (fs.existsSync(rootDataPath)) {
    contextData = fs.readFileSync(rootDataPath, 'utf-8');
    console.log("Context data loaded from:", rootDataPath);
  } else {
    console.warn("Context data file not found at:", rootDataPath);
  }
} catch (error) {
  console.error("Error loading context data:", error.message);
}

/**
 * Simple fallback responses
 */
function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('anxiety')) {
    return "Anxiety can be managed with deep breathing, mindfulness, and gradual exposure to triggers. Regular exercise and sufficient sleep also help reduce anxiety symptoms.";
  } else if (lowerMsg.includes('depress')) {
    return "Depression often improves with therapy, medication, regular physical activity, and maintaining social connections. It's important to reach out to a healthcare provider.";
  } else if (lowerMsg.includes('stress')) {
    return "Managing stress can involve techniques like meditation, physical activity, setting boundaries, and practicing self-care. What specific stress are you dealing with?";
  } else {
    return "I'm here to discuss mental health topics. Could you tell me more about what's on your mind?";
  }
}

/**
 * Creates a chat completion using the Groq SDK
 */
export const createChatCompletion = async (message) => {
  console.log("Creating chat completion for message:", message);
  
  try {
    // Try the API call first
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant specialized in mental health information."
        },
        {
          role: "user",
          content: `Question about mental health: ${message}\nContext: ${contextData}`
        }
      ],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.7,
      max_tokens: 800,
    });
    
    console.log("API call successful! Got response");
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("API call failed:", error.message);
    return getFallbackResponse(message);
  }
};

/**
 * Try a simple test request to verify API connectivity
 * @returns {Promise<boolean>} - true if API is accessible
 */
const testApiConnection = async () => {
  if (!groqClient) {
    console.error("Cannot test API connection - Groq client not initialized");
    return false;
  }
  
  try {
    // Try listing models as a simple test
    const models = await groqClient.models.list();
    console.log("Available models:", models.data.map(model => model.id));
    return true;
  } catch (error) {
    console.error("API connection test failed:", error.message);
    return false;
  }
};

// Verify API connection on startup
if (groqClient) {
  testApiConnection()
    .then(success => console.log("API connection test:", success ? "SUCCESS" : "FAILED"))
    .catch(err => console.error("API test error:", err));
} else {
  console.warn("Skipping API connection test - Groq client not initialized");
} 