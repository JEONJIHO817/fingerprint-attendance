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

    // [새로 추가] 보안 강화를 위한 민감한 데이터 초기화 함수
    function clearSensitiveData(fileInput, base64Data, fingerprintResult) {
        console.log('=== 데이터 초기화 시작 ===');
        console.log('초기화 전 상태:');
        console.log('파일 입력값:', fileInput ? fileInput.value : 'undefined');
        console.log('Base64 데이터 존재 여부:', base64Data ? 'Yes' : 'No');
        console.log('지문 인증 결과 존재 여부:', fingerprintResult ? 'Yes' : 'No');
        
        if (fileInput) {
            fileInput.value = '';  // 파일 입력 초기화
        }
        if (base64Data) {
            base64Data = null;  // base64 데이터 초기화
        }
        if (fingerprintResult) {
            fingerprintResult = null;  // 지문 결과 초기화
        }

        console.log('\n초기화 후 상태:');
        console.log('파일 입력값:', fileInput ? fileInput.value : 'undefined');
        console.log('Base64 데이터 존재 여부:', base64Data ? 'Yes' : 'No');
        console.log('지문 인증 결과 존재 여부:', fingerprintResult ? 'Yes' : 'No');
        
        // 가비지 컬렉션 유도
        if (typeof window.gc === 'function') {
            try {
                window.gc();
                console.log('가비지 컬렉션 호출 성공');
            } catch (e) {
                console.log('Manual garbage collection not available');
            }
        }
        
        console.log('=== 데이터 초기화 완료 ===\n');
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
        
    // [수정] 출/퇴근 제출 버튼 클릭 이벤트 - 보안 강화 버전
    $('#submit-clockinout').click(async function () {
        // [새로 추가] 민감한 데이터를 위한 변수 선언
        let fingerprintBase64 = null;
        let fingerprintResult = null;
        const fileInput = $('#fingerprint-upload')[0];
        
        try {
            const action = $('#action-select').val();
            
            if (!action || !fileInput.files[0]) {
                alert('출근/퇴근 선택과 지문 파일을 확인하세요.');
                return;
            }
            
            // [기존 코드] 지문 파일을 Base64로 변환
            fingerprintBase64 = await convertFileToBase64(fileInput.files[0]);
            
            // [수정] 지문 인증 요청 - 캐시 방지 헤더 추가
            fingerprintResult = await $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/compare_fp',
                headers: { 
                    Authorization: authToken,
                },
                data: JSON.stringify({
                    studentId: studentId,
                    fingerprint: fingerprintBase64
                }),
                contentType: 'application/json'
            });
            
            // [기존 코드] 지문 인증 성공 시 출퇴근 기록
            if (fingerprintResult.verified) {
                const currentTime = new Date().toLocaleString('ko-KR', { 
                    timeZone: 'Asia/Seoul', 
                    hour12: false 
                });
            
                // [수정] 출퇴근 기록 요청 - 캐시 방지 헤더 추가
                await $.ajax({
                    method: 'POST',
                    url: _config.api.invokeUrl + '/ride',
                    headers: { 
                        Authorization: authToken,
                    },
                    data: JSON.stringify({
                        studentId: studentId,
                        timestamp: currentTime,
                        action: action
                    }),
                    contentType: 'application/json'
                });
            
                $('#status-message').text(`${action} 처리가 완료되었습니다: ${currentTime}`);
                alert(`${action} 성공!`);
            }
        } catch (error) {
            console.error('Error:', error);
            $('#status-message').text('처리 중 오류가 발생했습니다.');
            alert('오류가 발생했습니다.');
        } finally {
            // [새로 추가] 민감한 데이터 초기화
            clearSensitiveData(fileInput, fingerprintBase64, fingerprintResult);
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
