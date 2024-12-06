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
    $('#submit-clockinout').click(function () {
        var currentTime = new Date().toISOString();
        var action = $('#action-select').val();
        var fileInput = $('#fingerprint-upload')[0];
        var formData = new FormData();

        // 필수 값 검증
        if (!action) {
            alert('출근 또는 퇴근을 선택하세요.');
            return;
        }

        // 폼 데이터 생성
        formData.append('timestamp', currentTime);
        formData.append('action', action);
        if (fileInput.files.length > 0) {
            formData.append('fingerprint', fileInput.files[0]); // 이미지 파일 추가
        }

        // API 호출
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                $('#status-message').text('출/퇴근 처리가 완료되었습니다: ' + response.message).removeClass('text-danger').addClass('text-success');
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error submitting clock-in/out: ', textStatus, ', Details: ', errorThrown);
                $('#status-message').text('출/퇴근 처리 중 에러가 발생했습니다.').removeClass('text-success').addClass('text-danger');
            }
        });
    });
}(jQuery));
