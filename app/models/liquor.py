from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Profile(BaseModel):
    smoothness: float = Field(..., ge=0, le=5, description="부드러움 점수 (0-5)")
    aroma: float = Field(..., ge=0, le=5, description="향 점수 (0-5)")
    complexity: float = Field(..., ge=0, le=5, description="복합성 점수 (0-5)")
    finish: float = Field(..., ge=0, le=5, description="피니시 점수 (0-5)")
    balance: float = Field(..., ge=0, le=5, description="밸런스 점수 (0-5)")
    intensity: float = Field(..., ge=0, le=5, description="강도 점수 (0-5)")

class Review(BaseModel):
    content: str = Field(..., max_length=200)

class ReviewCreate(BaseModel):
    content: str = Field(..., max_length=200)

class Store(BaseModel):
    id: str
    name: str
    address: str
    contact: Optional[str]

class LiquorBase(BaseModel):
    name: str
    type: str
    description: str
    rating: float
    image: str
    profile: Profile

class LiquorCreate(LiquorBase):
    pass

class Liquor(LiquorBase):
    id: str
    reviews: List[str] = []
    stores: List[Store] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class LiquorSummary(BaseModel):
    id: str
    name: str
    type: str
    description: str
    rating: float
    image: str