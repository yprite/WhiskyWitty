from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class Profile(BaseModel):
    smoothness: float = Field(..., ge=0, le=5, description="부드러움 점수 (0-5)")
    aroma: float = Field(..., ge=0, le=5, description="향 점수 (0-5)")
    complexity: float = Field(..., ge=0, le=5, description="복합성 점수 (0-5)")
    finish: float = Field(..., ge=0, le=5, description="피니시 점수 (0-5)")
    balance: float = Field(..., ge=0, le=5, description="밸런스 점수 (0-5)")
    intensity: float = Field(..., ge=0, le=5, description="강도 점수 (0-5)")

class Review(BaseModel):
    id: str = Field(..., description="리뷰 ID")
    content: str = Field(..., description="리뷰 내용")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    likes: int = Field(default=0, description="좋아요 수")

class ReviewCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class Store(BaseModel):
    id: str
    name: str
    address: str
    contact: Optional[str]
    price: int

class StoreCreate(BaseModel):
    name: str
    address: Optional[str] = None
    contact: Optional[str] = None
    price: int = Field(..., ge=0, description="판매 가격")

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
    reviews: List[Review] = []
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