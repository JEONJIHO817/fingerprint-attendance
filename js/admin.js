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

/* global _config */
(function adminPortalScopeWrapper($) {
    let authToken;

    // AWS Cognito 인증 토큰 설정
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token: ', error);
        window.location.href = '/signin.html';
    });

    // 지문 등록 버튼 클릭 이벤트
    $('#registerFingerprintBtn').on('click', function () {
        $('#fingerprintModal').modal('show'); // 모달 표시
    });

    // 지문 등록 폼 제출 이벤트
    $('#fingerprintForm').on('submit', function (event) {
        event.preventDefault(); // 폼 기본 제출 동작 방지

        const studentId = $('#studentId').val();
        const file1 = $('#fingerprintFile1')[0].files[0];
        const file2 = $('#fingerprintFile2')[0].files[0];
        const file3 = $('#fingerprintFile3')[0].files[0];

        // 입력값 검증
        if (!studentId || !file1 || !file2 || !file3) {
            alert('모든 필드를 입력하고 파일을 업로드하세요.');
            return;
        }

        // FormData 객체 생성
        const formData = new FormData();
        formData.append('studentId', studentId);
        formData.append('file1', file1);
        formData.append('file2', file2);
        formData.append('file3', file3);

        // API Gateway로 데이터 전송
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/registerFingerprint', // API Gateway 경로
            headers: {
                Authorization: authToken, // 인증 헤더 추가
            },
            data: formData,
            processData: false, // FormData를 문자열로 변환하지 않음
            contentType: false, // FormData가 자체적으로 Content-Type을 설정
            success: function () {
                alert('Fingerprint registered successfully!');
                $('#fingerprintModal').modal('hide'); // 모달 닫기
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error registering fingerprint: ', textStatus, errorThrown);
                alert('Error occurred during fingerprint registration.');
            },
        });
    });
})(jQuery);

