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

    // Base64 변환 함수
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Base64만 추출
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // RSA 암호화 함수
    const publicKeyPem = `
    -----BEGIN PUBLIC KEY-----
    MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEApZoZpWiZZy3vovHUxqP3
    aCMlz0Y6f3QEt80bKNOPMHaIHVC5Q5EFlbn9ltSHuYIu+HxCcpksiHBAlVrjsvi4
    Egm1r3u178f6CQyCWDYj7y9WLDvgpFk9EezfPAqMoAZh/20dtqWf3KYlFrECdSDo
    lxTB4mspkSfqy0xaGyDpJsAauSypiF7aurK+r8B+YoNTTU0pR5+sYSuZkO2eEE1d
    aQOa0QDmrZJJT1gGJr/hOCIJAJk9rmNLz5ilE+SKiJfKpblCq8HmT2q1+zcs3yKq
    9k6f06UNMTLOtnkoL1Aib1UM2bUW9lOTfLj0RZTfty7oaWlp4FbQAudz9QoBsWuT
    IGn2X63CKVYz0P+3vRaTzMHBIlADV+bw55rStZbtXL4jjcwGr+q7xfaN4lUjoyuV
    t6GBRc4qtRfKTwpD9K0J40csC0N+P0+NDjRCCsP2TGm4jOCj92yj6yNX10a8sSWv
    ywByUJ8WqPJOZSATAlPR7idQBt0331D6vL2hnr7CP8dY8yr7B9A47NZ8IgblyQpS
    eOghP+0wRlyKxL8LWYjMBR5EBAG9pgUp3OTBOMvny3R8ga1rgpdPiTuIzKQdXJwq
    eNsHZHTPmbPGli1MprXfVn9UV6FNr3xgyDg1w9hqtmwL4FYcKvXLUDWHieTWC0pI
    L++NYu8SgfKzZd1+iVUyu70CAwEAAQ==
    -----END PUBLIC KEY-----
    `;

    const encryptData = (data) => {
        const forge = window.forge;
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const encrypted = publicKey.encrypt(data, 'RSA-OAEP');
        return forge.util.encode64(encrypted); // 암호화 데이터를 Base64로 변환
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
            // 파일을 Base64로 변환
            const fingerprintFile1 = await convertFileToBase64(file1);
            const fingerprintFile2 = await convertFileToBase64(file2);
            const fingerprintFile3 = await convertFileToBase64(file3);

            // Base64 데이터를 RSA로 암호화
            const encryptedFingerprintFile1 = encryptData(fingerprintFile1);
            const encryptedFingerprintFile2 = encryptData(fingerprintFile2);
            const encryptedFingerprintFile3 = encryptData(fingerprintFile3);

            // 암호화된 데이터를 payload에 포함
            const payload = {
                studentId,
                fingerprintFile1: encryptedFingerprintFile1,
                fingerprintFile2: encryptedFingerprintFile2,
                fingerprintFile3: encryptedFingerprintFile3,
            };

            // 서버로 전송
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
