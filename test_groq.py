from dotenv import load_dotenv
import os
import requests
import json

# تحميل المتغيرات البيئية
load_dotenv()

# الحصول على مفتاح API
api_key = os.getenv('key')
if not api_key:
    api_key = "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"

print(f"🔑 Using API key: {api_key[:5]}...{api_key[-4:]}")

# اختبار النماذج المختلفة
models = ["llama3-8b-8192", "deepseek-r1-distill-llama-70b"]

for model in models:
    print(f"\n{'='*50}")
    print(f"🔍 Testing model: {model}")
    print(f"{'='*50}")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "user", "content": "What is anxiety? Answer in 20 words only."}
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }
    
    try:
        print("📤 Sending request...")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            print(f"✅ Success!")
            print(f"📄 Response:")
            print(f"{'-'*30}")
            print(f"{content}")
            print(f"{'-'*30}")
            print(f"📊 Usage: Tokens used = {result['usage']['total_tokens']}")
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

print("\n✅ Test completed successfully!") 