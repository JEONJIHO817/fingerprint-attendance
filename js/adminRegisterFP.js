/* global _config */
(function adminPortalScopeWrapper($) {
    let authToken;

       // 암호화 함수 추가
   function encryptData(data) {
    return CryptoJS.AES.encrypt(data, _config.encryption.key).toString();
    }

    // 민감한 데이터 초기화 함수
    function clearSensitiveData(files, base64Data) {
        console.log('=== 데이터 초기화 시작 ===');
        
        console.log('초기화 전 상태:');
        console.log('파일 입력값 존재 여부:', files.map(f => f ? 'Yes' : 'No'));
        console.log('Base64 데이터 존재 여부:', base64Data.map(d => d ? 'Yes' : 'No'));

        // 파일 입력 초기화
        files.forEach(fileInput => {
            if (fileInput) {
                fileInput.value = '';
            }
        });

        // Base64 데이터 초기화
        base64Data.forEach((data, index) => {
            if (data) {
                base64Data[index] = null;
            }
        });

        console.log('\n초기화 후 상태:');
        console.log('파일 입력값 존재 여부:', files.map(f => f ? 'Yes' : 'No'));
        console.log('Base64 데이터 존재 여부:', base64Data.map(d => d ? 'Yes' : 'No'));

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

    // Base64 변환 함수
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Base64만 추출
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };
    
   // 지문 등록 폼 제출 이벤트 수정
   $('#register').click(async function (event) {
        event.preventDefault();

        const studentId = $('#student-id').val();
        const fileInputs = [
            $('#fingerprint-upload-1')[0],
            $('#fingerprint-upload-2')[0],
            $('#fingerprint-upload-3')[0]
        ];
        const files = fileInputs.map(input => input.files[0]);
        let fingerprintBase64Data = [null, null, null];

        if (!studentId || !files[0] || !files[1] || !files[2]) {
            alert('모든 필드를 입력하고 파일을 업로드하세요.');
            return;
        }

        try {
            // 1. Base64 변환
            fingerprintBase64Data = await Promise.all(files.map(file => convertFileToBase64(file)));
            
            // 2. Base64 데이터 암호화
            const encryptedData = fingerprintBase64Data.map(base64 => encryptData(base64));

            // 3. API Gateway로 전송할 암호화된 페이로드
            const payload = {
                studentId,
                fingerprintFile1: encryptedData[0],
                fingerprintFile2: encryptedData[1],
                fingerprintFile3: encryptedData[2],
                isEncrypted: true  // 암호화 여부 표시
            };

            await $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/admin/registerFingerprint',
                headers: {
                    Authorization: authToken,
                },
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: function () {
                    alert('Fingerprint registered successfully!');
                    $('#fingerprintModal').modal('hide');
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error('Error registering fingerprint: ', textStatus, errorThrown);
                    alert('Error occurred during fingerprint registration.');
                },
            });
        } catch (error) {
            console.error('Error processing files:', error);
            alert('파일 처리 중 오류가 발생했습니다.');
        } finally {
            // 민감한 데이터 초기화
            clearSensitiveData(fileInputs, fingerprintBase64Data);
            $('#student-id').val('');
        }
    });
})(jQuery);