from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.routers import liquor, review, store, filter
from .database import Database
import os
import logging
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

app = FastAPI(
    title="주류 리뷰 API",
    description="주류 정보 관리와 리뷰 시스템을 위한 API",
    version="1.0.0",
    openapi_url="/api/openapi.json",  # OpenAPI 스키마 경로 추가
    docs_url="/api/docs",  # Swagger UI 경로
    redoc_url="/api/redoc"  # ReDoc 경로
)

# 로깅 설정
logging.basicConfig(level=logging.INFO)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logging.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 출처 허용
    allow_credentials=False,  # credentials가 필요없는 경우 False로 설정
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(liquor.router, prefix="/api", tags=["liquors"])
app.include_router(review.router, prefix="/api", tags=["reviews"])
app.include_router(store.router, prefix="/api", tags=["stores"])
app.include_router(filter.router, prefix="/api", tags=["filters"])

# 데이터베이스 연결 이벤트
@app.on_event("startup")
async def startup_db_client():
    await Database.connect_db(os.getenv("MONGODB_URL", "mongodb://3.36.132.159:27017"))

@app.on_event("shutdown")
async def shutdown_db_client():
    await Database.close_db()

# OpenAPI 스키마 커스터마이징
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Liquor API",
        version="1.0.0",
        description="술 정보 관리를 위한 REST API",
        routes=app.routes,
    )
    
    openapi_schema["info"]["x-logo"] = {
        "url": "https://your-logo-url.com"
    }
    
    openapi_schema["tags"] = [
        {
            "name": "liquors",
            "description": "주류 정보 관리 API"
        },
        {
            "name": "stores",
            "description": "판매점 관리 API"
        },
        {
            "name": "filters",
            "description": "필터 단어 관리 API"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/", tags=["root"])
async def read_root():
    return {"message": "Welcome to Liquor API"} 