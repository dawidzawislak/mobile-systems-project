"""
FastAPI application for AI category prediction service.
"""
import os
import json
from typing import List, Tuple
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv

from models import PredictionRequest, PredictionResponse

load_dotenv()

app = FastAPI(
    title="AI Category Prediction API",
    description="API for predicting travel categories from natural language using LLM",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Environment variables
AI_URL = os.getenv("AI_URL", "https://api.openai.com/v1").strip().rstrip("/")
AI_KEY = os.getenv("AI_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", "gpt-4.1-mini").strip()

# Structured output schema for the Responses API (strict mode:
# every property required, additionalProperties false).
PREDICTION_SCHEMA = {
    "type": "object",
    "properties": {
        "categories": {"type": "array", "items": {"type": "string"}},
        "food_categories": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["categories", "food_categories"],
    "additionalProperties": False,
}


def auth_headers() -> dict:
    return {"Authorization": f"Bearer {AI_KEY}"}
RECOMMENDER_URL = os.getenv("RECOMMENDER_URL", "http://localhost:8001")


async def fetch_categories() -> Tuple[List[str], List[str]]:
    """
    Fetch categories and food categories from recommender service.
    Applies the same filtering as the frontend.
    
    Returns:
        Tuple of (place_categories, food_categories)
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Fetch place categories
            place_response = await client.get(f"{RECOMMENDER_URL}/api/categories")
            place_response.raise_for_status()
            place_data = place_response.json()
            
            # Filter out unwanted categories (same as frontend)
            filtered_categories = [
                cat for cat in place_data.get("categories", [])
                if not (
                    cat.startswith("wheelchair") or
                    cat.startswith("no_fee") or
                    cat.startswith("no_access") or
                    cat.startswith("fee") or
                    cat.startswith("access") or
                    cat.startswith("access_limited")
                )
            ]
            
            # Fetch food categories
            food_response = await client.get(f"{RECOMMENDER_URL}/api/food-categories")
            food_response.raise_for_status()
            food_data = food_response.json()
            food_categories = food_data.get("food_categories", [])
            
            return filtered_categories, food_categories
            
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to fetch categories from recommender service: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching categories: {str(e)}"
            )


def build_prompt(user_input: str, place_categories: List[str], food_categories: List[str]) -> str:
    """
    Build few-shot prompt for category prediction.
    
    Args:
        user_input: User's natural language input
        place_categories: List of valid place category codes
        food_categories: List of valid food category codes
        
    Returns:
        Formatted prompt string
    """
    prompt = f"""You are a travel preference classifier. Given a user's natural language input about what they want to see/do, classify it into relevant Geoapify categories.

AVAILABLE PLACE CATEGORIES:
{', '.join(place_categories[:100])}

AVAILABLE FOOD CATEGORIES:
{', '.join(food_categories)}

IMPORTANT RULES:
- Categories use dot notation (e.g., tourism.attraction, catering.restaurant.thai)
- ALL food and drink establishments (restaurants, cafes, bars, pubs, etc.) belong in "food_categories", NOT "categories"
- When user mentions places, sports and other activities - these are ALWAYS in categories (e.g., leisure.park, entertainment.museum)
- When user mentions bars, pubs, cafes, restaurants - these are ALWAYS in food_categories (e.g., catering.bar, catering.pub, catering.cafe)
- Only use categories that exist in the lists above
- Output ONLY valid JSON with two arrays: "categories" for places and "food_categories" for food/drink

EXAMPLES:

Input: "I want to visit historical churches and cathedrals"
Output: {{"categories": ["tourism.sights.place_of_worship.cathedral", "tourism.sights.place_of_worship.church", "building.historic", "religion.place_of_worship.christianity"], "food_categories": []}}

Input: "Looking for museums and art galleries"
Output: {{"categories": ["entertainment.museum", "tourism.attraction", "tourism.sights"], "food_categories": []}}

Input: "I love parks and botanical gardens"
Output: {{"categories": ["leisure.park", "leisure.park.garden", "leisure.park.nature_reserve"], "food_categories": []}}

Input: "Thai food and cozy cafes"
Output: {{"categories": [], "food_categories": ["catering.restaurant.thai", "catering.cafe", "catering.cafe.coffee_shop"]}}

Input: "Traditional Polish restaurants"
Output: {{"categories": [], "food_categories": ["catering.restaurant.regional", "catering.restaurant"]}}

Input: "I'd like to visit nightclubs and bars"
Output: {{"categories": ["adult.nightclub"], "food_categories": ["catering.bar", "catering.pub"]}}

Input: "Fast food and casual dining"
Output: {{"categories": [], "food_categories": ["catering.fast_food", "catering.restaurant"]}}

Now classify:
Input: "{user_input}"
Output:"""
    
    return prompt


async def call_ai(prompt: str) -> dict:
    """
    Call the OpenAI Responses API (POST {AI_URL}/responses) for prediction.

    Args:
        prompt: The prompt to send to the model

    Returns:
        Parsed JSON response from the model
    """
    if not AI_KEY:
        raise HTTPException(status_code=500, detail="AI_KEY is not set")

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{AI_URL}/responses",
                headers=auth_headers(),
                json={
                    "model": AI_MODEL,
                    "input": prompt,
                    "temperature": 0,
                    "max_output_tokens": 500,
                    "text": {
                        "format": {
                            "type": "json_schema",
                            "name": "category_prediction",
                            "schema": PREDICTION_SCHEMA,
                            "strict": True
                        }
                    }
                }
            )
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail=f"AI API error {response.status_code}: {response.text}"
                )
            data = response.json()

            # Generated text lives in output[type=message].content[type=output_text].text
            response_text = "".join(
                part.get("text", "")
                for item in data.get("output", [])
                if item.get("type") == "message"
                for part in item.get("content", [])
                if part.get("type") == "output_text"
            )
            parsed = json.loads(response_text)

            return parsed

        except HTTPException:
            raise
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to connect to AI service: {str(e)}"
            )
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse model response as JSON: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error during prediction: {str(e)}"
            )


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "ai-prediction-api",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check with service dependencies."""
    try:
        # Check AI API (key + reachability) and recommender
        async with httpx.AsyncClient(timeout=5.0) as client:
            ai_response = await client.get(f"{AI_URL}/models/{AI_MODEL}", headers=auth_headers())
            ai_status = "connected" if ai_response.status_code == 200 else f"disconnected ({ai_response.status_code})"
            recommender_response = await client.get(f"{RECOMMENDER_URL}/health")
            recommender_status = "connected" if recommender_response.status_code == 200 else "disconnected"
        return {
            "status": "healthy" if ai_status == "connected" and recommender_status == "connected" else "degraded",
            "ai": ai_status,
            "model": AI_MODEL,
            "recommender": recommender_status
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.post("/predict", response_model=PredictionResponse)
async def predict_categories(request: PredictionRequest):
    """
    Predict categories from natural language input.
    
    Args:
        request: Prediction request with user input
        
    Returns:
        PredictionResponse with predicted categories
    """
    try:
        # Fetch available categories
        place_categories, food_categories = await fetch_categories()
        
        # Build prompt
        prompt = build_prompt(request.user_input, place_categories, food_categories)
        
        # Call the LLM for prediction
        prediction = await call_ai(prompt)

        # Extract and validate categories
        predicted_places = prediction.get("categories", [])
        predicted_food = prediction.get("food_categories", [])

        # Filter to only valid categories, dropping duplicates
        valid_places = list(dict.fromkeys(cat for cat in predicted_places if cat in place_categories))
        valid_food = list(dict.fromkeys(cat for cat in predicted_food if cat in food_categories))
        
        return PredictionResponse(
            categories=valid_places,
            food_categories=valid_food
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during prediction: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
