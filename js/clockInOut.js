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
        // 현재 시간 가져오기 (한국 시간으로 변환)
        var currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
        var action = $('#action-select').val(); // Clock In 또는 Clock Out 선택값
        var fileInput = $('#fingerprint-upload')[0]; //지문파일 업로드된거

        if (!action) {
            alert('출근 또는 퇴근을 선택하세요.');
            return;
        }

        var requestData = { //내가 요청할거 (출근할건지 퇴근할건지, 몇시인지, 지문이 뭔지)
            timestamp: currentTime,
            action: action
            //fileInput
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
                $('#status-message').text(action + ' 처리가 완료되었습니다: ' + currentTime);
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error submitting clock-in/out: ', textStatus, ', Details: ', errorThrown);
                $('#status-message').text('출/퇴근 처리 중 에러가 발생했습니다.');
            }
        });
    });
}(jQuery));
