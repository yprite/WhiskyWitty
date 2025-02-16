from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ReviewBase(BaseModel):
    """리뷰 기본 모델"""
    content: str = Field(..., min_length=1, max_length=500, description="리뷰 내용")

class ReviewCreate(ReviewBase):
    """리뷰 생성 모델"""
    pass

class Review(ReviewBase):
    """리뷰 모델"""
    id: str = Field(..., description="리뷰 ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    likes: int = Field(default=0, description="좋아요 수") 