/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.clockInOut = WildRydes.clockInOut || {};

(function clockInOutScopeWrapper($) {
    var authToken;
    var studentId;

    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Base64 문자열에서 'data:image/png;base64,' 부분을 제거하고 순수 Base64만 반환
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // 인증 토큰 설정
    WildRydes.authToken
        .then(function setAuthToken(token) {
            if (token) {
                authToken = token;
                console.log("Token:", token);
                const decoded = parseJwt(token);
                console.log("Decoded token:", decoded);
                studentId = decoded['custom:employeeId'];
                console.log("Extracted studentId:", studentId);
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
            console.log("Current studentId:", studentId);

            // 입력 검증
            const action = $('#action-select').val();
            const fileInput = $('#fingerprint-upload')[0].files[0];
    
            if (!action || !fileInput) {
                alert('출근/퇴근 선택과 지문 파일을 확인하세요.');
                return;
            }
    
            // 지문 파일을 Base64로 변환
            const fingerprintBase64 = await convertFileToBase64(fileInput);
    
            // 지문 인증 요청
            const fingerprintResult = await $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/compare_fp',
                headers: { Authorization: authToken },
                data: JSON.stringify({
                    studentId: studentId,
                    fingerprint: fingerprintBase64
                }),
                contentType: 'application/json'
            });
            
            // 응답이 JSON 문자열이므로 파싱
            console.log('Received response:', fingerprintResult); // 응답 데이터 확인용
            
            // 지문 인증 성공 시 출퇴근 기록
            if (fingerprintResult.verified) {
                const currentTime = new Date().toLocaleString('ko-KR', { 
                    timeZone: 'Asia/Seoul', 
                    hour12: false 
                });
            
                await $.ajax({
                    method: 'POST',
                    url: _config.api.invokeUrl + '/ride',
                    headers: { Authorization: authToken },
                    data: JSON.stringify({
                        studentId: studentId,
                        timestamp: currentTime,
                        action: action
                    }),
                    contentType: 'application/json'
                });
            
                // Action에 따른 메시지 출력
                let statusMessage = '';
                if (action === 'Clock In') {
                    statusMessage = `${currentTime}부로 출근 처리가 완료되었습니다.`;
                } else if (action === 'Clock Out') {
                    statusMessage = `${currentTime}부로 퇴근 처리가 완료되었습니다.`;
                }

                $('#status-message').text(statusMessage);
                alert(statusMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            $('#status-message').text('처리 중 오류가 발생했습니다.');
            alert('오류가 발생했습니다.');
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
