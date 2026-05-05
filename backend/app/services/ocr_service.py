"""OCR service for extracting invoice data from PDF/image files using OpenRouter API."""

import json
import logging
from pathlib import Path
from typing import Any
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os
import time
import base64
import io
import requests

from PIL import Image

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
_executor = ThreadPoolExecutor(max_workers=4)

GEMINI_PROMPT = """Analyze this invoice image and extract the following fields in strict JSON format. 
If a field is missing, set its value to null or 0.0 for numbers.
Do NOT include markdown formatting, just the raw JSON object.

Required JSON schema:
{
  "gstin_supplier": "string",
  "gstin_recipient": "string",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "vendor_name": "string",
  "taxable_amount": float,
  "cgst": float,
  "sgst": float,
  "igst": float,
  "total_gst": float,
  "total_amount": float
}
"""

def _image_to_base64(img: Image.Image) -> str:
    """Convert PIL Image to base64 data URI."""
    buffered = io.BytesIO()
    # Save as JPEG with slight compression to keep payload small
    img.save(buffered, format="JPEG", quality=85)
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def _process_file_sync(file_path: str) -> dict[str, Any]:
    """Synchronous file processing using OpenRouter API."""
    
    # OpenRouter API Key from environment
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY is not configured in .env")
        return {"error": "OPENROUTER_API_KEY missing", "raw_text": "", "fields": {}, "confidence": 0.0}

    path = Path(file_path)
    suffix = path.suffix.lower()
    
    try:
        if suffix == ".pdf":
            from pdf2image import convert_from_path
            images = convert_from_path(str(path), dpi=200, first_page=1, last_page=1)
            if not images:
                raise ValueError("Could not extract image from PDF")
            img = images[0].convert("RGB")
        elif suffix in (".jpg", ".jpeg", ".png", ".tiff", ".bmp"):
            img = Image.open(str(path)).convert("RGB")
            # Resize image if it's too large to save bandwidth
            img.thumbnail((2048, 2048))
        else:
            return {"error": f"Unsupported file type: {suffix}", "raw_text": "", "fields": {}, "confidence": 0.0}
    except Exception as e:
        logger.error(f"Image load failed: {e}")
        return {"error": str(e), "raw_text": "", "fields": {}, "confidence": 0.0}

    base64_image = _image_to_base64(img)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "GST Compass",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "baidu/qianfan-ocr-fast:free",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": GEMINI_PROMPT
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=45
            )
            
            if response.status_code == 429:
                wait_time = 10 * (attempt + 1)
                logger.warning(f"OpenRouter Rate Limit hit. Waiting {wait_time}s before retry {attempt+1}/{max_retries}...")
                time.sleep(wait_time)
                continue
                
            response.raise_for_status()
            
            result_json = response.json()
            text = result_json["choices"][0]["message"]["content"].strip()
            
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            fields = json.loads(text.strip())
            fields["confidence_scores"] = {k: 0.99 for k in fields.keys()}
            
            return {
                "raw_text": text,
                "fields": fields,
                "confidence": 0.99,
            }
            
        except requests.exceptions.RequestException as e:
            error_details = ""
            if hasattr(e, 'response') and e.response is not None:
                error_details = f" - Response: {e.response.text}"
            logger.error(f"OpenRouter API request failed: {e}{error_details}")
            if attempt == max_retries - 1:
                return {"error": f"OpenRouter API error: {str(e)}{error_details}", "raw_text": "", "fields": {}, "confidence": 0.0}
            time.sleep(5)
            
        except (KeyError, json.JSONDecodeError) as e:
            logger.error(f"Failed to parse OpenRouter response: {e}")
            return {"error": f"Parsing error: {str(e)}", "raw_text": "", "fields": {}, "confidence": 0.0}
            
    return {"error": "Max retries exceeded for OpenRouter API", "raw_text": "", "fields": {}, "confidence": 0.0}

async def process_invoice_file(file_path: str) -> dict[str, Any]:
    """Async wrapper — runs OCR in thread pool to avoid blocking."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(_executor, _process_file_sync, file_path)
    return result
