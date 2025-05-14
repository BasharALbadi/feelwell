import axios from 'axios';
import { getApiUrl } from '../config';

// Default configuration in case file can't be loaded
const defaultConfig = {
  showThinking: false,
  debugMode: false,
  chatSettings: {
    separateThinking: true,
    logThinkingToConsole: false,
    showThinkingToAdmin: false,
    saveThinkingHistory: false
  },
  userPermissions: {
    patient: {
      canSeeThinking: false
    },
    doctor: {
      canSeeThinking: false
    },
    admin: {
      canSeeThinking: true
    }
  }
};

let cachedConfig = null;

/**
 * Loads chat configuration from data.txt file
 * @returns {Promise<Object>} The configuration object
 */
export const loadChatConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // Try to fetch the data.txt file
    const response = await axios.get('/data.txt');
    
    // Parse JSON from the file
    try {
      const fileContent = response.data;
      // Find JSON content between curly braces
      const jsonMatch = fileContent.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonContent = jsonMatch[0];
        const config = JSON.parse(jsonContent);
        console.log('Chat config loaded successfully');
        cachedConfig = config;
        return config;
      }
    } catch (parseError) {
      console.error('Error parsing chat config:', parseError);
    }
  } catch (fetchError) {
    console.error('Could not load chat config file:', fetchError);
  }
  
  // Return default config if loading fails
  console.warn('Using default chat configuration');
  cachedConfig = defaultConfig;
  return defaultConfig;
};

/**
 * Checks if thinking should be shown for a specific user type
 * @param {string} userType - The type of user (patient, doctor, admin)
 * @returns {Promise<boolean>} Whether thinking should be shown
 */
export const shouldShowThinking = async (userType) => {
  const config = await loadChatConfig();
  
  // First check global setting
  if (!config.showThinking) {
    return false;
  }
  
  // Then check user-specific permission
  if (userType && config.userPermissions && config.userPermissions[userType]) {
    return config.userPermissions[userType].canSeeThinking;
  }
  
  return false;
};

/**
 * Filters thinking content from messages if needed
 * @param {Array} messages - Array of chat messages
 * @param {string} userType - The type of user viewing messages
 * @returns {Promise<Array>} Filtered messages
 */
export const filterThinkingContent = async (messages, userType) => {
  const shouldShow = await shouldShowThinking(userType);
  
  if (shouldShow) {
    return messages; // Return unfiltered messages
  }
  
  // Filter out thinking content
  return messages.map(msg => {
    if (msg.content && typeof msg.content === 'string') {
      // Remove content between <thinking> tags
      const filteredContent = msg.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
      return {
        ...msg,
        content: filteredContent.trim()
      };
    }
    return msg;
  });
};

export default {
  loadChatConfig,
  shouldShowThinking,
  filterThinkingContent
}; 