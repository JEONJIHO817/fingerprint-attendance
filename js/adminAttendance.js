/*global WildRydes _config */

var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;

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
    const editAttendanceButton = document.getElementById('editAttendanceButton');
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
        events: []
    });

    calendar.render();

    // 학생 목록 가져오기
    function fetchStudentList() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/admin/students', // API Gateway 경로
            headers: {
                Authorization: authToken
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

    // 드롭다운 목록 생성
    function populateStudentDropdown(students) {
        studentDropdown.innerHTML = '<option value="">학생을 선택하세요</option>'; // 초기화

        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.employeeId;
            option.textContent = `${student.employeeId} - ${student.id}`;
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

    // 출근부 데이터 가져오기
    function fetchAttendanceRecords(employeeId) {
        $.ajax({
            method: 'POST', // POST 메서드 사용
            url: _config.api.invokeUrl + '/admin/get-attendance', // URL 경로
            headers: {
                Authorization: authToken,
            },
            data: JSON.stringify({ employeeId }), // 페이로드에 employeeId 포함
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
        calendar.removeAllEvents();

        records.forEach(record => {
            calendar.addEvent({
                title: record.action === 'Clock In' ? '출근' : '퇴근',
                start: record.timestamp,
                color: record.action === 'Clock In' ? '#4caf50' : '#f44336'
            });
        });
    }

    // 수정 버튼 클릭 이벤트
    editAttendanceButton.addEventListener('click', function () {
        const selectedEmployId = studentDropdown.value;

        if (!selectedEmployId) {
            alert('학생을 선택하세요.');
            return;
        }

        const newTimestamp = prompt('새로운 타임스탬프(예: 2024-12-07T08:00:00)를 입력하세요.');
        const newAction = prompt('새로운 액션(Clock In/Clock Out)을 입력하세요.');

        if (!newTimestamp || !newAction) {
            alert('타임스탬프와 액션을 모두 입력해야 합니다.');
            return;
        }

        updateAttendanceRecord(selectedEmployId, newTimestamp, newAction);
    });

    // 출근부 데이터 수정
    function updateAttendanceRecord(employeeId, timestamp, action) {
        $.ajax({
            method: 'PUT',
            url: `${_config.api.invokeUrl}/admin/mod-attendance`, // API 경로
            headers: {
                Authorization: authToken,
            },
            data: JSON.stringify({ employeeId, timestamp, action }),
            success: function () {
                alert('출근부 수정이 완료되었습니다.');
                fetchAttendanceRecords(employeeId); // 수정 후 데이터 갱신
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Error updating attendance record:', errorThrown);
                alert('출근부 수정 중 문제가 발생했습니다.');
            }
        });
    }
}(jQuery));
