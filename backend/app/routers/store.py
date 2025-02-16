from fastapi import APIRouter, Path, Query, Body, HTTPException
from typing import List
from ..models.store import Store, StoreCreate
from ..database import Database, LIQUOR_COLLECTION
from bson import ObjectId

router = APIRouter()

@router.get(
    "/liquors/{liquor_id}/stores",
    response_model=List[Store],
    summary="판매처 목록 조회",
    description="특정 주류의 판매처 목록을 조회합니다",
    tags=["stores"]
)
async def get_stores(
    liquor_id: str = Path(..., description="조회할 주류의 ID"),
    sort: str = Query("price", description="정렬 기준 (price: 가격순, name: 이름순)")
):
    db = Database.get_db()
    
    liquor = await db[LIQUOR_COLLECTION].find_one(
        {"_id": ObjectId(liquor_id)}
    )
    
    if not liquor:
        raise HTTPException(status_code=404, detail="Liquor not found")
        
    stores = liquor.get("stores", [])
    
    # 정렬
    sort_key = {
        "price": lambda x: (x.get("price", 0), x["name"]),
        "name": lambda x: x["name"]
    }.get(sort, lambda x: x.get("price", 0))
    
    stores.sort(key=sort_key)
        
    return stores

@router.post(
    "/liquors/{liquor_id}/stores",
    response_model=Store,
    summary="판매처 추가",
    description="특정 주류에 판매처를 추가합니다",
    tags=["stores"]
)
async def add_store(
    liquor_id: str = Path(..., description="주류의 ID"),
    store: StoreCreate = Body(..., description="추가할 판매처 정보")
):
    db = Database.get_db()
    
    # 판매처 객체 생성
    store_obj = store.dict()
    store_obj["id"] = str(ObjectId())
    
    # 판매처 추가
    result = await db[LIQUOR_COLLECTION].update_one(
        {"_id": ObjectId(liquor_id)},
        {"$push": {"stores": store_obj}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Liquor not found")
    
    return store_obj

@router.delete(
    "/liquors/{liquor_id}/stores/{store_id}",
    summary="판매처 삭제",
    description="특정 주류의 판매처를 삭제합니다",
    tags=["stores"]
)
async def delete_store(
    liquor_id: str = Path(..., description="주류의 ID"),
    store_id: str = Path(..., description="삭제할 판매처의 ID")
):
    db = Database.get_db()
    
    result = await db[LIQUOR_COLLECTION].update_one(
        {"_id": ObjectId(liquor_id)},
        {"$pull": {"stores": {"id": store_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {"message": "Store deleted successfully"} 