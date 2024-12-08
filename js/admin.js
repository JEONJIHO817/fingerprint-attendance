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
        // API Gateway에 POST 요청 보내기
        const response = await fetch('https://tglilj6saa.execute-api.ap-northeast-2.amazonaws.com/prod/admin/registerFingerprint', { // API Gateway 엔드포인트를 실제 값으로 대체해야 함
          method: 'POST',
          body: formData // FormData를 요청 본문에 포함
        });
  
        // 요청 성공 여부 확인
        if (response.ok) {
          const result = await response.json(); // 응답 데이터를 JSON으로 변환
          alert('지문 데이터가 성공적으로 등록되었습니다!'); // 성공 메시지 표시
          console.log('API 응답:', result); // 디버깅용 응답 데이터 출력
          fingerprintForm.reset(); // 폼 초기화
        } else {
          const error = await response.text(); // 에러 메시지 확인
          alert('지문 데이터 등록에 실패했습니다.');
          console.error('에러 응답:', error); // 에러 로그 출력
        }
      } catch (error) {
        // 네트워크 또는 기타 오류 처리
        alert('지문 데이터를 등록하는 중 오류가 발생했습니다.');
        console.error('오류:', error); // 에러 로그 출력
      }
    });
  });
  