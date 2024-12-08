import { Auth } from 'aws-amplify';

// AWS Amplify를 통해 Cognito 설정
Auth.configure({
    region: 'ap-northeast-2', // Cognito User Pool의 AWS Region
    userPoolId: 'ap-northeast-2_35jaq3PLD', // Cognito User Pool ID
    userPoolWebClientId: '3j6k0r1364pq6q4gasqvm2l6fq', // Cognito App Client ID
});

// Cognito 로그인 및 ID 토큰 발급 함수
async function getToken() {
    try {
        const user = await Auth.signIn('wlgh9030@gmail.com', 'Jh1054082!'); // 사용자 인증
        return user.signInUserSession.idToken.jwtToken; // Cognito ID Token 반환
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
}

// 지문 등록 버튼 클릭 이벤트
document.getElementById('registerFingerprintBtn').onclick = function () {
    const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
    fingerprintModal.show(); // 지문 등록 모달 표시
};

// 지문 등록 폼 제출 이벤트
document.getElementById('fingerprintForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // 입력 데이터 가져오기
    const studentId = document.getElementById('studentId').value;
    const fingerprintFiles = [
        document.getElementById('fingerprintFile1').files[0],
        document.getElementById('fingerprintFile2').files[0],
        document.getElementById('fingerprintFile3').files[0],
    ];

    // 유효성 검사
    if (!studentId || fingerprintFiles.some(file => !file)) {
        alert('Please fill out all fields and upload all files.');
        return;
    }

    // FormData에 데이터 추가
    const formData = new FormData();
    formData.append('studentId', studentId);
    fingerprintFiles.forEach((file, index) => {
        formData.append(`fingerprintFile${index + 1}`, file); // 파일 추가
    });

    // Cognito 토큰 가져오기
    const idToken = await getToken();

    try {
        // API Gateway로 요청 보내기
        const response = await fetch(
            'https://tglilj6saa.execute-api.ap-northeast-2.amazonaws.com/prod/admin/registerFingerprint',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`, // Cognito ID Token
                },
                body: formData, // FormData를 요청 본문으로 전달
            }
        );

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('API Error:', errorDetails);
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Success:', result);
        alert('Fingerprint registration successful!');
    } catch (error) {
        console.error('Error calling API:', error);
        alert('Failed to register fingerprints. Please try again later.');
    }
});
