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
    const calendarEl = document.getElementById('calendar');
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const deleteEvent = document.getElementById('deleteEvent');
    const eventInfo = document.getElementById('eventInfo');

    let currentEmployeeId;
    let selectedDate;
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
            selectedDate = info.event.startStr;
            eventInfo.textContent = `날짜: ${selectedDate}, 액션: ${selectedEvent.extendedProps.action}`;
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
            calendar.addEvent({
                title: record.action === 'Clock In' ? '출근' : '퇴근',
                start: record.timestamp,
                color: record.action === 'Clock In' ? '#4caf50' : '#f44336',
                extendedProps: { action: record.action }
            });
        });
    }

    deleteEvent.addEventListener('click', function () {
        if (!selectedEvent) {
            alert('삭제할 출근 기록이 선택되지 않았습니다.');
            return;
        }

        const timestampToDelete = new Date(selectedEvent.start).toISOString();

        $.ajax({
            method: 'DELETE',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: timestampToDelete
            }),
            success: function () {
                alert('출근 기록이 삭제되었습니다.');
                fetchAttendanceRecords(currentEmployeeId);
                editModal.classList.remove('active');
            },
            error: function () {
                alert('출근 기록 삭제 중 문제가 발생했습니다.');
            }
        });
    });

    addRecordButton.addEventListener('click', function () {
        const dateToAdd = prompt('추가할 날짜를 입력하세요 (YYYY-MM-DD):');
        const timeToAdd = prompt('추가할 시간을 입력하세요 (HH:mm):');
        const action = prompt('추가할 액션을 입력하세요 (Clock In/Clock Out):');

        if (!dateToAdd || !timeToAdd || !action || (action !== 'Clock In' && action !== 'Clock Out')) {
            alert('올바른 날짜, 시간 및 액션을 입력하세요.');
            return;
        }

        const timestamp = `${dateToAdd}T${timeToAdd}:00`;

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: timestamp,
                action: action
            }),
            success: function () {
                alert('출근 기록이 추가되었습니다.');
                fetchAttendanceRecords(currentEmployeeId);
            },
            error: function () {
                alert('출근 기록 추가 중 문제가 발생했습니다.');
            }
        });
    });

    closeModal.addEventListener('click', function () {
        editModal.classList.remove('active');
    });
}(jQuery));
