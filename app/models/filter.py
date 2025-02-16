from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FilterWord(BaseModel):
    """
    필터 단어 모델
    """
    word: str = Field(
        ..., 
        min_length=1, 
        max_length=50,
        description="필터링할 단어"
    )
    type: str = Field(
        ..., 
        pattern='^(profanity|ad)$',
        description="필터 타입 (profanity: 비속어, ad: 광고성 키워드)"
    )
    created_at: Optional[datetime] = Field(
        None,
        description="생성 시간"
    )

class FilterWordCreate(BaseModel):
    """
    필터 단어 생성 모델
    """
    word: str = Field(
        ..., 
        min_length=1, 
        max_length=50,
        description="필터링할 단어"
    )
    type: str = Field(
        ..., 
        pattern='^(profanity|ad)$',
        description="필터 타입 (profanity: 비속어, ad: 광고성 키워드)"
    ) 