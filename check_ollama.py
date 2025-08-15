#!/usr/bin/env python3
"""
Quick Ollama status checker
"""
import requests
import json

def check_ollama_status():
    print("🔍 Checking Ollama status...")
    
    try:
        # Test basic connection
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        print(f"✅ Ollama is running (Status: {response.status_code})")
        
        # Get available models
        models_data = response.json()
        models = models_data.get("models", [])
        
        print(f"\n📋 Available models ({len(models)}):")
        for model in models:
            name = model.get("name", "Unknown")
            size = model.get("size", 0)
            size_mb = size / (1024 * 1024) if size > 0 else 0
            print(f"   - {name} ({size_mb:.1f} MB)")
        
        # Check for our required model
        has_required_model = any("llama3.2:3b" in model.get("name", "") for model in models)
        
        if has_required_model:
            print("\n✅ llama3.2:3b model is available!")
            return True
        else:
            print("\n❌ llama3.2:3b model not found")
            print("   Run: ollama pull llama3.2:3b")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Ollama on localhost:11434")
        print("   Ollama might not be running")
        return False
    except Exception as e:
        print(f"❌ Error checking Ollama: {e}")
        return False

def test_model_generation():
    print("\n🧪 Testing model generation...")
    
    try:
        payload = {
            "model": "llama3.2:3b",
            "prompt": "Say 'Hello World'",
            "options": {
                "num_predict": 10,
                "temperature": 0.1,
            }
        }
        
        response = requests.post("http://localhost:11434/api/generate", json=payload, timeout=30)
        
        if response.status_code == 200:
            print("✅ Model generation test successful!")
            return True
        else:
            print(f"❌ Model generation failed (Status: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Model generation test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Ollama Status Checker")
    print("=" * 30)
    
    if check_ollama_status():
        test_model_generation()
    
    print("\n📋 Next steps:")
    print("   1. If llama3.2:3b is missing, run: ollama pull llama3.2:3b")
    print("   2. Restart your backend server")
    print("   3. Try uploading a PDF again")
