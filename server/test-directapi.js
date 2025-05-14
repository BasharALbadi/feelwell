import { callGroqDirectly } from './directApi.js';

// Test function
async function testDirectApi() {
  console.log("==============================================");
  console.log("🧪 Testing directApi.js implementation");
  console.log("==============================================");
  
  try {
    // Test with a simple mental health question
    const testQuery = "What are some coping strategies for anxiety?";
    console.log(`📝 Test query: "${testQuery}"`);
    
    console.log("⏳ Calling the API...");
    const response = await callGroqDirectly(testQuery);
    
    console.log("\n📄 Full response from API:");
    console.log("----------------------------------------------");
    console.log(response);
    console.log("----------------------------------------------");
    
    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run the test
testDirectApi().catch(err => {
  console.error("Unhandled error in test:", err);
}); 