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
    formData.append('fingerprint', fingerprintFile1);
    formData.append('fingerprint', fingerprintFile2);
    formData.append('fingerprint', fingerprintFile3);

    // Simulate API Call for Fingerprint Registration
    fetch('/admin/registerFingerprint', { // Replace with your API endpoint
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
