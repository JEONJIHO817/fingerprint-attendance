/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.clockInOut = WildRydes.clockInOut || {};

(function clockInOutScopeWrapper($) {
    var authToken;

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

    $('#submit-fingerprint').click(function() {
        var fileInput = $('#fingerprint-input')[0];
        if (fileInput.files.length === 0) {
            alert('지문 이미지를 업로드하세요.');
            return;
        }

        var file = fileInput.files[0];
        var formData = new FormData();
        formData.append('fingerprint', file);

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                $('#status-message').text('출/퇴근 처리가 완료되었습니다: ' + response.status);
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error submitting fingerprint: ', textStatus, ', Details: ', errorThrown);
                $('#status-message').text('출/퇴근 처리 중 에러가 발생했습니다.');
            }
        });
    });
}(jQuery));
