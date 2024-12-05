/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper($) {
    var authToken;

    // 인증 토큰 설정
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    $(function onDocReady() {
        // 출근부 조회 버튼 클릭 시
        $('#checkAttendance').click(function () {
          console.log('출근부 조회 버튼 클릭됨');
          window.location.href = 'attendance.html';
      });
      
      $('#clockInOut').click(function () {
          console.log('출/퇴근 버튼 클릭됨');
          window.location.href = 'clockInOut.html';
      });
      

        // 로그아웃 버튼 클릭 시
        $('#signOut').click(function () {
            WildRydes.signOut();
            alert('로그아웃되었습니다.');
            window.location.href = '/signin.html';
        });
    });
}(jQuery));
