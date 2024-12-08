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

document.getElementById('fingerprintForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Get form data
    const studentId = document.getElementById('studentId').value;
    const fingerprintFiles = [
        document.getElementById('fingerprintFile1').files[0],
        document.getElementById('fingerprintFile2').files[0],
        document.getElementById('fingerprintFile3').files[0],
    ];

    if (!studentId || fingerprintFiles.some(file => !file)) {
        alert('Please fill out all fields and upload all files.');
        return;
    }

    // Create FormData to send files
    const formData = new FormData();
    formData.append('studentId', studentId);
    fingerprintFiles.forEach((file, index) => {
        formData.append(`fingerprintFile${index + 1}`, file);
    });

    try {
        // Send request to API Gateway
        const response = await fetch('https://tglilj6saa.execute-api.ap-northeast-2.amazonaws.com/prod/admin/registerFingerprint', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Fingerprint registration successful: ${result.message}`);
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error('Error registering fingerprint:', error);
        alert('Failed to register fingerprint. Please try again later.');
    }
});

