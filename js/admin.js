// Fingerprint Modal Elements
const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
const fingerprintForm = document.getElementById('fingerprintForm');

// 출근부 조회 버튼 클릭 이벤트
document.getElementById('viewAllAttendanceBtn').onclick = function () {
    console.log('Redirecting to attendance page...');
    window.location.href = '/adminAttendance.html'; // 출근부 조회 페이지로 리디렉션
};





//------------------------------------------------------------------------------------------
// 지문 등록 버튼 클릭 이벤트
document.getElementById('registerFingerprintBtn').onclick = function () {
    fingerprintModal.show(); // 지문 등록 모달 표시
};

// Handle Fingerprint Form Submission
fingerprintForm.onsubmit = function (e) {
    e.preventDefault();
    
    if (!authToken) {
        alert('Authentication token is missing or invalid. Please sign in again.');
        window.location.href = '/signin.html'; // 로그인 페이지로 리디렉션
        return;
    }

    const studentId = document.getElementById('studentId').value;
    const fingerprintFile1 = document.getElementById('fingerprintFile1').files[0];
    const fingerprintFile2 = document.getElementById('fingerprintFile2').files[0];
    const fingerprintFile3 = document.getElementById('fingerprintFile3').files[0];

    if (!studentId || !fingerprintFile1 || !fingerprintFile2 || !fingerprintFile3) {
        alert('Please provide Student ID and all three fingerprint files.');
        return;
    }

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('fingerprint1', fingerprintFile1);
    formData.append('fingerprint2', fingerprintFile2);
    formData.append('fingerprint3', fingerprintFile3);

    // Simulate API Call for Fingerprint Registration
    fetch('https://tglilj6saa.execute-api.ap-northeast-2.amazonaws.com/prod/admin/registerFingerprint', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
    })
        .then(response => {
            if (!response.ok) {
                // HTTP 응답 상태 코드가 200-299 범위가 아닐 경우
                if (response.status === 401) {
                    // 권한 오류 처리
                    alert('You are not authorized to perform this action. Please sign in again.');
                    window.location.href = '/signin.html';
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || 'Fingerprint registered successfully!');
            fingerprintModal.hide();
        })
        .catch(error => {
            console.error('Error registering fingerprint:', error);
            alert('Failed to register fingerprint.');
        });
};
