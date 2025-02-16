import re
from ..database import Database, FILTER_COLLECTION

# 비속어 목록 (예시)
PROFANITY_WORDS = {
    '비속어1', '비속어2', '욕설1', '욕설2'  # 실제 비속어 목록으로 대체
}

# 광고성 키워드 목록 (예시)
AD_KEYWORDS = {
    '광고', '홍보', '구매문의', '할인', '특가', '마감임박',
    'http://', 'https://', 'www.', '.com', '.kr',
    '카톡', '텔레그램', '라인', '위챗',
    '전화번호', '연락처', '문의전화'
}

def contains_profanity(text: str) -> bool:
    """비속어 포함 여부 확인"""
    text = text.lower()
    return any(word in text for word in PROFANITY_WORDS)

def contains_ad(text: str) -> bool:
    """광고성 텍스트 포함 여부 확인"""
    text = text.lower()
    # URL 패턴 체크
    url_pattern = r'(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?'
    if re.search(url_pattern, text):
        return True
    
    # 전화번호 패턴 체크
    phone_pattern = r'(\d{2,4}[-\s\.]?\d{3,4}[-\s\.]?\d{4})'
    if re.search(phone_pattern, text):
        return True
    
    # 광고 키워드 체크
    return any(keyword in text for keyword in AD_KEYWORDS)

async def get_filter_words():
    db = Database.get_db()
    profanity_cursor = db[FILTER_COLLECTION].find({"type": "profanity"})
    ad_cursor = db[FILTER_COLLECTION].find({"type": "ad"})
    
    profanity_words = {doc["word"] async for doc in profanity_cursor}
    ad_keywords = {doc["word"] async for doc in ad_cursor}
    
    return profanity_words, ad_keywords

async def validate_review_text(text: str) -> tuple[bool, str]:
    """리뷰 텍스트 검증"""
    profanity_words, ad_keywords = await get_filter_words()
    
    text = text.lower()
    
    if any(word in text for word in profanity_words):
        return False, "비속어가 포함되어 있습니다."
    
    if contains_ad(text):
        return False, "광고성 내용이 포함되어 있습니다."
        
    return True, "" 