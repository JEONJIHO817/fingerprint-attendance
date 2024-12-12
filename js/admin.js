/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.admin = WildRydes.admin || {};

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

    $(function onDocReady() {
        // 출근부 조회 버튼 클릭 시
        $('#viewAllAttendanceBtn').click(function () {
          console.log('출근부 조회 버튼 클릭됨');
          window.location.href = '/attendance.html';
        });
      
        $('#registerFingerprintBtn').click(function () {
            console.log('출/퇴근 버튼 클릭됨');
            window.location.href = '/clockInOut.html';
        });

        $('#modify-profile').click(function () {
            console.log('회원정보 수정 버튼 클릭됨');
            window.location.href = '/modify-profile.html';
        });
        // 로그아웃 버튼 클릭 시
        $('#signOut').click(function () {
            WildRydes.signOut();
            alert('로그아웃되었습니다.');
            window.location.href = '/index.html';
        });
    });
})(jQuery);

