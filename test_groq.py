#!/usr/bin/env python3
import os
import sys
from groq import Groq

# Get API key from environment or use a default for testing
api_key = os.environ.get("GROQ_API_KEY", "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")

client = Groq(api_key=api_key)

def test_models():
    """Test listing and using models"""
    print("Testing Groq API connectivity...")
    
    try:
        # List available models
        available_models = client.models.list()
        print(f"Available models: {[model.id for model in available_models.data]}")
        
        # Define models to test - only using gemma2-9b-it
        models = ["gemma2-9b-it"]
        
        for model in models:
            print(f"\nTesting model: {model}")
            try:
                chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful assistant specialized in mental health."
                        },
                        {
                            "role": "user",
                            "content": "What are some strategies for managing anxiety?"
                        }
                    ],
                    model=model,
                    temperature=0.7,
                    max_tokens=100,
                )
                
                print(f"Response from {model}:")
                print(chat_completion.choices[0].message.content)
            except Exception as e:
                print(f"Error with model {model}: {str(e)}")
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_models()
    sys.exit(0 if success else 1) 