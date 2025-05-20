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
 * Filters the raw response to remove thinking patterns
 */
function filterThinking(rawResponse) {
  // Skip filtering if response is too short
  if (!rawResponse || rawResponse.length < 20) {
    return rawResponse;
  }
  
  console.log("FILTERING - Raw input:", rawResponse);
  
  let response = rawResponse;
  
  // STEP 1: Extract only response after specific markers
  const markers = [
    /ANSWER:(.*?)$/s,
    /FINAL ANSWER:(.*?)$/s,
    /RESPONSE:(.*?)$/s,
  ];
  
  for (const marker of markers) {
    const match = response.match(marker);
    if (match && match[1] && match[1].trim().length > 0) {
      response = match[1].trim();
      console.log("FILTERING - After marker extraction:", response);
      break;
    }
  }
  
  // STEP 2: Remove thinking paragraphs
  const paragraphs = response.split(/\n\n+/);
  
  // If multiple paragraphs and first ones contain thinking words
  if (paragraphs.length > 1) {
    const thinkingWords = ["I should", "I need", "I want", "I will", "the user", "user is", 
                           "let me", "let's", "first", "okay", "based on", "looking", 
                           "analyze", "consider", "thinking", "thought", "process"];
    
    let firstValidParagraphIndex = -1;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].toLowerCase();
      const containsThinking = thinkingWords.some(word => para.includes(word.toLowerCase()));
      
      if (!containsThinking) {
        firstValidParagraphIndex = i;
        break;
      }
    }
    
    if (firstValidParagraphIndex > 0) {
      // Only keep paragraphs from the first valid one onwards
      response = paragraphs.slice(firstValidParagraphIndex).join("\n\n");
      console.log("FILTERING - After paragraph filtering:", response);
    } else if (firstValidParagraphIndex === -1) {
      // If all paragraphs contain thinking, just take the last paragraph
      response = paragraphs[paragraphs.length - 1];
      console.log("FILTERING - Using last paragraph:", response);
    }
  }
  
  // STEP 3: Find common response patterns
  const directResponsePatterns = [
    /((?:Hello|Hi|Yes|No|Welcome|Thanks|Thank you)(?:\s|,|!|\.|$).*?)$/is,
    /((?:It's|It is|There are|There is|You can|You should|You may|You might|If you|When you).*?)$/is
  ];
  
  for (const pattern of directResponsePatterns) {
    const match = response.match(pattern);
    if (match && match[1] && match[1].length > 20) {
      response = match[1];
      console.log("FILTERING - After response pattern match:", response);
      break;
    }
  }
  
  // STEP 4: Remove any remaining thinking sentences or patterns
  const thinkingPatterns = [
    /^.*?(the user|I should|I need|I want|I will|I can|I would|I am going|let me|let's).*?\n/gis,
    /^(Okay|I see|Let me|Let's|First|Now|Based on|Looking at|Alright|So|To respond).*?\n/gis,
    /^.*?thinking.*?\n/gis,
    /^.*?response.*?\n/gis,
    /^.*?question.*?about.*?\n/gis,
    /^Okay.*$/gim,
    /^I need to.*$/gim,
    /^I should.*$/gim,
    /^Let me.*$/gim,
    /^Let's.*$/gim,
    /^Since .*$/gim,
    /^This is.*$/gim
  ];
  
  for (const pattern of thinkingPatterns) {
    response = response.replace(pattern, '');
  }
  
  // STEP 5: Final cleanup
  // Remove excess whitespace
  response = response.replace(/\n{3,}/g, '\n\n').trim();
  
  console.log("FILTERING - Final filtered result:", response);
  
  // If filtering reduced the response to nothing or very little, return the original
  if (response.length < 10 && rawResponse.length > response.length) {
    // As a last resort, try to find the first actual sentence that looks like a response
    const sentences = rawResponse.split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      if (sentence.length > 10 && 
          !thinkingPatterns.some(pattern => pattern.test(sentence)) &&
          !sentence.toLowerCase().includes("user") &&
          !sentence.toLowerCase().match(/^(i should|i need|let me|let's|first)/i)) {
        return sentence;
      }
    }
    return rawResponse; // Couldn't find a good sentence, just return original
  }
  
  return response;
}

/**
 * Creates a chat completion using the Groq SDK
 */
export const createChatCompletion = async (message) => {
  console.log("Creating chat completion for message:", message);
  
  try {
    // SIMPLE SOLUTION: For common messages, just return pre-written responses
    // This completely avoids the LLM for simple queries
    
    // Convert to lowercase for easier matching
    const lowerMessage = message.trim().toLowerCase();
    
    // Define common greetings and their responses
    const commonResponses = {
      // Greetings
      "hi": "Hello! How can I help with your mental health questions today?",
      "hello": "Hi there! How can I assist you with mental health information today?",
      "hey": "Hello! What mental health topic would you like to discuss today?",
      "greetings": "Hello! How can I assist you with mental health information?",
      "good morning": "Good morning! How can I help with your mental health questions today?",
      "good afternoon": "Good afternoon! How can I assist with your mental health questions?",
      "good evening": "Good evening! How can I help with your mental health concerns today?",
      
      // Common mental health topics
      "anxiety": "Anxiety can be managed with deep breathing, mindfulness exercises, and regular physical activity. Would you like to know more about specific techniques?",
      "depression": "Depression often responds well to therapy, medication, and lifestyle changes like exercise and social connection. What aspect would you like to know more about?",
      "stress": "Stress management techniques include meditation, time management, and setting healthy boundaries. Would you like some specific strategies?",
      "sleep": "Sleep problems can improve with a consistent schedule, limiting screen time before bed, and creating a comfortable sleep environment. Would you like more specific advice?",
      
      // General queries
      "help": "I'm here to help with mental health information. What particular topic interests you?",
      "how are you": "I'm here and ready to assist with your mental health questions. What would you like to know about?",
      "what can you do": "I can provide information about mental health topics, coping strategies, and general wellness advice. What are you interested in learning about?",
      "thank you": "You're welcome! Is there anything else I can help you with regarding mental health?",
      "thanks": "You're welcome! Is there anything else I can help you with?",
      "bye": "Take care! Remember that taking care of your mental health is important. Feel free to return if you have more questions."
    };
    
    // Check if the message matches any common patterns
    for (const [key, response] of Object.entries(commonResponses)) {
      if (lowerMessage.includes(key)) {
        console.log(`Using pre-written response for "${key}"`);
        return response;
      }
    }
    
    // If we get here, it's not a simple message, use the LLM but with safety measures
    
    // Use a completely different approach: one-shot, pre-written responses
    // This approach significantly limits what the model can say
    const structuredPrompt = `IMPORTANT: RESPOND WITH ONLY ONE SHORT SENTENCE. 
DO NOT INCLUDE ANY THINKING OR ANALYSIS.

User message: "${message}"

Choose ONE of these responses that best matches the situation:
1. Hello! How can I help with your mental health questions today?
2. Anxiety can be managed with deep breathing, mindfulness exercises, and regular physical activity.
3. Depression often responds well to therapy, medication, and lifestyle changes like exercise and social connection.
4. Stress management techniques include meditation, time management, and setting healthy boundaries.
5. Sleep problems can improve with a consistent schedule, limiting screen time before bed, and creating a comfortable sleep environment.
6. Could you share more specific details about what you're experiencing?
7. I'm here to help with mental health information. What particular topic interests you?
8. That's a great question. The research suggests...
9. Yes, those symptoms are common with that condition.
10. Would you like more information about treatment options?
11. I appreciate you sharing that with me. What kind of support are you looking for?
12. Taking care of your mental health is important, and seeking information is a great step.

INSTRUCTIONS:
- DO NOT EXPLAIN YOUR CHOICE
- DO NOT WRITE ANY TEXT BEFORE OR AFTER YOUR CHOSEN RESPONSE
- DO NOT NUMBER YOUR RESPONSE
- YOU MAY MODIFY THE CHOSEN RESPONSE SLIGHTLY TO BETTER MATCH THE USER'S QUESTION
- KEEP YOUR RESPONSE TO ONE SHORT SENTENCE
- NEVER EXPLAIN YOUR REASONING`;

    // Try the API call with a strict structured approach
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a direct mental health assistant with strict operating instructions. You must respond EXACTLY in the format specified. Deviating from these instructions will cause your response to be rejected."
        },
        {
          role: "user",
          content: structuredPrompt
        }
      ],
      model: "gemma2-9b-it",
      temperature: 0.0, 
      max_tokens: 100,
    });
    
    let response = completion.choices[0].message.content;
    console.log("Raw response:", response);
    
    // Super aggressive filtering: simply remove everything that looks like thinking
    
    // 1. If response contains multiple paragraphs, take only the last one
    const paragraphs = response.split(/\n\n+/);
    if (paragraphs.length > 1) {
      response = paragraphs[paragraphs.length - 1];
    }
    
    // 2. If the response is still long, it might contain thinking within a paragraph
    const simpleResponsePatterns = [
      /((?:Hello|Hi).*?\?)/is,
      /((?:Yes|No|Sure|Of course|Absolutely).*?\.)/is,
      /([^.!?]*?(?:anxiety|depression|stress|mental health|therapy)[^.!?]*?[.!?])/is
    ];
    
    for (const pattern of simpleResponsePatterns) {
      const match = response.match(pattern);
      if (match && match[1] && match[1].length > 10 && match[1].length < 150) {
        response = match[1];
        break;
      }
    }
    
    // 3. If response is still too long, truncate it
    if (response.length > 150) {
      const sentences = response.split(/(?<=[.!?])\s+/);
      if (sentences.length > 0 && 
          !sentences[0].toLowerCase().includes("user") &&
          !sentences[0].toLowerCase().match(/^(i should|i need|let me|let's|first)/i)) {
        response = sentences[0];
      } else if (sentences.length > 1) {
        response = sentences[1];
      }
    }
    
    // 4. If it still contains thinking patterns after all this, use a fallback
    if (response.toLowerCase().includes("user is") || 
        response.toLowerCase().includes("i should") ||
        response.toLowerCase().includes("let me") ||
        response.toLowerCase().includes("thinking") ||
        response.toLowerCase().includes("would be") ||
        response.toLowerCase().includes("first") ||
        response.toLowerCase().includes("okay") ||
        response.toLowerCase().includes("based on")) {
      return "I'm here to help with mental health information. What specific topic would you like to know about?";
    }
    
    console.log("Filtered response:", response);
    return response.trim();
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