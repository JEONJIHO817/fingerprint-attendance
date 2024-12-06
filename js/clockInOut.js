/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.clockInOut = WildRydes.clockInOut || {};

(function clockInOutScopeWrapper($) {
    var authToken;

    // 인증 토큰 설정
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
    // 출/퇴근 제출 버튼 클릭 이벤트
    $('#submit-clockinout').click(function() {
        // 현재 시간 가져오기
        var currentTime = new Date().toISOString(); // ISO 8601 형식으로 변환
        var action = $('#action-select').val(); // Clock In 또는 Clock Out 선택값
        var fileInput = $('#fingerprint-upload')[0];

        if (!action) {
            alert('출근 또는 퇴근을 선택하세요.');
            return;
        }

        var requestData = {
            timestamp: currentTime,
            action: action
        };

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify(requestData),
            contentType: 'application/json',
            success: function(response) {
                $('#status-message').text(response.action + '부로 출/퇴근 처리가 완료되었습니다: ');
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error submitting clock-in/out: ', textStatus, ', Details: ', errorThrown);
                $('#status-message').text('출/퇴근 처리 중 에러가 발생했습니다.');
            }
        });
    });
}(jQuery));
