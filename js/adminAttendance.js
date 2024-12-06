/*global WildRydes _config */

var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;

    // 인증 토큰 설정
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            fetchStudentList(); // 학생 목록 가져오기
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token:', error);
        window.location.href = '/signin.html';
    });

    const studentDropdown = document.getElementById('studentDropdown');
    const fetchAttendanceButton = document.getElementById('fetchAttendanceButton');
    const calendarEl = document.getElementById('calendar');

    // FullCalendar 초기화
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ko',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [] // API 호출 후 동적으로 추가될 이벤트
    });

    calendar.render();

    // 학생 목록 가져오기
    function fetchStudentList() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/admin/students', // API Gateway의 경로
            headers: {
                Authorization: authToken // 인증 토큰 전달
            },
            success: function (data) {
                populateStudentDropdown(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Error fetching student list:', errorThrown);
                alert('학생 목록을 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    // 드롭다운에 학생 목록 추가
    function populateStudentDropdown(students) {
        studentDropdown.innerHTML = '<option value="">학생을 선택하세요</option>'; // 초기화

        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.employId; // employId 값을 드롭다운의 값으로 설정
            option.textContent = student.employId; // 드롭다운에 employId 표시
            studentDropdown.appendChild(option);
        });
    }

    // 조회 버튼 클릭 이벤트
    fetchAttendanceButton.addEventListener('click', function () {
        const selectedEmployId = studentDropdown.value;

        if (!selectedEmployId) {
            alert('학생을 선택하세요.');
            return;
        }

        fetchAttendanceRecords(selectedEmployId);
    });

    // 선택된 학생의 출근부 가져오기
function fetchAttendanceRecords(employId) {
    $.ajax({
        method: 'POST', // POST 메서드 사용
        url: _config.api.invokeUrl + '/admin/attendance', // API Gateway 엔드포인트
        headers: {
            Authorization: authToken
        },
        contentType: 'application/json', // JSON 페이로드로 전송
        data: JSON.stringify({ employId }), // 페이로드에 employId 포함
        success: function (data) {
            updateCalendarWithAttendance(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error fetching attendance records:', errorThrown);
            alert('출근부를 가져오는 중 문제가 발생했습니다.');
        }
    });
}


    // 캘린더 업데이트
    function updateCalendarWithAttendance(records) {
        calendar.removeAllEvents(); // 기존 이벤트 제거

        records.forEach(record => {
            calendar.addEvent({
                title: record.action === 'Clock In' ? '출근' : '퇴근',
                start: record.timestamp,
                color: record.action === 'Clock In' ? '#4caf50' : '#f44336' // 출근은 녹색, 퇴근은 빨간색
            });
        });
    }
}(jQuery));
