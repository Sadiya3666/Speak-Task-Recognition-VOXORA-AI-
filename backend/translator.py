from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import logging
import requests
from urllib.parse import quote

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["translation"])

class TranslationRequest(BaseModel):
    text: str
    target_lang: str = 'en'  # Default to English
    source_lang: str = 'auto'  # Auto-detect source language

def translate_chunk(text, from_lang, to_lang):
    """Helper function to translate a chunk of text using Google Translate"""
    try:
        # Use Google Translate API directly
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            'client': 'gtx',
            'sl': from_lang if from_lang != 'auto' else 'auto',
            'tl': to_lang,
            'dt': 't',
            'q': text
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        # Parse the response
        result = response.json()
        if result and len(result) > 0 and result[0]:
            translated_text = ''.join([item[0] for item in result[0] if item[0]])
            return translated_text
        else:
            raise HTTPException(status_code=500, detail="Translation service returned empty result")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Translation request error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Translation service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

@router.post("/api/translate")
async def translate_text(request: TranslationRequest):
    try:
        logger.info(f"Received translation request. From: {request.source_lang}, To: {request.target_lang}, Text length: {len(request.text)}")
        
        # Validate input length
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="No text provided for translation")
            
        if len(request.text) > 10000:  # Limit to 10,000 characters
            raise HTTPException(status_code=400, detail="Text too long. Maximum 10,000 characters allowed.")
        
        # Split text into smaller chunks if it's too long
        max_chunk_size = 500  # Smaller chunks for better reliability
        text_chunks = [request.text[i:i + max_chunk_size] 
                      for i in range(0, len(request.text), max_chunk_size)]
        
        # Translate each chunk
        translated_chunks = []
        for i, chunk in enumerate(text_chunks):
            logger.info(f"Translating chunk {i+1}/{len(text_chunks)} (length: {len(chunk)})")
            translated = translate_chunk(chunk, request.source_lang, request.target_lang)
            translated_chunks.append(translated)
        
        # Combine translated chunks
        translated_text = "".join(translated_chunks)
        
        return {
            "original_text": request.text,
            "translated_text": translated_text,
            "source_language": request.source_lang if request.source_lang != 'auto' else "auto-detected",
            "target_language": request.target_lang,
            "chunks_processed": len(text_chunks)
        }
        
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )