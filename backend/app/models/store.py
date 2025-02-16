from pydantic import BaseModel, Field
from typing import Optional

class StoreBase(BaseModel):
    """판매처 기본 모델"""
    name: str = Field(..., description="판매처 이름")
    address: Optional[str] = Field(None, description="판매처 주소")
    contact: Optional[str] = Field(None, description="연락처")
    price: int = Field(..., ge=0, description="판매 가격")

class StoreCreate(StoreBase):
    """판매처 생성 모델"""
    pass

class Store(StoreBase):
    """판매처 모델"""
    id: str = Field(..., description="판매처 ID") 