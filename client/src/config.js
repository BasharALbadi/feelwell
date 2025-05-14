// The base URL for all API calls
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

// Helper to construct API URLs correctly
export const getApiUrl = (endpoint) => {
  // Make sure the endpoint starts with / but the SERVER_URL doesn't end with /
  const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
};