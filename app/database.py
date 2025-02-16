from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Optional
from app.models.liquor import Liquor

# 컬렉션 이름 상수
LIQUOR_COLLECTION = "liquors"
FILTER_COLLECTION = "filters"

class Database:
    client = None

    @staticmethod
    async def connect_db(uri: str):
        Database.client = AsyncIOMotorClient(uri)
        print("Connected to MongoDB")

    @staticmethod
    async def close_db():
        if Database.client:
            Database.client.close()
            print("Disconnected from MongoDB")

    @staticmethod
    def get_db():
        if Database.client is None:
            raise ConnectionError("Database is not connected")
        return Database.client.get_database()

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