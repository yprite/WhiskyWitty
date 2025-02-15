from fastapi import APIRouter, Path, Query, Body, HTTPException
from typing import List, Optional
from ..models.liquor import Liquor, LiquorCreate, LiquorSummary, Review, ReviewCreate
from ..database import Database, LIQUOR_COLLECTION, serialize_id
from datetime import datetime
from bson import ObjectId
from ..utils.text_filter import validate_review_text

router = APIRouter()

@router.get(
    "/liquors",
    response_model=List[LiquorSummary],
    summary="전체 술 목록 조회",
    description="페이지네이션과 시간 기반 필터링을 지원하는 전체 술 목록 조회 API",
    tags=["liquors"]
)
async def get_liquors(
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(10, ge=1, le=100, description="페이지당 항목 수"),
    sort: Optional[str] = Query(None, description="정렬 기준 (name, created_at)"),
    after: Optional[datetime] = Query(None, description="특정 시간 이후의 데이터만 조회")
):
    skip = (page - 1) * limit
    db = Database.get_db()
    
    # 기본 쿼리
    query = {}
    
    # 시간 필터 추가
    if after:
        query["created_at"] = {"$gt": after}
    
    sort_query = {}
    if sort:
        sort_query = {sort: 1}
        
    cursor = db[LIQUOR_COLLECTION].find(query).skip(skip).limit(limit)
    if sort_query:
        cursor = cursor.sort(list(sort_query.items()))
        
    liquors = [serialize_id(doc) async for doc in cursor]
    return [
        {
            "id": liquor["id"],
            "name": liquor["name"],
            "type": liquor["type"],
            "description": liquor["description"],
            "rating": liquor["rating"],
            "image": liquor["image"]
        }
        for liquor in liquors
    ]

@router.post(
    "/liquors",
    response_model=Liquor,
    summary="새로운 술 정보 등록",
    description="새로운 술 정보를 데이터베이스에 등록합니다",
    tags=["liquors"]
)
async def create_liquor(liquor: LiquorCreate):
    db = Database.get_db()
    
    liquor_dict = liquor.dict()
    liquor_dict["created_at"] = datetime.utcnow()
    liquor_dict["updated_at"] = datetime.utcnow()

    result = await db[LIQUOR_COLLECTION].insert_one(liquor_dict)
    
    created_liquor = await db[LIQUOR_COLLECTION].find_one(
        {"_id": result.inserted_id}
    )
    return serialize_id(created_liquor)

@router.get(
    "/liquors/{liquor_id}",
    response_model=Liquor,
    summary="특정 술 정보 조회",
    description="ID를 통해 특정 술의 상세 정보를 조회합니다",
    tags=["liquors"]
)
async def get_liquor(
    liquor_id: str = Path(..., description="조회할 술의 ID")
):
    db = Database.get_db()
    
    liquor = await db[LIQUOR_COLLECTION].find_one(
        {"_id": ObjectId(liquor_id)}
    )
    
    if not liquor:
        raise HTTPException(status_code=404, detail="Liquor not found")
        
    return serialize_id(liquor)

@router.delete(
    "/liquors",
    summary="모든 술 정보 삭제",
    description="데이터베이스에서 모든 술 정보를 삭제합니다. 이 작업은 되돌릴 수 없습니다.",
    tags=["liquors"]
)
async def delete_all_liquors(confirm: str = Query(..., description="삭제를 확인하려면 'CONFIRM'을 입력하세요")):
    if confirm != "CONFIRM":
        raise HTTPException(status_code=400, detail="삭제를 확인하려면 'CONFIRM'을 입력해야 합니다.")
    
    db = Database.get_db()
    result = await db[LIQUOR_COLLECTION].delete_many({})
    return {"deleted_count": result.deleted_count}

@router.delete(
    "/liquors/{liquor_id}",
    summary="특정 술 정보 삭제",
    description="ID를 통해 특정 술 정보를 삭제합니다",
    tags=["liquors"]
)
async def delete_liquor(
    liquor_id: str = Path(..., description="삭제할 술의 ID")
):
    db = Database.get_db()
    result = await db[LIQUOR_COLLECTION].delete_one({"_id": ObjectId(liquor_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Liquor not found")
    return {"message": "Liquor deleted successfully"}

@router.post(
    "/liquors/{liquor_id}/reviews",
    response_model=dict,
    summary="리뷰 추가",
    description="특정 주류에 대한 리뷰를 추가합니다",
    tags=["reviews"]
)
async def add_review(
    liquor_id: str = Path(..., description="리뷰를 추가할 주류의 ID"),
    review: ReviewCreate = Body(..., description="추가할 리뷰 내용")
):
    # 리뷰 텍스트 검증
    is_valid, error_message = await validate_review_text(review.content)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_message
        )

    db = Database.get_db()
    
    result = await db[LIQUOR_COLLECTION].update_one(
        {"_id": ObjectId(liquor_id)},
        {"$push": {"reviews": review.content}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Liquor not found")
    
    return {"message": "Review added successfully"}

@router.get(
    "/liquors/{liquor_id}/reviews",
    response_model=List[Review],
    summary="리뷰 목록 조회",
    description="특정 주류의 리뷰 목록을 조회합니다",
    tags=["reviews"]
)
async def get_reviews(
    liquor_id: str = Path(..., description="조회할 주류의 ID")
):
    db = Database.get_db()
    
    liquor = await db[LIQUOR_COLLECTION].find_one(
        {"_id": ObjectId(liquor_id)}
    )
    
    if not liquor:
        raise HTTPException(status_code=404, detail="Liquor not found")
        
    return liquor.get("reviews", [])

@router.delete(
    "/liquors/{liquor_id}/reviews/{review_index}",
    summary="리뷰 삭제",
    description="특정 주류의 특정 리뷰를 삭제합니다",
    tags=["reviews"]
)
async def delete_review(
    liquor_id: str = Path(..., description="주류의 ID"),
    review_index: int = Path(..., ge=0, description="삭제할 리뷰의 인덱스")
):
    db = Database.get_db()
    
    # 먼저 주류와 리뷰가 존재하는지 확인
    liquor = await db[LIQUOR_COLLECTION].find_one({"_id": ObjectId(liquor_id)})
    if not liquor:
        raise HTTPException(status_code=404, detail="주류를 찾을 수 없습니다")
        
    reviews = liquor.get("reviews", [])
    if review_index >= len(reviews):
        raise HTTPException(status_code=404, detail="리뷰를 찾을 수 없습니다")
    
    # 배열에서 특정 인덱스의 리뷰 삭제
    result = await db[LIQUOR_COLLECTION].update_one(
        {"_id": ObjectId(liquor_id)},
        {"$unset": {f"reviews.{review_index}": 1}}
    )
    
    # null 값이 된 요소들 제거
    await db[LIQUOR_COLLECTION].update_one(
        {"_id": ObjectId(liquor_id)},
        {"$pull": {"reviews": None}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="리뷰 삭제에 실패했습니다")
    
    return {"message": "리뷰가 삭제되었습니다"}