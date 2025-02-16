from fastapi import APIRouter, Path, Query, Body, HTTPException
from typing import List
from ..models.review import Review, ReviewCreate
from ..database import Database, LIQUOR_COLLECTION
from datetime import datetime
from bson import ObjectId
from ..utils.text_filter import validate_review_text

router = APIRouter()

@router.get(
    "/liquors/{liquor_id}/reviews",
    response_model=List[Review],
    summary="리뷰 목록 조회",
    description="특정 주류의 리뷰 목록을 조회합니다",
    tags=["reviews"]
)
async def get_reviews(
    liquor_id: str = Path(..., description="조회할 주류의 ID"),
    sort: str = Query("updated_at", description="정렬 기준 (updated_at: 최신순, likes: 인기순)")
):
    db = Database.get_db()
    
    liquor = await db[LIQUOR_COLLECTION].find_one(
        {"_id": ObjectId(liquor_id)}
    )
    
    if not liquor:
        raise HTTPException(status_code=404, detail="Liquor not found")
        
    reviews = liquor.get("reviews", [])
    
    # likes 필드가 없는 리뷰에 대해 기본값 0 설정
    for review in reviews:
        if "likes" not in review:
            review["likes"] = 0
    
    # 정렬
    sort_key = {
        "updated_at": lambda x: x["updated_at"],
        "likes": lambda x: (x.get("likes", 0), x["updated_at"])  # 좋아요 수가 없으면 0으로 처리
    }.get(sort, lambda x: x["updated_at"])
    
    reviews.sort(key=sort_key, reverse=True)
        
    return reviews

@router.post(
    "/liquors/{liquor_id}/reviews",
    response_model=Review,
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
    
    # 리뷰 객체 생성
    review_obj = {
        "id": str(ObjectId()),
        "content": review.content,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "likes": 0
    }
    
    # 리뷰 추가
    result = await db[LIQUOR_COLLECTION].update_one(
        {"_id": ObjectId(liquor_id)},
        {"$push": {"reviews": review_obj}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Liquor not found")
    
    return review_obj

@router.put(
    "/liquors/{liquor_id}/reviews/{review_id}",
    response_model=Review,
    summary="리뷰 수정",
    description="특정 리뷰를 수정합니다",
    tags=["reviews"]
)
async def update_review(
    liquor_id: str = Path(..., description="주류의 ID"),
    review_id: str = Path(..., description="수정할 리뷰의 ID"),
    review: ReviewCreate = Body(..., description="수정할 리뷰 내용")
):
    # 리뷰 텍스트 검증
    is_valid, error_message = await validate_review_text(review.content)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_message
        )

    db = Database.get_db()
    
    # 리뷰 수정
    result = await db[LIQUOR_COLLECTION].update_one(
        {
            "_id": ObjectId(liquor_id),
            "reviews.id": review_id
        },
        {
            "$set": {
                "reviews.$.content": review.content,
                "reviews.$.updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # 업데이트된 리뷰 조회
    liquor = await db[LIQUOR_COLLECTION].find_one(
        {"_id": ObjectId(liquor_id)}
    )
    
    updated_review = next(
        (r for r in liquor["reviews"] if r["id"] == review_id),
        None
    )
    
    return updated_review

@router.post(
    "/liquors/{liquor_id}/reviews/{review_id}/like",
    response_model=Review,
    summary="리뷰 좋아요",
    description="특정 리뷰에 좋아요를 추가합니다",
    tags=["reviews"]
)
async def like_review(
    liquor_id: str = Path(..., description="주류의 ID"),
    review_id: str = Path(..., description="좋아요할 리뷰의 ID")
):
    db = Database.get_db()
    
    # 리뷰의 좋아요 수 증가
    result = await db[LIQUOR_COLLECTION].update_one(
        {
            "_id": ObjectId(liquor_id),
            "reviews.id": review_id
        },
        {
            "$inc": {"reviews.$.likes": 1}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # 업데이트된 리뷰 조회
    liquor = await db[LIQUOR_COLLECTION].find_one(
        {"_id": ObjectId(liquor_id)}
    )
    
    updated_review = next(
        (r for r in liquor["reviews"] if r["id"] == review_id),
        None
    )
    
    return updated_review

@router.delete(
    "/liquors/{liquor_id}/reviews/{review_id}",
    summary="리뷰 삭제",
    description="특정 리뷰를 삭제합니다",
    tags=["reviews"]
)
async def delete_review(
    liquor_id: str = Path(..., description="주류의 ID"),
    review_id: str = Path(..., description="삭제할 리뷰의 ID")
):
    db = Database.get_db()
    
    result = await db[LIQUOR_COLLECTION].update_one(
        {"_id": ObjectId(liquor_id)},
        {"$pull": {"reviews": {"id": review_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review deleted successfully"} 