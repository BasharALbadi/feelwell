import fs from 'fs';
import path from 'path';
import axios from 'axios';

// The API key - hardcoded for direct testing
const API_KEY = "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";
// Define available models with options to fallback
const MODELS = {
  primary: "deepseek-r1-distill-llama-70b", // Higher quality model
  fallback: "llama3-8b-8192" // Definitely available model as backup
};

// Load context data
let contextData = "";
try {
  const dataPath = path.resolve(process.cwd(), 'data.txt');
  if (fs.existsSync(dataPath)) {
    contextData = fs.readFileSync(dataPath, 'utf-8');
    console.log("Data loaded from:", dataPath);
  }
} catch (error) {
  console.error("Error loading data:", error.message);
}

/**
 * Call the Groq API directly using axios with improved reliability
 */
export async function callGroqDirectly(message) {
  try {
    console.log("==============================");
    console.log("🔄 Calling Groq API directly with message:", message);
    console.log("📁 Context data available:", contextData ? "YES" : "NO");
    
    // First try with the primary model
    let currentModel = MODELS.primary;
    console.log(`🤖 Attempting with primary model: ${currentModel}`);
    
    const requestData = {
      model: currentModel,
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant specialized in mental health information. 
          
DO NOT include any internal thinking, analysis, or processing in your responses. 
DO NOT use any <think> tags or similar markup in your responses.
DO NOT start responses with phrases like "Let me think" or similar preambles.

Respond directly with clear, helpful information to the user's questions.`
        },
        {
          role: "user",
          content: `Question about mental health: ${message}\nContext: ${contextData}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    };
    
    console.log("📤 Request being sent to Groq API:", JSON.stringify(requestData).substring(0, 300) + "...");
    
    try {
      const response = await axios({
        method: 'post',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: requestData,
        timeout: 30000 // 30 second timeout
      });
      
      console.log("✅ Response received from Groq API!");
      console.log("🔑 API response status:", response.status);
      console.log("📥 Response data structure:", Object.keys(response.data).join(", "));
      
      if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        const content = response.data.choices[0].message.content;
        console.log("💬 AI response preview:", content.substring(0, 100) + "...");
        console.log("📊 Tokens used:", response.data.usage?.total_tokens || "unknown");
        return content;
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (primaryError) {
      // If primary model fails, try the fallback model
      console.warn(`⚠️ Primary model failed: ${primaryError.message}`);
      console.log(`🔄 Trying fallback model: ${MODELS.fallback}`);
      
      // Update model in request data
      requestData.model = MODELS.fallback;
      
      const fallbackResponse = await axios({
        method: 'post',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: requestData,
        timeout: 30000
      });
      
      console.log("✅ Fallback response received!");
      
      if (fallbackResponse.data.choices && fallbackResponse.data.choices[0] && fallbackResponse.data.choices[0].message) {
        const content = fallbackResponse.data.choices[0].message.content;
        console.log("💬 Fallback AI response preview:", content.substring(0, 100) + "...");
        console.log("📊 Tokens used:", fallbackResponse.data.usage?.total_tokens || "unknown");
        return content;
      } else {
        console.error("❌ Unexpected fallback response format");
        throw new Error("All model attempts failed");
      }
    }
  } catch (error) {
    console.error("❌ Error calling Groq API:", error.message);
    if (error.response) {
      console.error("🚨 API response error status:", error.response.status);
      console.error("🚨 API response error data:", JSON.stringify(error.response.data));
    }
    return "I'm having trouble connecting to my knowledge base. Can you please try again?";
  } finally {
    console.log("==============================");
  }
} 