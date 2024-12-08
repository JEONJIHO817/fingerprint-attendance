document.addEventListener('DOMContentLoaded', () => {
    const registerFingerprintBtn = document.getElementById('registerFingerprintBtn');
    const fingerprintForm = document.getElementById('fingerprintForm');
  
    // "Register Fingerprint" 버튼 클릭 시 모달을 띄움
    registerFingerprintBtn.addEventListener('click', () => {
      const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
      fingerprintModal.show();
    });
  
    // 폼 제출 시 처리 로직
    fingerprintForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // 폼의 기본 제출 동작을 막음
  
      // 입력값 가져오기
      const studentId = document.getElementById('studentId').value; // 학생 ID
      const fingerprintFile1 = document.getElementById('fingerprintFile1').files[0]; // 첫 번째 지문 파일
      const fingerprintFile2 = document.getElementById('fingerprintFile2').files[0]; // 두 번째 지문 파일
      const fingerprintFile3 = document.getElementById('fingerprintFile3').files[0]; // 세 번째 지문 파일
  
      // 모든 필드가 채워졌는지 확인
      if (!studentId || !fingerprintFile1 || !fingerprintFile2 || !fingerprintFile3) {
        alert('모든 필드와 파일을 업로드해주세요.');
        return; // 값이 비어있으면 종료
      }
  
      // FormData 객체를 생성하여 데이터를 준비
      const formData = new FormData();
      formData.append('studentId', studentId); // 학생 ID 추가
      formData.append('fingerprintFile1', fingerprintFile1); // 첫 번째 파일 추가
      formData.append('fingerprintFile2', fingerprintFile2); // 두 번째 파일 추가
      formData.append('fingerprintFile3', fingerprintFile3); // 세 번째 파일 추가
  
      try {
        // 인증 토큰 (예: Cognito User Pool 토큰) 추가
        const authToken = await getCognitoToken(); // 여기에 실제 인증 토큰을 입력하세요.
  
        const response = await fetch('https://tglilj6saa.execute-api.ap-northeast-2.amazonaws.com/prod/admin/registerFingerprint', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}` // 인증 헤더 추가
          },
          body: formData
        });
  
        if (response.ok) {
          const result = await response.json();
          alert('지문 데이터가 성공적으로 등록되었습니다!');
          fingerprintForm.reset();
        } else {
          const error = await response.json();
          alert(`등록 실패: ${error.message}`);
          console.error('에러 응답:', error);
        }
      } catch (error) {
        alert('지문 데이터를 등록하는 중 오류가 발생했습니다.');
        console.error('오류:', error);
      }
    });
  });
  