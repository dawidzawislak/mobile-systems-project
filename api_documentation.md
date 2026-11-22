# Recommendation System - Setup Instructions

## Quick Start

### 1. Build and Start Services

```bash
docker-compose up --build
```

This will start three services:
- **MongoDB** (port 27017): Database for places
- **Recommender** (port 8001): Recommendation engine API
- **API** (port 8000): Main backend API (proxy)

### 2. Initialize Database

After services are running, initialize MongoDB with places data:

```bash
docker exec -it recommender python src/init_db.py
```

This will:
- Load all places from `krakow_places_enriched.json`
- Create geospatial and category indexes
- Display statistics

### 3. Test the API

Health check:
```bash
curl http://localhost:8000/
```

Get categories:
```bash
curl http://localhost:8000/api/categories
```

Get food categories:
```bash
curl http://localhost:8000/api/food-categories
```

Get statistics:
```bash
curl http://localhost:8000/api/stats
```
```bash
curl http://localhost:8000/api/stats
```

Example recommendation request:
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "start_location": {"lat": 50.0647, "lng": 19.9450},
    "end_location": {"lat": 50.0647, "lng": 19.9450},
    "preferred_categories": ["history", "architecture"],
    "food_preferences": ["catering.restaurant.italian", "catering.cafe"],
    "days": [
      {
        "date": "2026-01-15",
        "start_time": "09:00",
        "end_time": "21:00",
        "meals": ["breakfast", "lunch", "dinner"]
      },
      {
        "date": "2026-01-16",
        "start_time": "10:00",
        "end_time": "18:00",
        "meals": ["lunch", "dinner"]
      }
    ]
  }'
```

## Services

### Recommender Service (port 8001)

Direct access to recommendation engine:

- `GET /` - Health check
- `GET /health` - Health with database status
- `POST /api/recommend` - Generate recommendations
- `GET /api/categories` - List available categories
- `GET /api/food-categories` - List available food categories
- `GET /api/stats` - Database statistics

### Main API (port 8000)

Main backend that proxies to recommender:

- `GET /` - Health check
- `POST /api/recommend` - Get recommendations (proxied)
- `GET /api/categories` - Get categories (proxied)
- `GET /api/food-categories` - Get food categories (proxied)
- `GET /api/stats` - Get stats (proxied)

## Request Format

### POST /api/recommend

```json
{
  "start_location": {
    "lat": 50.0647,
    "lng": 19.9450
  },
  "end_location": {
    "lat": 50.0647,
    "lng": 19.9450
  },
  "preferred_categories": ["history", "architecture", "art"],
  "food_preferences": [
    "catering.restaurant.italian",
    "catering.restaurant.regional",
    "catering.cafe"
  ],
  "days": [
    {
      "date": "2026-01-15",
      "start_time": "09:00",
      "end_time": "21:00",
      "meals": ["breakfast", "lunch", "dinner"]
    },
    {
      "date": "2026-01-16",
      "start_time": "10:00",
      "end_time": "18:00",
      "meals": ["lunch", "dinner"]
    },
    {
      "date": "2026-01-17",
      "start_time": "09:30",
      "end_time": "20:00",
      "meals": ["breakfast", "lunch", "supper"]
    }
  ]
}
```

**Parameters:**
- `start_location`, `end_location`: Starting and ending coordinates for route planning
- `preferred_categories`: List of place categories to prioritize (e.g., "history", "architecture")
- `food_preferences`: List of food venue types from geoapify_categories (e.g., "catering.restaurant.italian")
- `days`: Array of daily schedules, each containing:
  - `date`: Date in YYYY-MM-DD format
  - `start_time`: Start of trip in HH:MM format (e.g., "09:00")
  - `end_time`: End of trip in HH:MM format (e.g., "21:00")
  - `meals`: Array of meal types for the day, valid values: `["breakfast", "lunch", "dinner", "supper"]`

**Meal Time Windows:**
Meals are scheduled within these time windows (validated and adjusted to fit within each day's start/end times):
- `breakfast`: 08:00 - 10:00
- `lunch`: 12:00 - 14:00
- `dinner`: 16:00 - 18:00
- `supper`: 20:00 - 22:00

### Response Format

```json
{
  "schedule": [
    {
      "date": "2026-01-15",
      "timeline": [
        {
          "item_type": "attraction",
          "scheduled_time": "09:00",
          "end_time": "10:45",
          "place": {
            "id": "place_id",
            "name": "Wawel Castle",
            "location": {"lat": 50.0543, "lng": 19.9356},
            "category": ["history", "architecture"],
            "popularity": 10,
            "visit_duration_min": 105,
            "distance_km": 1.2,
            "opening_hours": "Mo-Su 09:00-17:00",
            "travel_time_min": 18,
            "formatted_address": "Wawel 5, 31-001 Kraków",
            "geoapify_categories": ["tourism.attraction"],
            "price_level": 2
          },
          "restaurant": null
        },
        {
          "item_type": "meal",
          "scheduled_time": "13:00",
          "end_time": "14:15",
          "place": null,
          "restaurant": {
            "id": "restaurant_id",
            "name": "Restaurant Name",
            "location": {"lat": 50.0647, "lng": 19.9450},
            "category": ["food"],
            "geoapify_categories": ["catering.restaurant.regional"],
            "popularity": 7,
            "visit_duration_min": 75,
            "distance_km": 0.5,
            "opening_hours": "Mo-Su 12:00-22:00",
            "travel_time_min": 8,
            "formatted_address": "Main Square 10, Kraków",
            "price_level": 2,
            "meal_type": "lunch"
          }
        }
      ],
      "total_attractions": 5,
      "total_meals": 3
    }
  ],
  "total_days": 3,
  "total_attractions": 15
}
```

## Algorithm Details

### Scoring Formula

Places are scored based on:

**Preferred Categories:**
```
score = 10 + (popularity * 2) - (distance_km * 1)
```

**Other Categories (Fallback):**
```
score = (popularity * 3) - (distance_km * 1)
```

**Restaurant Scoring:**
```
base_score = (popularity * 2) - (distance_km * 1)
+ 8 points if matches user's food_preferences
+ 3 points if matches meal type defaults:
  - breakfast: cafes
  - lunch: cafes & restaurants
  - dinner: restaurants
  - supper: restaurants & pubs
```

### Time Allocation

- **Walking Speed:** 15 minutes per kilometer
- **Visit Time:** Parsed from `avg_visit_time` field (e.g., "60-90 min" → 75 min)
- **Meal Time:** ~90 minutes per meal
- **Meal Time Windows:**
  - Breakfast: 08:00 - 10:00
  - Lunch: 12:00 - 14:00
  - Dinner: 16:00 - 18:00
  - Supper: 20:00 - 22:00
- **Daily Hours:** User-defined per day (e.g., "09:00" to "21:00")
- **Meal Validation:** Meals are validated to fit within day boundaries and time windows (minimum 30 minutes required)

### Features

- ✅ Chronological timeline with interleaved attractions and meals
- ✅ Scheduled times for each activity (HH:MM format)
- ✅ Geospatial filtering by distance
- ✅ Opening hours validation
- ✅ No duplicate places across days
- ✅ Category preference matching
- ✅ Food preference filtering with smart defaults:
  - Breakfast → prefers cafes
  - Lunch → balanced between cafes and restaurants
  - Dinner → prefers restaurants
  - Supper → prefers restaurants and pubs
  - User preferences always take priority
- ✅ Popularity + distance balancing
- ✅ Smart meal placement at preferred times
- ✅ Dynamic travel time calculation
- ✅ Time-aware scheduling (attractions fit before meals)

## Development

### Run Recommender Service Locally

```bash
cd recommender
pip install -r requirements.txt
export MONGODB_URL=mongodb://localhost:27017
export MONGODB_DB=places_db
python src/init_db.py  # First time only
uvicorn main:app --reload --port 8001
```

### Run Main API Locally

```bash
cd api
pip install -r ../requirements.txt
export RECOMMENDER_URL=http://localhost:8001
uvicorn api.main:app --reload --port 8000
```

## Troubleshooting

**MongoDB not initialized:**
```bash
docker exec -it recommender python src/init_db.py
```

**View logs:**
```bash
docker logs mongodb
docker logs recommender
docker logs fastapi_app
```

**Rebuild services:**
```bash
docker-compose down
docker-compose up --build
```
