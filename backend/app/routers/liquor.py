from fastapi import APIRouter, Path, Query, Body, HTTPException, File, UploadFile
from typing import List, Optional
from ..models.liquor import Liquor, LiquorCreate, LiquorSummary
from ..database import Database, LIQUOR_COLLECTION, serialize_id
from datetime import datetime, timezone
from dateutil import parser  # 날짜 파싱을 위한 라이브러리 추가
from bson import ObjectId
from fastapi import Form
import base64
import json


router = APIRouter()

@router.get(
    "/liquors",
    response_model=List[LiquorSummary],
    summary="주류 목록 조회",
    description="등록된 모든 주류 목록을 조회합니다",
    tags=["liquors"],
)
async def get_liquors(
    after: Optional[str] = None, limit: int = Query(20, ge=1, le=100)
):
    db = Database.get_db()
    query = {}

    if after:
        try:
            query["updated_at"] = {"$gt": parser.parse(after)}
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid date format: {str(e)}"
            )

    cursor = db[LIQUOR_COLLECTION].find(query).limit(limit)
    return [
        {
            **serialize_id(doc),
            "image": base64.b64encode(doc["image"]).decode("utf-8") if doc["image"] else None,
            "profile": json.loads(doc["profile"]),
        }
        async for doc in cursor
    ]


@router.get(
    "/liquors/{liquor_id}",
    response_model=Liquor,
    summary="주류 상세 조회",
    description="특정 주류의 상세 정보를 조회합니다",
    tags=["liquors"],
)
async def get_liquor(liquor_id: str = Path(..., description="조회할 주류의 ID")):
    db = Database.get_db()
    liquor = await db[LIQUOR_COLLECTION].find_one({"_id": ObjectId(liquor_id)})

    if not liquor:
        raise HTTPException(status_code=404, detail="Liquor not found")
    
    liquor["image"] = base64.b64encode(liquor["image"]).decode("utf-8") if liquor["image"] else None
    liquor["profile"] = json.loads(liquor["profile"])

    return serialize_id(liquor)


@router.post(
    "/liquors",
    response_model=Liquor,
    summary="주류 추가",
    description="새로운 주류를 추가합니다",
    tags=["liquors"],
)
async def create_liquor(
    name: str = Form(...),
    type: str = Form(...),
    description: str = Form(...),
    rating: float = Form(...),
    profile: str = Form(...),  # JSON 문자열로 전송된다고 가정
    image: Optional[UploadFile] = File(None),
):
    db = Database.get_db()

    liquor_dict = {
        "name": name,
        "type": type,
        "description": description,
        "rating": rating,
        "profile": profile,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "reviews": [],
        "stores": [],
    }

    # 이미지 저장
    if image:
        liquor_dict["image"] = await image.read()
    else:
        liquor_dict["image"] = None

    result = await db[LIQUOR_COLLECTION].insert_one(liquor_dict)
    created_liquor = await db[LIQUOR_COLLECTION].find_one({"_id": result.inserted_id})

    return serialize_id(created_liquor)


@router.delete(
    "/liquors/{liquor_id}",
    summary="주류 삭제",
    description="특정 주류를 삭제합니다",
    tags=["liquors"],
)
async def delete_liquor(liquor_id: str = Path(..., description="삭제할 주류의 ID")):
    db = Database.get_db()
    result = await db[LIQUOR_COLLECTION].delete_one({"_id": ObjectId(liquor_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Liquor not found")

    return {"message": "Liquor deleted successfully"}
