/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.admin = WildRydes.admin || {};

// Fingerprint Modal Elements
const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
const fingerprintForm = document.getElementById('fingerprintForm');

// 출근부 조회 버튼 클릭 이벤트
document.getElementById('viewAllAttendanceBtn').onclick = function () {
    console.log('Redirecting to attendance page...');
    window.location.href = '/adminAttendance.html'; // 출근부 조회 페이지로 리디렉션
};

document.addEventListener('DOMContentLoaded', () => {
    const registerFingerprintBtn = document.getElementById('registerFingerprintBtn');
    const fingerprintForm = document.getElementById('fingerprintForm');
  
    // "Register Fingerprint" 버튼 클릭 시 모달을 띄움
    registerFingerprintBtn.addEventListener('click', () => {
      const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
      fingerprintModal.show();
    });
  
    // 지문 등록 폼 제출 이벤트
    fingerprintForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // 기본 폼 제출 동작 차단

      // 입력값 가져오기
      const studentId = document.getElementById('studentId').value;
      const fingerprintFile1 = document.getElementById('fingerprintFile1').files[0];
      const fingerprintFile2 = document.getElementById('fingerprintFile2').files[0];
      const fingerprintFile3 = document.getElementById('fingerprintFile3').files[0];

      if (!studentId || !fingerprintFile1 || !fingerprintFile2 || !fingerprintFile3) {
          alert('모든 필드와 파일을 업로드해주세요.');
          return;
      }

      try {
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
          // 각 파일을 Base64로 변환
          const fileToBase64 = (file) => new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result.split(',')[1]); // Base64 문자열만 가져오기
              reader.onerror = (error) => reject(error);
              reader.readAsDataURL(file);
          });

          const fingerprintBase64_1 = await fileToBase64(fingerprintFile1);
          const fingerprintBase64_2 = await fileToBase64(fingerprintFile2);
          const fingerprintBase64_3 = await fileToBase64(fingerprintFile3);

          // JSON 요청 본문 생성
          const requestBody = JSON.stringify({
              studentId: studentId,
              fingerprintFile1: fingerprintBase64_1,
              fingerprintFile2: fingerprintBase64_2,
              fingerprintFile3: fingerprintBase64_3
          });

          // API Gateway로 POST 요청 전송
          const response = await fetch(`${_config.api.invokeUrl}/admin/registerFingerprint`, {
              method: 'POST',
              headers: {
                  Authorization: authToken,
                  'Content-Type': 'application/json'
              },
              body: requestBody
          });

          if (response.ok) {
              const result = await response.json();
              alert('지문 데이터가 성공적으로 등록되었습니다!');
              console.log('API 응답:', result);
              fingerprintForm.reset(); // 폼 초기화
              fingerprintModal.hide(); // 모달 닫기
          } else {
              const error = await response.text();
              alert('지문 데이터 등록에 실패했습니다.');
              console.error('에러 응답:', error);
          }
      } catch (error) {
          alert('지문 데이터를 등록하는 중 오류가 발생했습니다.');
          console.error('오류:', error);
      }
    });
});