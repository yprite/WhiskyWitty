from fastapi import APIRouter, HTTPException, Path
from ..models.filter import FilterWord, FilterWordCreate
from ..database import Database, FILTER_COLLECTION, serialize_id
from datetime import datetime
from bson import ObjectId
from typing import List

router = APIRouter()

@router.get(
    "/filters",
    response_model=List[FilterWord],
    summary="필터 단어 목록 조회",
    description="등록된 모든 필터 단어(비속어, 광고성 키워드)를 조회합니다",
    tags=["filters"]
)
async def get_filters():
    db = Database.get_db()
    cursor = db[FILTER_COLLECTION].find()
    return [serialize_id(doc) async for doc in cursor]

@router.post(
    "/filters",
    response_model=FilterWord,
    summary="필터 단어 추가",
    description="새로운 필터 단어를 추가합니다. type은 'profanity' 또는 'ad'여야 합니다.",
    tags=["filters"]
)
async def create_filter(filter_word: FilterWordCreate):
    db = Database.get_db()
    
    # 중복 체크
    existing = await db[FILTER_COLLECTION].find_one({
        "word": filter_word.word,
        "type": filter_word.type
    })
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 단어입니다.")
    
    filter_dict = filter_word.dict()
    filter_dict["created_at"] = datetime.utcnow()
    
    result = await db[FILTER_COLLECTION].insert_one(filter_dict)
    created_filter = await db[FILTER_COLLECTION].find_one({"_id": result.inserted_id})
    return serialize_id(created_filter)

@router.delete(
    "/filters/{filter_id}",
    summary="필터 단어 삭제",
    description="지정된 ID의 필터 단어를 삭제합니다",
    tags=["filters"]
)
async def delete_filter(
    filter_id: str = Path(..., description="삭제할 필터 단어의 ID")
):
    db = Database.get_db()
    result = await db[FILTER_COLLECTION].delete_one({"_id": ObjectId(filter_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Filter word not found")
    return {"message": "Filter word deleted successfully"} 