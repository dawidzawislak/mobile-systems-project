from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI(
    title="LOCAL ROUTE API"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get recommender service URL from environment
RECOMMENDER_URL = os.getenv("RECOMMENDER_URL", "http://localhost:8001")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8002")

@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/api/recommend")
async def get_recommendations(request: dict):
    """
    Proxy endpoint to recommender service.
    Forwards recommendation requests to the recommender microservice.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{RECOMMENDER_URL}/api/recommend",
                json=request
            )
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Recommender service error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to recommender service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing recommendation: {str(e)}"
        )


@app.get("/api/categories")
async def get_categories():
    """
    Get available place categories from recommender service.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{RECOMMENDER_URL}/api/categories")
            response.raise_for_status()
            return response.json()
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to recommender service: {str(e)}"
        )


@app.get("/api/food-categories")
async def get_food_categories():
    """
    Get available food categories from recommender service.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{RECOMMENDER_URL}/api/food-categories")
            response.raise_for_status()
            return response.json()
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to recommender service: {str(e)}"
        )


@app.get("/api/stats")
async def get_stats():
    """
    Get statistics about places from recommender service.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{RECOMMENDER_URL}/api/stats")
            response.raise_for_status()
            return response.json()
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to recommender service: {str(e)}"
        )


@app.post("/api/predict-preferences")
async def predict_preferences(request: dict):
    """
    Proxy endpoint to AI prediction service.
    Forwards prediction requests to the AI microservice.
    """
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/predict",
                json=request
            )
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"AI service error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to AI service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing prediction: {str(e)}"
        )
