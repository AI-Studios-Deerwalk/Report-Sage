import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3.2:3b")  # Much faster than 8b model

def ask_ollama(prompt: str, max_tokens: int = -1, temperature: float = 0.1, timeout_seconds: int = 60, stream: bool = False) -> str:
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "options": {
            "num_predict": max_tokens,
            "temperature": temperature,
        },
        "stream": stream
    }

    try:
        if stream:
            # Streaming response (original method)
            response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=timeout_seconds)
            response.raise_for_status()

            output = ""
            for line in response.iter_lines():
                if not line:
                    continue
                data = json.loads(line.decode("utf-8"))
                output += data.get("response", "")
            return output
        else:
            # Non-streaming response (faster for short responses)
            response = requests.post(OLLAMA_URL, json=payload, timeout=timeout_seconds)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
            
    except requests.exceptions.Timeout:
        return f"Analysis timed out after {timeout_seconds} seconds. The model is taking longer than expected."
    except requests.exceptions.ConnectionError:
        return "Connection error: Ollama service is not running or unreachable."
    except Exception as e:
        return f"Error during analysis: {str(e)}"

def ask_ollama_fast(prompt: str, max_tokens: int = -1, temperature: float = 0.1, timeout_seconds: int = 30) -> str:
    """Optimized version for faster responses - uses non-streaming and shorter timeout"""
    return ask_ollama(prompt, max_tokens, temperature, timeout_seconds, stream=False)
