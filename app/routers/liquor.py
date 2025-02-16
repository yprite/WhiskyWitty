from fastapi import APIRouter, Path, Query, Body, HTTPException
from typing import List, Optional
from ..models.liquor import Liquor, LiquorCreate, LiquorSummary
from ..database import Database, LIQUOR_COLLECTION, serialize_id
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get(
    "/liquors",
    response_model=List[LiquorSummary],
    summary="주류 목록 조회",
    description="등록된 모든 주류 목록을 조회합니다",
    tags=["liquors"]
)
async def get_liquors(
    after: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
):
    db = Database.get_db()
    query = {}
    
    if after:
        query["updated_at"] = {"$gt": datetime.fromisoformat(after)}
    
    cursor = db[LIQUOR_COLLECTION].find(query).limit(limit)
    return [serialize_id(doc) async for doc in cursor]

@router.get(
    "/liquors/{liquor_id}",
    response_model=Liquor,
    summary="주류 상세 조회",
    description="특정 주류의 상세 정보를 조회합니다",
    tags=["liquors"]
)
async def get_liquor(
    liquor_id: str = Path(..., description="조회할 주류의 ID")
):
    db = Database.get_db()
    liquor = await db[LIQUOR_COLLECTION].find_one({"_id": ObjectId(liquor_id)})
    
    if not liquor:
        raise HTTPException(status_code=404, detail="Liquor not found")
    
    return serialize_id(liquor)

@router.post(
    "/liquors",
    response_model=Liquor,
    summary="주류 추가",
    description="새로운 주류를 추가합니다",
    tags=["liquors"]
)
async def create_liquor(liquor: LiquorCreate):
    db = Database.get_db()
    
    liquor_dict = liquor.dict()
    liquor_dict["created_at"] = datetime.utcnow()
    liquor_dict["updated_at"] = liquor_dict["created_at"]
    liquor_dict["reviews"] = []
    liquor_dict["stores"] = []
    
    result = await db[LIQUOR_COLLECTION].insert_one(liquor_dict)
    created_liquor = await db[LIQUOR_COLLECTION].find_one({"_id": result.inserted_id})
    
    return serialize_id(created_liquor)

@router.delete(
    "/liquors/{liquor_id}",
    summary="주류 삭제",
    description="특정 주류를 삭제합니다",
    tags=["liquors"]
)
async def delete_liquor(
    liquor_id: str = Path(..., description="삭제할 주류의 ID")
):
    db = Database.get_db()
    result = await db[LIQUOR_COLLECTION].delete_one({"_id": ObjectId(liquor_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Liquor not found")
    
    return {"message": "Liquor deleted successfully"}