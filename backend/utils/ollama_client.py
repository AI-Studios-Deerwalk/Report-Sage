import requests
import json
import os
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
    
    async def analyze_document(self, content: str, temperature: float = 0.1, timeout_seconds: int = 60) -> str:
        """Analyze document content using Ollama"""
        # Create a more structured prompt for document analysis
        prompt = f"""
        You are an expert academic document reviewer. Analyze the following document content for format compliance, writing quality, and academic standards.

        Please provide your feedback in this EXACT format:

        SUGGESTIONS:
        - [Suggestion 1 about improving the document]
        - [Suggestion 2 about enhancing content quality]
        - [Additional suggestions as needed]

        WARNINGS:
        - [Warning 1 about potential formatting issues]
        - [Warning 2 about style or structure concerns]
        - [Additional warnings as needed]

        ERRORS:
        - [Error 1 about definitive formatting violations]
        - [Error 2 about missing required sections]
        - [Additional errors as needed]

        Document content to analyze:
        {content[:5000]}

        Please be specific and actionable in your feedback. Focus on academic writing standards, formatting consistency, and document structure.
        """
        
        return ask_ollama_fast(prompt, temperature=temperature, timeout_seconds=timeout_seconds)

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
