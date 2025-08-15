#!/usr/bin/env python3
"""
Quick setup script to pull the faster model
"""
import subprocess
import sys

def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {command} failed: {e}")
        return None

def main():
    print("🚀 Setting up faster model for TU Report Analyzer...")
    
    # Check if ollama is available
    if run_command("ollama --version") is None:
        print("❌ Ollama not found. Please install Ollama first: https://ollama.ai/")
        sys.exit(1)
    
    # Pull the faster model
    print("📥 Pulling llama3.2:3b model (much faster than 8b)...")
    if run_command("ollama pull llama3.2:3b"):
        print("✅ Model ready! Now restart your backend server.")
    else:
        print("❌ Failed to pull model. Check your internet connection.")
        sys.exit(1)

if __name__ == "__main__":
    main()
