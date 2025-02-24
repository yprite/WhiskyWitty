let hexagonChartInstance;
let currentPage = 0;
const itemsPerPage = 20;
let isLoading = false;
let hasMoreItems = true;

// 마지막 업데이트 시간을 저장할 변수
let lastUpdateTime = new Date().toISOString();

let liquorDetail = null;  // 전역 변수로 선언
let whiskyName = '';     // 현재 선택된 위스키 이름도 전역으로 관리
let currentSortOption = 'updated_at';  // 정렬 옵션 전역 변수
let currentLiquorId = null;  // 현재 선택된 주류의 ID를 저장할 변수

// 백엔드 API에서 데이터를 가져오는 함수
async function fetchLiquorData() {
    try {
        const response = await fetch('http://3.36.132.159:20010/api/liquors');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        window.whiskyData = data; // API로부터 받은 데이터를 전역 변수에 저장
        populateWhiskyList(true);
    } catch (error) {
        console.error('Error fetching liquor data:', error);
    }
}

function getTypeClass(type) {
    const typeMap = {
        '위스키': 'x',
        '소주': 'soju',
        '막걸리': 'makgeolli',
        '맥주': 'beer'
    };
    return typeMap[type] || 'whisky';
}

function getStarRating(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    // 5개의 별을 생성
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push('<span class="filled">★</span>');
        } else {
            stars.push('<span>★</span>');
        }
    }
    
    return stars.join('');
}

function populateWhiskyList(isInitial = false) {
    if (isLoading || !hasMoreItems) return;
    
    isLoading = true;
    let list = document.getElementById('whisky-list');
    
    if (isInitial) {
        list.innerHTML = '';
        currentPage = 0;
    }

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const sortedWhiskies = window.whiskyData.sort((a, b) => b.rating - a.rating);
    const whiskySlice = sortedWhiskies.slice(startIndex, endIndex);

    if (endIndex >= window.whiskyData.length) {
        hasMoreItems = false;
    }

    whiskySlice.forEach(whisky => {
        const item = document.createElement('div');
        item.className = 'whisky-item';
        item.onclick = () => showReviews(whisky.name);
        item.innerHTML = `
            <div class="whisky-info">
                <img src="${whisky.image}" class="whisky-image">
                <strong>${whisky.name}</strong>
                <div class="rating">
                    ${getStarRating(whisky.rating)}
                    <span class="score">(${whisky.rating})</span>
                </div>
                <span class="drink-type ${getTypeClass(whisky.type)}">${whisky.type}</span>
            </div>
            <p class="whisky-description">${whisky.description}</p>
        `;
        list.appendChild(item);
    });

    currentPage++;
    isLoading = false;
}

async function showReviews(name) {
    const whisky = window.whiskyData.find(w => w.name === name);
    currentLiquorId = whisky.id;  // 현재 주류 ID 저장
    whiskyName = name;
    document.getElementById('modal-whisky-name').textContent = name;
    document.getElementById('liquor-description').textContent = whisky.description;
    const reviewContainer = document.getElementById('modal-reviews');
    
    try {
        // 프로필 정보 가져오기
        const profileResponse = await fetch(`http://3.36.132.159:20010/api/liquors/${whisky.id}`);
        if (!profileResponse.ok) {
            throw new Error('프로필 데이터를 가져오는데 실패했습니다.');
        }
        liquorDetail = await profileResponse.json();

        // 판매처 정보 처리
        const stores = liquorDetail.stores || [];
        const prices = stores.map(store => store.price).filter(price => price);
        
        // 가격 정보 계산 및 표시
        if (prices.length > 0) {
            const avgPrice = Math.round(prices.reduce((a, b) => a + b) / prices.length);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            document.getElementById('liquor-avg-price').textContent = avgPrice.toLocaleString();
            document.getElementById('liquor-min-price').textContent = minPrice.toLocaleString();
            document.getElementById('liquor-max-price').textContent = maxPrice.toLocaleString();
        } else {
            document.getElementById('liquor-avg-price').textContent = '정보 없음';
            document.getElementById('liquor-min-price').textContent = '0';
            document.getElementById('liquor-max-price').textContent = '0';
        }

        // 판매처 목록 표시
        const sellerList = document.getElementById('seller-list');
        sellerList.innerHTML = stores.length > 0 
            ? stores.map(store => `
                <div class="seller-item">
                    <div class="seller-info">
                        <div class="seller-name">${store.name}</div>
                        <div class="seller-address">${store.address}</div>
                        ${store.contact ? `<div class="seller-contact">${store.contact}</div>` : ''}
                    </div>
                    <div class="seller-price">
                        ${store.price ? `${store.price.toLocaleString()}원` : '가격 정보 없음'}
                    </div>
                </div>
            `).join('')
            : '<p class="text-muted">등록된 판매처가 없습니다.</p>';

        // 리뷰 목록 가져오기
        const response = await fetch(`http://3.36.132.159:20010/api/liquors/${whisky.id}/reviews?sort=${currentSortOption}`);
        if (!response.ok) {
            throw new Error('데이터를 가져오는데 실패했습니다.');
        }
        const reviews = await response.json();
        liquorDetail.reviews = reviews;  // 리뷰 목록 업데이트
        
        reviewContainer.innerHTML = liquorDetail.reviews.length > 0 
            ? liquorDetail.reviews.map(review => `
                <div class="review-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <p class="mb-0">${review.content}</p>
                            <small class="text-muted">
                                작성: ${formatDateTime(review.created_at)}
                                ${review.updated_at !== review.created_at 
                                    ? `(수정됨: ${formatDateTime(review.updated_at)})` 
                                    : ''}
                                <br>
                                <span class="like-count">
                                    <i class="bi bi-hand-thumbs-up-fill text-primary"></i> ${review.likes}
                                </span>
                            </small>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary me-2" 
                                onclick="likeReview('${whisky.id}', '${review.id}')">
                                <i class="bi bi-hand-thumbs-up"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary" 
                                onclick="editReview('${whisky.id}', '${review.id}')">수정</button>
                        </div>
                    </div>
                </div>
            `).join('') 
            : '<p class="text-muted">아직 리뷰가 없습니다.</p>';
            
        const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
        
        // 모달이 닫힐 때 백드롭 제거
        document.getElementById('reviewModal').addEventListener('hidden.bs.modal', () => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
        }, { once: true });
        
        reviewModal.show();
        
        // 모달이 완전히 표시된 후 차트 그리기
        document.getElementById('reviewModal').addEventListener('shown.bs.modal', () => {
            drawHexagonChart(liquorDetail.profile);
        });
        
        // 탭 전환 시에도 차트 다시 그리기
        document.getElementById('info-tab').addEventListener('shown.bs.tab', () => {
            drawHexagonChart(liquorDetail.profile);
        });
    } catch (error) {
        console.error('Error fetching liquor details:', error);
        reviewContainer.innerHTML = '<p class="text-danger">데이터를 불러오는데 실패했습니다.</p>';
    }
}

function drawHexagonChart(profile) {
    const ctx = document.getElementById('hexagonChart').getContext('2d');
    
    if (hexagonChartInstance) {
        hexagonChartInstance.destroy();
    }

    // Profile 객체의 값들을 배열로 변환
    const profileValues = [
        profile.smoothness,
        profile.aroma,
        profile.complexity,
        profile.finish,
        profile.balance,
        profile.intensity
    ];

    hexagonChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['부드러움', '향', '복합성', '피니시', '밸런스', '강도'],
            datasets: [{
                label: '주류 프로필',
                data: profileValues,
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                borderColor: 'rgba(255, 165, 0, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 165, 0, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 165, 0, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    min: 0,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function handleScroll() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < 100) {
        populateWhiskyList();
    }
}

function searchWhiskies() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    window.whiskyData.sort((a, b) => b.rating - a.rating);
    
    window.filteredWhiskyData = window.whiskyData.filter(whisky => 
        whisky.name.toLowerCase().includes(searchTerm) ||
        whisky.description.toLowerCase().includes(searchTerm)
    );

    document.getElementById('whisky-list').innerHTML = '';
    currentPage = 0;
    hasMoreItems = true;
    populateWhiskyList();
}

function validateProfileInput(input) {
    const value = parseFloat(input.value);
    const errorDiv = input.nextElementSibling;
    
    if (isNaN(value) || value < 0 || value > 5) {
        input.classList.add('is-invalid');
        errorDiv.style.display = 'block';
        return false;
    } else {
        input.classList.remove('is-invalid');
        errorDiv.style.display = 'none';
        return true;
    }
}

function calculateAverageRating(ratingsArray) {
    const sum = ratingsArray.reduce((acc, val) => acc + parseFloat(val), 0);
    return (sum / ratingsArray.length).toFixed(1);
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

function addNewItem() {
    const name = document.getElementById('itemName').value;
    const type = document.getElementById('itemType').value;
    const description = document.getElementById('itemDescription').value;

    // 프로필 입력값 검증
    const profileInputs = document.querySelectorAll('.profile-input');
    let isValid = true;
    const ratingsArray = [];

    profileInputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!validateProfileInput(input)) {
            isValid = false;
        }
        ratingsArray.push(value);
    });

    if (!name || !type || !description || !isValid) {
        alert('모든 필드를 올바르게 입력해주세요.');
        return;
    }

    // 평균 평점 계산
    const averageRating = calculateAverageRating(ratingsArray);

    // 프로필 데이터를 객체 형태로 변환
    const profile = {
        smoothness: parseFloat(document.getElementById('profile-smoothness').value),
        aroma: parseFloat(document.getElementById('profile-aroma').value),
        complexity: parseFloat(document.getElementById('profile-complexity').value),
        finish: parseFloat(document.getElementById('profile-finish').value),
        balance: parseFloat(document.getElementById('profile-balance').value),
        intensity: parseFloat(document.getElementById('profile-intensity').value)
    };

    const newItem = {
        name: name,
        type: type,
        description: description,
        rating: averageRating,
        image: `https://via.placeholder.com/50?text=${name[0]}`,
        reviews: [],
        profile: profile  // 배열 대신 객체 사용
    };

    // 서버로 POST 요청 보내기
    fetch('http://3.36.132.159:20010/api/liquors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
    })
    .then(response => {
        if (response.ok) {
            showToast('새로운 주류가 추가되었습니다.'); // alert 대신 토스트 사용
            return response.json();
        } else {
            throw new Error('주류 추가에 실패했습니다.');
        }
    })
    .then(data => {
        window.whiskyData.unshift(data);
        currentPage = 0;
        hasMoreItems = true;
        populateWhiskyList(true);
    })
    .catch(error => {
        console.error('Error adding new liquor:', error);
        showToast('주류 추가 중 오류가 발생했습니다.'); // 에러 메시지도 토스트로 표시
    });

    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
    modal.hide();
    
    // 폼 초기화
    document.getElementById('addItemForm').reset();
}

// 리뷰를 제출하는 함수
function submitReview() {
    const reviewText = document.getElementById('reviewInput').value;
    const whiskyName = document.getElementById('modal-whisky-name').textContent;
    const whisky = window.whiskyData.find(w => w.name === whiskyName);

    if (!reviewText) {
        showToast('리뷰를 입력하세요.');
        return;
    }

    fetch(`http://3.36.132.159:20010/api/liquors/${whisky.id}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: reviewText })
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '리뷰 제출에 실패했습니다.');
        }
        return response.json();
    })
    .then(data => {
        showToast('리뷰가 제출되었습니다.');
        document.getElementById('reviewInput').value = '';
        
        // 기존 모달과 백드롭 제거
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        modal.hide();
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            showReviews(whiskyName);
        }, 100);
    })
    .catch(error => {
        console.error('Error submitting review:', error);
        showToast(error.message);
    });
}

// 주기적으로 데이터를 갱신하는 함수
async function periodicUpdate() {
    try {
        const response = await fetch(`http://3.36.132.159:20010/api/liquors?after=${lastUpdateTime}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const newData = await response.json();
        
        // 새로운 데이터가 있는 경우에만 처리
        if (newData.length > 0) {
            // 기존 데이터와 새로운 데이터 병합
            const existingIds = new Set(window.whiskyData.map(w => w.id));
            const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
            
            if (uniqueNewData.length > 0) {
                window.whiskyData = [...uniqueNewData, ...window.whiskyData];
                populateWhiskyList(true);
                console.log(`${uniqueNewData.length}개의 새로운 항목이 추가되었습니다.`);
            }
        }
        
        // 마지막 업데이트 시간 갱신
        lastUpdateTime = new Date().toISOString();
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

// 페이지 로드 시 초기 설정
document.addEventListener('DOMContentLoaded', () => {
    fetchLiquorData(); // 초기 데이터 로드
    window.addEventListener('scroll', handleScroll);

    // 30초마다 데이터 갱신
    setInterval(periodicUpdate, 10000);
    
    // 프로필 입력 필드들에 유효성 검사 추가
    const profileInputs = document.querySelectorAll('.profile-input');
    profileInputs.forEach(input => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = '0~5 사이의 값을 입력하세요';
        input.insertAdjacentElement('afterend', errorDiv);

        input.addEventListener('input', () => validateProfileInput(input));
    });
});

async function deleteReview(liquorId, reviewIndex) {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`http://3.36.132.159:20010/api/liquors/${liquorId}/reviews/${reviewIndex}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '리뷰 삭제에 실패했습니다.');
        }

        showToast('리뷰가 삭제되었습니다.');
        
        // 리뷰 목록 새로고침
        const whiskyName = document.getElementById('modal-whisky-name').textContent;
        showReviews(whiskyName);
    } catch (error) {
        console.error('Error deleting review:', error);
        showToast(error.message);
    }
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
}

// 리뷰 수정 함수
async function editReview(liquorId, reviewId) {
    const currentReview = liquorDetail.reviews.find(r => r.id === reviewId);
    if (!currentReview) return;

    const newContent = prompt("리뷰를 수정하세요:", currentReview.content);
    if (!newContent || newContent === currentReview.content) return;

    try {
        const response = await fetch(`http://3.36.132.159:20010/api/liquors/${liquorId}/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '리뷰 수정에 실패했습니다.');
        }

        showToast('리뷰가 수정되었습니다.');
        await showReviews(whiskyName);  // 전역 변수 사용
    } catch (error) {
        console.error('Error updating review:', error);
        showToast(error.message);
    }
}

async function sortReviews(sortOption) {
    currentSortOption = sortOption;
    await showReviews(whiskyName);
}

async function likeReview(liquorId, reviewId) {
    try {
        const response = await fetch(`http://3.36.132.159:20010/api/liquors/${liquorId}/reviews/${reviewId}/like`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('좋아요 실패');
        }

        showToast('좋아요를 눌렀습니다.');
        await showReviews(whiskyName);
    } catch (error) {
        console.error('Error liking review:', error);
        showToast(error.message);
    }
}

// 전화번호 입력 시 자동으로 하이픈 추가
function formatPhoneNumber(event) {
    const input = event.target;
    let value = input.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
    
    // 02로 시작하는 경우 특별 처리
    if (value.startsWith('02')) {
        if (value.length <= 2) {
            input.value = value;
        } else if (value.length <= 6) {
            input.value = value.slice(0, 2) + '-' + value.slice(2);
        } else {
            input.value = value.slice(0, 2) + '-' + value.slice(2, 6) + '-' + value.slice(6, 10);
        }
        return;
    }
    
    // 그 외의 경우 3-3-4 또는 3-4-4 형식
    if (value.length <= 3) {
        input.value = value;
    } else if (value.length <= 7) {
        input.value = value.slice(0, 3) + '-' + value.slice(3);
    } else {
        if (value.length <= 10) {
            input.value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6);
        } else {
            input.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
        }
    }
}

// 판매처 추가 모달 표시
function showAddStoreModal() {
    // 기존 모달 인스턴스 제거
    const existingModal = bootstrap.Modal.getInstance(document.getElementById('addStoreModal'));
    if (existingModal) {
        existingModal.dispose();
    }
    
    // 폼 초기화
    document.getElementById('addStoreForm').reset();
    
    // 전화번호 입력 이벤트 리스너 추가
    const contactInput = document.getElementById('storeContact');
    contactInput.addEventListener('input', formatPhoneNumber);
    
    // 새 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('addStoreModal'));
    modal.show();
}

// 판매처 추가
async function addStore() {
    const storeName = document.getElementById('storeName').value;
    const storeAddress = document.getElementById('storeAddress').value;
    const storeContact = document.getElementById('storeContact').value;
    const storePrice = parseInt(document.getElementById('storePrice').value);

    // 전화번호 유효성 검사
    const phoneRegex = /^(02-[0-9]{3,4}|[0-9]{3}-[0-9]{3,4})-[0-9]{4}$/;
    const contactInput = document.getElementById('storeContact');

    if (storeContact && !phoneRegex.test(storeContact)) {
        contactInput.classList.add('is-invalid');
        showToast('올바른 전화번호 형식으로 입력해주세요. (예: 02-1234-5678, 010-1234-5678 또는 000-000-0000)');
        return;
    } else {
        contactInput.classList.remove('is-invalid');
    }

    if (!storeName || !storePrice) {
        showToast('필수 정보를 모두 입력해주세요.');
        return;
    }

    const storeData = {
        name: storeName,
        address: storeAddress || null,
        contact: storeContact || null,
        price: storePrice
    };

    try {
        const response = await fetch(`http://3.36.132.159:20010/api/liquors/${currentLiquorId}/stores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storeData)
        });

        if (!response.ok) {
            throw new Error('판매처 추가에 실패했습니다.');
        }

        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStoreModal'));
        modal.hide();

        showToast('판매처가 추가되었습니다.');
        
        // 현재 화면 새로고침
        await showReviews(whiskyName);
    } catch (error) {
        console.error('Error adding store:', error);
        showToast(error.message);
    }
}

