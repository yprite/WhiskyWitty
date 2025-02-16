// 마지막 업데이트 시간을 저장할 변수
let lastUpdateTime = new Date().toISOString();

// 주기적으로 데이터를 갱신하는 함수
async function periodicUpdate() {
    try {
        const response = await fetch(`http://localhost:8000/api/liquors?after=${lastUpdateTime}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const newData = await response.json();
        
        // 새로운 데이터가 있는 경우에만 처리
        if (newData.length > 0) {
            await fetchLiquors(); // 전체 목록 새로고침
            console.log(`데이터가 갱신되었습니다.`);
        }
        
        // 마지막 업데이트 시간 갱신
        lastUpdateTime = new Date().toISOString();
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

async function fetchLiquors() {
    try {
        const response = await fetch('http://localhost:8000/api/liquors');
        const liquors = await response.json();
        const liquorList = document.getElementById('liquor-list');
        liquorList.innerHTML = '';

        for (const liquor of liquors) {
            // 각 주류의 상세 정보를 가져옴
            const detailResponse = await fetch(`http://localhost:8000/api/liquors/${liquor.id}`);
            const liquorDetail = await detailResponse.json();
            
            const liquorItem = document.createElement('div');
            liquorItem.className = 'liquor-item mb-3';
            liquorItem.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${liquor.name}</h5>
                        <p class="card-text">종류: ${liquor.type}</p>
                        <p class="card-text">평점: ${liquor.rating}</p>
                        <div class="profile-section mt-2">
                            <h6>평점 구성요소</h6>
                            <div class="profile-details border rounded p-3">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p class="mb-1">부드러움: ${liquorDetail.profile.smoothness}</p>
                                        <p class="mb-1">향: ${liquorDetail.profile.aroma}</p>
                                        <p class="mb-1">복합성: ${liquorDetail.profile.complexity}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p class="mb-1">피니시: ${liquorDetail.profile.finish}</p>
                                        <p class="mb-1">밸런스: ${liquorDetail.profile.balance}</p>
                                        <p class="mb-1">강도: ${liquorDetail.profile.intensity}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p class="card-text">설명: ${liquor.description}</p>
                        <div class="stores-section mt-3">
                            <h6>판매처 목록</h6>
                            <div class="store-list list-group" id="store-list-${liquor.id}">
                                <!-- 판매처 목록이 여기에 로드됩니다 -->
                            </div>
                        </div>
                        <div class="reviews-section mt-3">
                            <h6>리뷰 목록</h6>
                            <div class="review-list list-group" id="review-list-${liquor.id}">
                                <!-- 리뷰 목록이 여기에 로드됩니다 -->
                            </div>
                        </div>
                        <button class="btn btn-danger mt-3" onclick="deleteLiquor('${liquor.id}')">삭제</button>
                    </div>
                </div>
            `;
            liquorList.appendChild(liquorItem);
            
            // 리뷰와 판매처 목록을 liquorDetail에서 바로 표시
            const reviewList = document.getElementById(`review-list-${liquor.id}`);
            reviewList.innerHTML = liquorDetail.reviews.length > 0 
                ? liquorDetail.reviews.map((review, index) => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${review.content}</span>
                        <button class="btn btn-sm btn-danger" 
                            onclick="deleteReview('${liquor.id}', ${index})">삭제</button>
                    </div>
                `).join('')
                : '<p class="text-muted">아직 리뷰가 없습니다.</p>';
            
            const storeList = document.getElementById(`store-list-${liquor.id}`);
            storeList.innerHTML = liquorDetail.stores.length > 0 
                ? liquorDetail.stores.map((store) => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${store.name}</strong>
                            <div class="store-details mt-1">
                                ${store.address ? `<div>주소: ${store.address}</div>` : ''}
                                ${store.contact ? `<div>연락처: ${store.contact}</div>` : ''}
                                <div>가격: ${store.price.toLocaleString()}원</div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-danger" 
                            onclick="deleteStore('${liquor.id}', '${store.id}')">삭제</button>
                    </div>
                `).join('')
                : '<p class="text-muted">등록된 판매처가 없습니다.</p>';
        }
    } catch (error) {
        console.error('Error fetching liquors:', error);
    }
}

async function loadReviews(liquorId) {
    try {
        const response = await fetch(`http://localhost:8000/api/liquors/${liquorId}`);
        const liquorDetail = await response.json();
        const reviewList = document.getElementById(`review-list-${liquorId}`);
        
        reviewList.innerHTML = liquorDetail.reviews.length > 0 
            ? liquorDetail.reviews.map((review, index) => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${review.content}</span>
                    <button class="btn btn-sm btn-danger" 
                        onclick="deleteReview('${liquorId}', ${index})">삭제</button>
                </div>
            `).join('')
            : '<p class="text-muted">아직 리뷰가 없습니다.</p>';
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

async function deleteReview(liquorId, reviewIndex) {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/api/liquors/${liquorId}/reviews/${reviewIndex}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '리뷰 삭제에 실패했습니다.');
        }

        showToast('리뷰가 삭제되었습니다.');
        await loadReviews(liquorId);  // 리뷰 목록 새로고침
    } catch (error) {
        console.error('Error deleting review:', error);
        showToast(error.message);
    }
}

async function deleteLiquor(liquorId) {
    if (confirm("정말로 이 항목을 삭제하시겠습니까?")) {
        try {
            const response = await fetch(`http://localhost:8000/api/liquors/${liquorId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert("삭제되었습니다.");
                fetchLiquors(); // 삭제 후 목록 갱신
            } else {
                alert("삭제에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error deleting liquor:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }
}

// 필터 단어 목록 가져오기
async function fetchFilterWords() {
    try {
        const response = await fetch('http://localhost:8000/api/filters');
        const words = await response.json();
        
        // 비속어와 광고 키워드 분리
        const profanityWords = words.filter(w => w.type === 'profanity');
        const adWords = words.filter(w => w.type === 'ad');
        
        // 현재 등록된 비속어 목록 표시
        const currentProfanityList = document.getElementById('current-profanity-list');
        document.getElementById('profanity-count').textContent = `${profanityWords.length}개`;
        currentProfanityList.innerHTML = profanityWords.map(word => `
            <span class="badge bg-light text-dark me-2 mb-2">#${word.word}</span>
        `).join('');
        
        // 현재 등록된 광고성 키워드 목록 표시
        const currentAdList = document.getElementById('current-ad-list');
        document.getElementById('ad-count').textContent = `${adWords.length}개`;
        currentAdList.innerHTML = adWords.map(word => `
            <span class="badge bg-light text-dark me-2 mb-2">#${word.word}</span>
        `).join('');
        
        // 비속어 목록 표시
        const profanityList = document.getElementById('profanity-list');
        profanityList.innerHTML = profanityWords.map(word => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span class="filter-word">#${word.word}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteFilterWord('${word.id}')">삭제</button>
            </div>
        `).join('');
        
        // 광고 키워드 목록 표시
        const adList = document.getElementById('ad-list');
        adList.innerHTML = adWords.map(word => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span class="filter-word">#${word.word}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteFilterWord('${word.id}')">삭제</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching filter words:', error);
    }
}

// 필터 단어 추가
async function addFilterWord(type) {
    const input = document.getElementById(type === 'profanity' ? 'profanityInput' : 'adInput');
    let word = input.value.trim();
    
    if (!word) {
        showToast('단어를 입력하세요.');
        return;
    }

    // '#' 접두사가 없으면 추가
    if (!word.startsWith('#')) {
        word = '#' + word;
    }
    
    try {
        const response = await fetch('http://localhost:8000/api/filters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                word: word.substring(1), // '#' 제거하고 저장
                type 
            })
        });
        
        if (response.ok) {
            showToast('필터 단어가 추가되었습니다.');
            input.value = '';
            fetchFilterWords();
        } else {
            throw new Error('필터 단어 추가에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error adding filter word:', error);
        showToast(error.message);
    }
}

// 필터 단어 삭제
async function deleteFilterWord(id) {
    if (confirm('이 단어를 삭제하시겠습니까?')) {
        try {
            const response = await fetch(`http://localhost:8000/api/filters/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('필터 단어가 삭제되었습니다.');
                fetchFilterWords();
            } else {
                throw new Error('필터 단어 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error deleting filter word:', error);
            showToast(error.message);
        }
    }
}

// 엔터 키 이벤트 처리 함수
function handleEnterKey(event, type) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addFilterWord(type);
    }
}

function showToast(message) {
    const toastEl = document.getElementById('successToast');
    // 기존 토스트 인스턴스가 있다면 제거
    const existingToast = bootstrap.Toast.getInstance(toastEl);
    if (existingToast) {
        existingToast.dispose();
    }
    
    // 새로운 토스트 인스턴스 생성
    const toast = new bootstrap.Toast(toastEl, {
        animation: true,
        autohide: true,
        delay: 2000  // 2초 후 자동으로 사라짐
    });
    
    toastEl.querySelector('.toast-body').textContent = message;
    toast.show();
}

// 판매처 목록 로드 함수
async function loadStores(liquorId) {
    try {
        const response = await fetch(`http://localhost:8000/api/liquors/${liquorId}`);
        const liquorDetail = await response.json();
        const storeList = document.getElementById(`store-list-${liquorId}`);
        
        storeList.innerHTML = liquorDetail.stores.length > 0 
            ? liquorDetail.stores.map((store, index) => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${store.name}</strong>
                        <div class="store-details mt-1">
                            ${store.address ? `<div>주소: ${store.address}</div>` : ''}
                            ${store.contact ? `<div>연락처: ${store.contact}</div>` : ''}
                            <div>가격: ${store.price.toLocaleString()}원</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-danger" 
                        onclick="deleteStore('${liquorId}', '${store.id}')">삭제</button>
                </div>
            `).join('')
            : '<p class="text-muted">등록된 판매처가 없습니다.</p>';
    } catch (error) {
        console.error('Error loading stores:', error);
    }
}

// 판매처 삭제 함수
async function deleteStore(liquorId, storeId) {
    if (!confirm('이 판매처를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/api/liquors/${liquorId}/stores/${storeId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '판매처 삭제에 실패했습니다.');
        }

        showToast('판매처가 삭제되었습니다.');
        await loadStores(liquorId);  // 판매처 목록 새로고침
    } catch (error) {
        console.error('Error deleting store:', error);
        showToast(error.message);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    fetchLiquors();
    fetchFilterWords();

    // 엔터 키 이벤트 리스너 추가
    document.getElementById('profanityInput').addEventListener('keypress', (e) => handleEnterKey(e, 'profanity'));
    document.getElementById('adInput').addEventListener('keypress', (e) => handleEnterKey(e, 'ad'));
}); 