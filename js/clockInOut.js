/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.clockInOut = WildRydes.clockInOut || {};

(function clockInOutScopeWrapper($) {
    var authToken;
    var studentId;

    // 인증 토큰 설정
    WildRydes.authToken
        .then(function setAuthToken(token) {
            if (token) {
                authToken = token;
                studentId = parseJwt(token)['custom:studentId'];
            } else {
                window.location.href = '/signin.html';
            }
        })
        .catch(function handleTokenError(error) {
            console.error('Error retrieving auth token: ', error);
            window.location.href = '/signin.html';
        });

    // 출/퇴근 제출 버튼 클릭 이벤트
    $('#submit-clockinout').click(async function () {
        try {
            // 현재 시간 가져오기 (한국 시간으로 변환)
            var currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            var action = $('#action-select').val(); // Clock In 또는 Clock Out 선택값
            var fileInput = $('#fingerprint-upload')[0].files[0]; // 파일 선택

            if (!action) {
                alert('출근 또는 퇴근을 선택하세요.');
                return;
            }

            if (!fileInput) {
                alert('지문 파일을 업로드하세요.');
                return;
            }

            // 파일을 Base64로 변환
            const convertFileToBase64 = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]); // Base64만 추출
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
            };

            const fingerprintBase64 = await convertFileToBase64(fileInput);

            // 출/퇴근 요청 데이터 생성
            var requestData = {
                studentId: studentId, // studentId 추가
                timestamp: currentTime,
                action: action,
            };

            // 지문 비교 요청 데이터 생성
            var fingerprintData = {
                studentId: studentId, // studentId 추가
                fingerprint: fingerprintBase64,
            };

            // 출/퇴근 요청 전송
            $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/ride',
                headers: {
                    Authorization: authToken,
                },
                data: JSON.stringify(requestData),
                contentType: 'application/json',
                success: function () {
                    $('#status-message').text(action + ' 처리가 완료되었습니다: ' + currentTime);
                },
                error: function ajaxError(jqXHR, textStatus, errorThrown) {
                    console.error('Error submitting clock-in/out: ', textStatus, errorThrown);
                    $('#status-message').text('출/퇴근 처리 중 에러가 발생했습니다.');
                },
            });

            // 지문 비교 요청 전송
            $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/compare_fp',
                headers: {
                    Authorization: authToken,
                },
                data: JSON.stringify(fingerprintData),
                contentType: 'application/json',
                success: function () {
                    $('#status-message').text('지문 인증이 완료되었습니다: ' + currentTime);
                },
                error: function ajaxError(jqXHR, textStatus, errorThrown) {
                    console.error('Error submitting fingerprint comparison:', textStatus, errorThrown);
                    $('#status-message').text('지문 인증 중 에러가 발생했습니다.');
                },
            });
        } catch (error) {
            console.error('Error processing fingerprint file:', error);
            alert('지문 파일 처리 중 오류가 발생했습니다.');
        }
    });

    // JWT 디코딩 함수
    function parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
        return JSON.parse(jsonPayload);
    }
})(jQuery);
