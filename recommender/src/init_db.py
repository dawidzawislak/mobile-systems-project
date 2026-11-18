"""
Initialize MongoDB with places data from JSON file.
"""
import json
import os
from pymongo import MongoClient, GEOSPHERE, ASCENDING

def init_database():
    """Load places data into MongoDB and create indexes."""
    
    # Connect to MongoDB
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    mongodb_db = os.getenv("MONGODB_DB", "places_db")
    
    client = MongoClient(mongodb_url)
    db = client[mongodb_db]
    
    # Drop existing collection to start fresh
    db.places.drop()
    
    print(f"Loading data from krakow_places_enriched.json...")
    
    # Load JSON data
    with open("data/krakow_places_enriched.json", "r", encoding="utf-8") as f:
        places_data = json.load(f)
    
    print(f"Found {len(places_data)} places")
    
    # Transform data to include GeoJSON location for geospatial queries
    for place in places_data:
        if place.get("lat") and place.get("lng"):
            place["location"] = {
                "type": "Point",
                "coordinates": [place["lng"], place["lat"]]  # MongoDB uses [longitude, latitude]
            }
    
    # Insert data
    if places_data:
        result = db.places.insert_many(places_data)
        print(f"Inserted {len(result.inserted_ids)} places into MongoDB")
    
    # Create indexes
    print("Creating indexes...")
    
    # Geospatial index for location-based queries
    db.places.create_index([("location", GEOSPHERE)])
    print("✓ Created 2dsphere index on location")
    
    # Index on categories for filtering
    db.places.create_index([("categories", ASCENDING)])
    print("✓ Created index on categories")
    
    # Index on geoapify_categories for food filtering
    db.places.create_index([("geoapify_categories", ASCENDING)])
    print("✓ Created index on geoapify_categories")
    
    # Compound index for category and opening hours
    db.places.create_index([
        ("categories", ASCENDING),
        ("opening_hours", ASCENDING)
    ])
    print("✓ Created compound index on categories and opening_hours")
    
    print(f"\n✅ Database initialization complete!")
    print(f"   Database: {mongodb_db}")
    print(f"   Collection: places")
    print(f"   Documents: {db.places.count_documents({})}")
    
    client.close()

if __name__ == "__main__":
    init_database()
