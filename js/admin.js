/*global WildRydes _config */

var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            fetchStudentList();
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token:', error);
        window.location.href = '/signin.html';
    });

    const studentDropdown = document.getElementById('studentDropdown');
    const registerFingerprintBtn = document.getElementById('registerFingerprintBtn');
    const fingerprintForm = document.getElementById('fingerprintForm');
    const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));

    let currentEmployeeId;

    function fetchStudentList() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/admin/students',
            headers: { Authorization: authToken },
            success: populateStudentDropdown,
            error: function () {
                alert('학생 목록을 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function populateStudentDropdown(students) {
        studentDropdown.innerHTML = '<option value="">학생을 선택하세요</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.employeeId;
            option.textContent = `${student.employeeId} - ${student.id}`;
            studentDropdown.appendChild(option);
        });
    }

    // "Register Fingerprint" 버튼 클릭 시 모달을 띄움
    registerFingerprintBtn.addEventListener('click', () => {
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

        // FormData 객체를 생성하여 데이터를 준비
        const formData = new FormData();
        formData.append('studentId', studentId);
        formData.append('fingerprintFile1', fingerprintFile1);
        formData.append('fingerprintFile2', fingerprintFile2);
        formData.append('fingerprintFile3', fingerprintFile3);

        try {
            const response = await fetch(`${_config.api.invokeUrl}/admin/registerFingerprint`, {
                method: 'POST',
                headers: {
                    Authorization: authToken
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert('지문 데이터가 성공적으로 등록되었습니다!');
                console.log('API 응답:', result);
                fingerprintForm.reset();
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
}(jQuery));
