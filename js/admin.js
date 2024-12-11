/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.admin = WildRydes.admin || {};

// Fingerprint Modal Elements
const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
const fingerprintForm = document.getElementById('fingerprintForm');

// 출근부 조회 버튼 클릭 이벤트
document.getElementById('viewAllAttendanceBtn').onclick = function () {
    console.log('Redirecting to attendance page...');
    window.location.href = '/adminAttendance.html'; // 출근부 조회 페이지로 리디렉션
};

// 출근부 조회 버튼 클릭 이벤트
document.getElementById('registerFingerprintBtn').onclick = function () {
    console.log('Redirecting to register Fingerprint page...');
    window.location.href = '/adminRegisterFP.html'; // 출근부 조회 페이지로 리디렉션
};

