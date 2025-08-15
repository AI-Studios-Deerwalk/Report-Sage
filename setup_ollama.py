#!/usr/bin/env python3
"""
Comprehensive Ollama setup script for TU Report Analyzer
"""
import subprocess
import sys
import time
import requests
import os

def run_command(command, capture_output=True):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=capture_output, text=True)
        return result.stdout if capture_output else True
    except subprocess.CalledProcessError as e:
        if capture_output:
            print(f"❌ Command failed: {command}")
            print(f"   Error: {e.stderr}")
        return None

def check_ollama_installed():
    """Check if Ollama is installed"""
    print("🔍 Checking if Ollama is installed...")
    if run_command("ollama --version"):
        print("✅ Ollama is installed")
        return True
    else:
        print("❌ Ollama is not installed")
        return False

def check_ollama_running():
    """Check if Ollama service is running"""
    print("🔍 Checking if Ollama service is running...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama service is running")
            return True
        else:
            print(f"❌ Ollama service responded with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Ollama service is not accessible: {e}")
        return False

def start_ollama_service():
    """Start Ollama service"""
    print("🚀 Starting Ollama service...")
    
    # Try to start Ollama
    if run_command("ollama serve", capture_output=False):
        print("✅ Ollama service started")
        return True
    else:
        print("❌ Failed to start Ollama service")
        return False

def wait_for_ollama():
    """Wait for Ollama to become available"""
    print("⏳ Waiting for Ollama to become available...")
    for i in range(30):  # Wait up to 30 seconds
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                print("✅ Ollama is now available!")
                return True
        except:
            pass
        time.sleep(1)
        print(f"   Waiting... ({i+1}/30)")
    
    print("❌ Ollama did not become available within 30 seconds")
    return False

def check_model():
    """Check if the required model is available"""
    print("🔍 Checking if llama3.2:3b model is available...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            for model in models:
                if "llama3.2:3b" in model.get("name", ""):
                    print("✅ llama3.2:3b model is available")
                    return True
            
            print("❌ llama3.2:3b model not found")
            return False
        else:
            print("❌ Could not check models")
            return False
    except Exception as e:
        print(f"❌ Error checking models: {e}")
        return False

def pull_model():
    """Pull the required model"""
    print("📥 Pulling llama3.2:3b model...")
    if run_command("ollama pull llama3.2:3b"):
        print("✅ Model pulled successfully")
        return True
    else:
        print("❌ Failed to pull model")
        return False

def main():
    print("🚀 TU Report Analyzer - Ollama Setup")
    print("=" * 50)
    
    # Step 1: Check if Ollama is installed
    if not check_ollama_installed():
        print("\n📋 To install Ollama:")
        print("   1. Visit: https://ollama.ai/")
        print("   2. Download and install for your OS")
        print("   3. Run this script again")
        return False
    
    # Step 2: Check if Ollama service is running
    if not check_ollama_running():
        print("\n🔄 Ollama service is not running. Attempting to start it...")
        if start_ollama_service():
            if not wait_for_ollama():
                print("\n❌ Could not start Ollama service automatically")
                print("   Please start it manually:")
                print("   1. Open a new terminal")
                print("   2. Run: ollama serve")
                print("   3. Keep that terminal open")
                print("   4. Run this script again in another terminal")
                return False
        else:
            print("\n❌ Could not start Ollama service")
            print("   Please start it manually:")
            print("   1. Open a new terminal")
            print("   2. Run: ollama serve")
            print("   3. Keep that terminal open")
            print("   4. Run this script again in another terminal")
            return False
    
    # Step 3: Check if model is available
    if not check_model():
        print("\n📥 Model not found. Pulling llama3.2:3b...")
        if not pull_model():
            print("\n❌ Failed to pull model")
            print("   Please check your internet connection and try again")
            return False
    
    print("\n🎉 Setup complete! Ollama is ready to use.")
    print("\n📋 Next steps:")
    print("   1. Restart your backend server")
    print("   2. Try uploading a PDF again")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
