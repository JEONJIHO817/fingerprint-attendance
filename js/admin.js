// Fingerprint Modal Elements
const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
const fingerprintForm = document.getElementById('fingerprintForm');

// 출근부 조회 버튼 클릭 이벤트
document.getElementById('viewAllAttendanceBtn').onclick = function () {
    console.log('Redirecting to attendance page...');
    window.location.href = '/attendance.html'; // 출근부 조회 페이지로 리디렉션
};

// 지문 등록 버튼 클릭 이벤트
document.getElementById('registerFingerprintBtn').onclick = function () {
    fingerprintModal.show(); // 지문 등록 모달 표시
};

// Handle Fingerprint Form Submission
fingerprintForm.onsubmit = function (e) {
    e.preventDefault();
    
    const studentId = document.getElementById('studentId').value;
    const fingerprintFile = document.getElementById('fingerprintFile').files[0];
    
    if (!studentId || !fingerprintFile) {
        alert('Please provide all required fields.');
        return;
    }

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('fingerprint', fingerprintFile);

    // Simulate API Call for Fingerprint Registration
    fetch('/api/admin/registerFingerprint', { // Replace with your API endpoint
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message || 'Fingerprint registered successfully!');
            fingerprintModal.hide();
        })
        .catch(error => {
            console.error('Error registering fingerprint:', error);
            alert('Failed to register fingerprint.');
        });
};
