from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .review import Review
from .store import Store
from fastapi import Form


class Profile(BaseModel):
    """주류 프로필 모델"""
    smoothness: float = Field(..., ge=0, le=5, description="부드러움 점수 (0-5)")
    aroma: float = Field(..., ge=0, le=5, description="향 점수 (0-5)")
    complexity: float = Field(..., ge=0, le=5, description="복합성 점수 (0-5)")
    finish: float = Field(..., ge=0, le=5, description="피니시 점수 (0-5)")
    balance: float = Field(..., ge=0, le=5, description="밸런스 점수 (0-5)")
    intensity: float = Field(..., ge=0, le=5, description="강도 점수 (0-5)")

class LiquorBase(BaseModel):
    """주류 기본 모델"""
    name: str = Form(..., description="주류 이름")
    type: str = Form(..., description="주류 종류")
    description: str = Form(..., description="설명")
    rating: float = Form(..., ge=0, le=5, description="평점")
    image: bytes = Form(..., description="이미지 바이너리")
    profile: Profile = Form(..., description="주류 프로필")

class LiquorCreate(LiquorBase):
    """주류 생성 모델"""
    pass

class Liquor(LiquorBase):
    """주류 모델"""
    id: str = Field(..., description="주류 ID")
    reviews: List[Review] = Field(default=[], description="리뷰 목록")
    stores: List[Store] = Field(default=[], description="판매처 목록")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class LiquorSummary(BaseModel):
    """주류 요약 모델"""
    id: str
    name: str
    type: str
    rating: float
    image: bytes
    description: str = Field(..., description="주류 설명")