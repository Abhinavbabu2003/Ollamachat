import asyncio
import json
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import AsyncGenerator
import uvicorn

app = FastAPI(title="Ollama Chat API", version="1.0.0")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    model: str = "llama3.2:3b"

class ChatResponse(BaseModel):
    response: str

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"

async def check_ollama_connection():
    """Check if Ollama is running and accessible"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False

async def stream_ollama_response(message: str, model: str) -> AsyncGenerator[str, None]:
    """Stream response from Ollama with optimized settings"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": model,
                "prompt": message,
                "stream": True,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_ctx": 4096,
                    "num_predict": 2048,
                    "repeat_penalty": 1.1,
                    "num_thread": 8  # Optimize for performance
                }
            }
            
            async with client.stream(
                "POST", 
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': 'Ollama request failed'})}\n\n"
                    return
                
                async for chunk in response.aiter_lines():
                    if chunk:
                        try:
                            data = json.loads(chunk)
                            if "response" in data:
                                # Send each token as it arrives
                                yield f"data: {json.dumps({'token': data['response']})}\n\n"
                            
                            if data.get("done", False):
                                yield f"data: {json.dumps({'done': True})}\n\n"
                                break
                        except json.JSONDecodeError:
                            continue
                            
    except Exception as e:
        yield f"data: {json.dumps({'error': f'Connection error: {str(e)}'})}\n\n"

@app.get("/")
async def root():
    return {"message": "Ollama Chat API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    ollama_status = await check_ollama_connection()
    return {
        "status": "healthy" if ollama_status else "unhealthy",
        "ollama_connected": ollama_status
    }

@app.get("/models")
async def get_available_models():
    """Get list of available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [model["name"] for model in data.get("models", [])]
                return {"models": models}
            else:
                raise HTTPException(status_code=500, detail="Failed to fetch models")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to Ollama: {str(e)}")

@app.post("/chat/stream")
async def chat_stream(chat_message: ChatMessage):
    """Stream chat response from Ollama"""
    if not await check_ollama_connection():
        raise HTTPException(status_code=503, detail="Ollama is not available")
    
    return StreamingResponse(
        stream_ollama_response(chat_message.message, chat_message.model),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )

@app.post("/chat")
async def chat_non_stream(chat_message: ChatMessage):
    """Non-streaming chat endpoint for compatibility"""
    if not await check_ollama_connection():
        raise HTTPException(status_code=503, detail="Ollama is not available")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": chat_message.model,
                "prompt": chat_message.message,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_ctx": 4096,
                    "num_predict": 2048,
                    "repeat_penalty": 1.1,
                    "num_thread": 8
                }
            }
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return ChatResponse(response=data.get("response", ""))
            else:
                raise HTTPException(status_code=500, detail="Ollama request failed")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        workers=1,
        loop="uvloop"  # Faster event loop
    )
