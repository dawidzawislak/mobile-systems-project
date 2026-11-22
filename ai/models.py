"""
Pydantic models for AI prediction service.
"""
from pydantic import BaseModel, Field
from typing import List


class PredictionRequest(BaseModel):
    """Request model for category prediction."""
    user_input: str = Field(
        ...,
        description="Natural language description of user preferences",
        min_length=1,
        max_length=1000
    )


class PredictionResponse(BaseModel):
    """Response model for category prediction."""
    categories: List[str] = Field(
        default_factory=list,
        description="List of predicted place category codes"
    )
    food_categories: List[str] = Field(
        default_factory=list,
        description="List of predicted food category codes"
    )
