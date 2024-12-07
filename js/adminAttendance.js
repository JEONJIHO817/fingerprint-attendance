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
    const fetchAttendanceButton = document.getElementById('fetchAttendanceButton');
    const addRecordButton = document.getElementById('addRecordButton');
    const updateRecordButton = document.getElementById('updateRecordButton');
    const calendarEl = document.getElementById('calendar');
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const deleteEvent = document.getElementById('deleteEvent');
    const eventInfo = document.getElementById('eventInfo');

    let currentEmployeeId;
    let selectedEvent;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ko',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [],
        eventClick: function (info) {
            selectedEvent = info.event;
            const timestamp = selectedEvent.start.toISOString();
            const action = selectedEvent.extendedProps.action;

            eventInfo.textContent = `날짜: ${timestamp}, 액션: ${action}`;
            editModal.classList.add('active');
        }
    });

    calendar.render();

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

    fetchAttendanceButton.addEventListener('click', function () {
        currentEmployeeId = studentDropdown.value;
        if (!currentEmployeeId) {
            alert('학생을 선택하세요.');
            return;
        }
        fetchAttendanceRecords(currentEmployeeId);
    });

    function fetchAttendanceRecords(employeeId) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/admin/get-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({ employeeId }),
            success: updateCalendarWithAttendance,
            error: function () {
                alert('출근부를 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function updateCalendarWithAttendance(records) {
        calendar.removeAllEvents();
        records.forEach(record => {
            const timestampRegex = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2})시\s*(\d{1,2})분\s*(\d{1,2})초/;
            const match = record.timestamp.match(timestampRegex);

            let parsedDate;
            if (match) {
                const [_, year, month, day, hour, minute, second] = match.map(Number);
                parsedDate = new Date(year, month - 1, day, hour, minute, second);
            } else {
                parsedDate = new Date(record.timestamp); // ISO 형식일 경우
            }

            calendar.addEvent({
                title: record.action === 'Clock In' ? '출근' : '퇴근',
                start: parsedDate.toISOString(),
                color: record.action === 'Clock In' ? '#4caf50' : '#f44336',
                extendedProps: { action: record.action }
            });
        });
    }

    // 출근부 기록 수정
    updateRecordButton.addEventListener('click', function () {
        if (!selectedEvent) {
            alert('수정할 기록을 선택하세요.');
            return;
        }

        const newDate = prompt('새로운 날짜를 입력하세요 (YYYY-MM-DD):');
        const newTime = prompt('새로운 시간을 입력하세요 (HH:mm):');
        const newAction = prompt('새로운 액션을 입력하세요 (Clock In/Clock Out):');

        if (!newDate || !newTime || !newAction || (newAction !== 'Clock In' && newAction !== 'Clock Out')) {
            alert('올바른 날짜, 시간 및 액션을 입력하세요.');
            return;
        }

        const newTimestamp = `${newDate}T${newTime}:00`;

        $.ajax({
            method: 'PUT',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                oldTimestamp: selectedEvent.start.toISOString(),
                newTimestamp: newTimestamp,
                action: newAction
            }),
            success: function () {
                alert('출근 기록이 수정되었습니다.');
                fetchAttendanceRecords(currentEmployeeId);
                editModal.classList.remove('active');
            },
            error: function () {
                alert('출근 기록 수정 중 문제가 발생했습니다.');
            }
        });
    });

    closeModal.addEventListener('click', function () {
        editModal.classList.remove('active');
    });
}(jQuery));
