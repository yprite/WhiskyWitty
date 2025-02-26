import pytest
from httpx import AsyncClient
from app.main import app
from app.database import Database, LIQUOR_COLLECTION, FILTER_COLLECTION
from bson import ObjectId

@pytest.fixture
async def test_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture(autouse=True)
async def setup_database():
    # 테스트 데이터베이스 연결
    await Database.connect_db("mongodb://3.36.132.159:27017")
    db = Database.get_db()
    
    # 테스트 전 데이터 초기화
    await db[LIQUOR_COLLECTION].delete_many({})
    await db[FILTER_COLLECTION].delete_many({})
    
    yield
    
    # 테스트 후 데이터 정리
    await db[LIQUOR_COLLECTION].delete_many({})
    await db[FILTER_COLLECTION].delete_many({})

async def test_add_and_get_liquor(test_client):
    # 주류 추가 테스트
    test_liquor = {
        "name": "테스트 위스키",
        "type": "위스키",
        "description": "테스트용 위스키입니다.",
        "rating": 4.5,
        "image": "test.jpg",
        "profile": {
            "smoothness": 4.0,
            "aroma": 4.0,
            "complexity": 4.0,
            "finish": 4.0,
            "balance": 4.0,
            "intensity": 4.0
        }
    }
    
    response = await test_client.post("/api/liquors", json=test_liquor)
    assert response.status_code == 200
    created_liquor = response.json()
    assert created_liquor["name"] == test_liquor["name"]
    
    # 주류 조회 테스트
    liquor_id = created_liquor["id"]
    response = await test_client.get(f"/api/liquors/{liquor_id}")
    assert response.status_code == 200
    assert response.json()["name"] == test_liquor["name"]

async def test_add_and_delete_review(test_client):
    # 주류 생성
    test_liquor = {
        "name": "테스트 위스키",
        "type": "위스키",
        "description": "테스트용 위스키입니다.",
        "rating": 4.5,
        "image": "test.jpg",
        "profile": {
            "smoothness": 4.0,
            "aroma": 4.0,
            "complexity": 4.0,
            "finish": 4.0,
            "balance": 4.0,
            "intensity": 4.0
        }
    }
    
    response = await test_client.post("/api/liquors", json=test_liquor)
    liquor_id = response.json()["id"]
    
    # 리뷰 추가 테스트
    test_review = {"content": "좋은 위스키네요!"}
    response = await test_client.post(f"/api/liquors/{liquor_id}/reviews", json=test_review)
    assert response.status_code == 200
    
    # 리뷰 목록 조회 테스트
    response = await test_client.get(f"/api/liquors/{liquor_id}/reviews")
    assert response.status_code == 200
    reviews = response.json()
    assert len(reviews) == 1
    assert reviews[0] == test_review["content"]
    
    # 리뷰 삭제 테스트
    response = await test_client.delete(f"/api/liquors/{liquor_id}/reviews/0")
    assert response.status_code == 200
    
    # 리뷰 삭제 확인
    response = await test_client.get(f"/api/liquors/{liquor_id}/reviews")
    assert response.status_code == 200
    assert len(response.json()) == 0

async def test_filter_words(test_client):
    # 필터 단어 추가 테스트
    test_words = [
        {"word": "비속어1", "type": "profanity"},
        {"word": "광고", "type": "ad"}
    ]
    
    for word in test_words:
        response = await test_client.post("/api/filters", json=word)
        assert response.status_code == 200
    
    # 필터 단어 목록 조회 테스트
    response = await test_client.get("/api/filters")
    assert response.status_code == 200
    filters = response.json()
    assert len(filters) == 2
    
    # 필터 단어로 리뷰 필터링 테스트
    test_liquor = {
        "name": "테스트 위스키",
        "type": "위스키",
        "description": "테스트용 위스키입니다.",
        "rating": 4.5,
        "image": "test.jpg",
        "profile": {
            "smoothness": 4.0,
            "aroma": 4.0,
            "complexity": 4.0,
            "finish": 4.0,
            "balance": 4.0,
            "intensity": 4.0
        }
    }
    
    response = await test_client.post("/api/liquors", json=test_liquor)
    liquor_id = response.json()["id"]
    
    # 비속어가 포함된 리뷰 테스트
    bad_review = {"content": "비속어1 포함된 리뷰"}
    response = await test_client.post(f"/api/liquors/{liquor_id}/reviews", json=bad_review)
    assert response.status_code == 400
    assert "비속어가 포함되어 있습니다" in response.json()["detail"]
    
    # 광고성 키워드가 포함된 리뷰 테스트
    ad_review = {"content": "광고 포함된 리뷰"}
    response = await test_client.post(f"/api/liquors/{liquor_id}/reviews", json=ad_review)
    assert response.status_code == 400
    assert "광고성 내용이 포함되어 있습니다" in response.json()["detail"]
    
    # 필터 단어 삭제 테스트
    filter_id = filters[0]["id"]
    response = await test_client.delete(f"/api/filters/{filter_id}")
    assert response.status_code == 200
    
    # 삭제 확인
    response = await test_client.get("/api/filters")
    assert response.status_code == 200
    assert len(response.json()) == 1 