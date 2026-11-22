"""
FastAPI application for recommendation service.
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from contextlib import asynccontextmanager

from src.models import RecommendRequest, RecommendResponse, DaySchedule
from src.recommendation_engine import RecommendationEngine


# Global database client
db_client = None
db = None
engine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    global db_client, db, engine
    
    # Startup: Connect to MongoDB
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    mongodb_db = os.getenv("MONGODB_DB", "places_db")
    
    print(f"Connecting to MongoDB at {mongodb_url}")
    db_client = MongoClient(mongodb_url)
    db = db_client[mongodb_db]
    engine = RecommendationEngine(db)
    print(f"✅ Connected to MongoDB database: {mongodb_db}")
    
    yield
    
    # Shutdown: Close MongoDB connection
    if db_client:
        db_client.close()
        print("MongoDB connection closed")


app = FastAPI(
    title="Places Recommendation API",
    description="API for recommending places to visit in Krakow",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "recommendation-api",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    """Health check with database status."""
    try:
        # Check MongoDB connection
        db.command("ping")
        places_count = db.places.count_documents({})
        
        return {
            "status": "healthy",
            "database": "connected",
            "places_count": places_count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@app.post("/api/recommend", response_model=RecommendResponse)
def get_recommendations(request: RecommendRequest):
    """
    Generate place recommendations based on user preferences.
    
    Args:
        request: Recommendation request with dates, locations, and preferences
        
    Returns:
        RecommendResponse with daily schedule of attractions and restaurants
    """
    try:
        if not engine:
            raise HTTPException(status_code=503, detail="Recommendation engine not initialized")
        
        # Validate days list is not empty
        if not request.days:
            raise HTTPException(
                status_code=400,
                detail="At least one day must be provided"
            )
        
        # Generate recommendations
        schedule = engine.generate_recommendations(
            start_location=request.start_location,
            end_location=request.end_location,
            days=request.days,
            preferred_categories=request.preferred_categories,
            food_preferences=request.food_preferences
        )
        
        # Calculate totals
        total_attractions = sum(day.total_attractions for day in schedule)
        total_meals = sum(day.total_meals for day in schedule)
        
        return RecommendResponse(
            schedule=schedule,
            total_days=len(schedule),
            total_attractions=total_attractions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )


@app.get("/api/categories")
def get_categories():
    """
    Get list of available categories from the database based on geoapify_categories.
    Excludes food-related categories.
    
    Returns:
        List of unique geoapify categories
    """
    try:
        # Get all places that are not food-related
        non_food_places = db.places.find({
            "categories": {"$ne": "food"}
        })
        
        # Collect all unique geoapify_categories
        place_categories = set()
        for place in non_food_places:
            geo_cats = place.get("geoapify_categories", [])
            for cat in geo_cats:
                # Exclude categories starting with "catering" (food-related)
                if not cat.startswith("catering"):
                    place_categories.add(cat)
        
        # Sort categories
        sorted_categories = sorted(list(place_categories))
        
        return {
            "categories": sorted_categories,
            "count": len(sorted_categories)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching categories: {str(e)}"
        )


@app.get("/api/food-categories")
def get_food_categories():
    """
    Get list of available food categories from the database.
    
    Returns:
        List of unique food-related geoapify_categories
    """
    try:
        # Get all places with food category
        food_places = db.places.find({"categories": "food"})
        
        # Collect all unique geoapify_categories
        food_categories = set()
        for place in food_places:
            geo_cats = place.get("geoapify_categories", [])
            for cat in geo_cats:
                if cat.startswith("catering"):
                    food_categories.add(cat)
        
        # Sort categories
        sorted_categories = sorted(list(food_categories))
        
        return {
            "food_categories": sorted_categories,
            "count": len(sorted_categories)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching food categories: {str(e)}"
        )


@app.get("/api/stats")
def get_stats():
    """
    Get statistics about places in the database.
    
    Returns:
        Statistics about places
    """
    try:
        total_places = db.places.count_documents({})
        attractions = db.places.count_documents({"categories": {"$ne": "food"}})
        restaurants = db.places.count_documents({"categories": "food"})
        
        # Get popularity distribution
        popularity_counts = {}
        for doc in db.places.find({"popularity": {"$exists": True}}):
            pop = doc.get("popularity")
            popularity_counts[pop] = popularity_counts.get(pop, 0) + 1
        
        return {
            "total_places": total_places,
            "attractions": attractions,
            "restaurants": restaurants,
            "popularity_distribution": popularity_counts
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching stats: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
