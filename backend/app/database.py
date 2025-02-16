from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional
from app.models.liquor import Liquor

# 컬렉션 이름 상수
LIQUOR_COLLECTION = "liquors"
FILTER_COLLECTION = "filters"

class Database:
    client: AsyncIOMotorClient = None
    db_name: str = "liquordb"

    @classmethod
    async def connect_db(cls, mongodb_url: str):
        cls.client = AsyncIOMotorClient(mongodb_url)
        # 데이터베이스 연결 테스트
        await cls.client.admin.command('ping')
        print(f"Connected to MongoDB at {mongodb_url}")

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()

    @classmethod
    def get_db(cls):
        return cls.client[cls.db_name]

    @classmethod
    async def fetch_all_liquors(cls):
        return await cls.db.liquors.find().to_list(1000)

    @classmethod
    async def add_liquor(cls, liquor: Liquor):
        await cls.db.liquors.insert_one(liquor.dict())

# ObjectId를 문자열로 변환하는 헬퍼 함수
def serialize_id(obj):
    if isinstance(obj.get('_id'), ObjectId):
        obj['id'] = str(obj['_id'])
        del obj['_id']
    return obj 