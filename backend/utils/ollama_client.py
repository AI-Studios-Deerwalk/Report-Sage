import requests
import json
import os
import asyncio
import concurrent.futures
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3.2:3b")  # Much faster than 8b model

class OllamaClient:
    """Class-based Ollama client to match the expected interface"""
    
    def __init__(self):
        self.url = OLLAMA_URL
        self.model = MODEL_NAME
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)
    
    def analyze_document(self, content: str, temperature: float = 0.1, timeout_seconds: int = 60) -> str:
        """Analyze document content using Ollama"""
        # Create a more structured prompt for document analysis
        prompt = f"""
        You are an expert academic document reviewer. Analyze the document for format compliance and academic standards.

        RESPONSE FORMAT (use plain text, NOT Markdown):
        ERRORS:
        - [Your error about definitive formatting violations]
        - [Your error about missing required sections]

        WARNINGS:
        - [Your warning about potential formatting issues]
        - [Your warning about style or structure concerns]

        SUGGESTIONS:
        - [Your suggestion about improving the document]
        - [Your suggestion about enhancing content quality]

        DOCUMENT TO ANALYZE:
        {content[:5000]}
        """
        
        return ask_ollama_fast(prompt, temperature=temperature, timeout_seconds=timeout_seconds)
    
    async def analyze_document_async(self, content: str, temperature: float = 0.1, timeout_seconds: int = 60) -> str:
        """Analyze document content using Ollama in a non-blocking way"""
        # Create a more structured prompt for document analysis
        prompt = f"""
        You are an expert academic document reviewer. Analyze the document for format compliance and academic standards.

        RESPONSE FORMAT (use plain text, NOT Markdown):
        ERRORS:
        - [Your error about definitive formatting violations]
        - [Your error about missing required sections]

        WARNINGS:
        - [Your warning about potential formatting issues]
        - [Your warning about style or structure concerns]

        SUGGESTIONS:
        - [Your suggestion about improving the document]
        - [Your suggestion about enhancing content quality]

        DOCUMENT TO ANALYZE:
        {content[:5000]}
        """
        
        # Run the blocking Ollama call in a thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, 
            ask_ollama_fast, 
            prompt, 
            -1, 
            temperature, 
            timeout_seconds
        )

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
