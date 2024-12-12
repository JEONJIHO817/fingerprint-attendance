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

    // 지문 등록 폼 제출 이벤트
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Base64만 추출
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };
    
    $('#register').click(async function (event) {
        event.preventDefault();
    
        const studentId = $('#student-id').val();
        const file1 = $('#fingerprint-upload-1')[0].files[0];
        const file2 = $('#fingerprint-upload-2')[0].files[0];
        const file3 = $('#fingerprint-upload-3')[0].files[0];
    
        if (!studentId || !file1 || !file2 || !file3) {
            alert('모든 필드를 입력하고 파일을 업로드하세요.');
            return;
        }
    
        try {
            const fingerprintFile1 = await convertFileToBase64(file1);
            const fingerprintFile2 = await convertFileToBase64(file2);
            const fingerprintFile3 = await convertFileToBase64(file3);
    
            const payload = {
                studentId,
                fingerprintFile1,
                fingerprintFile2,
                fingerprintFile3,
            };
    
            $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/admin/registerFingerprint',
                headers: {
                    Authorization: authToken,
                },
                contentType: 'application/json',
                data: JSON.stringify(payload), // JSON 형태로 전송
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
        }
    });
})(jQuery);