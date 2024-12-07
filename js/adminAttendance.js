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
    const calendarEl = document.getElementById('calendar');
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const saveChanges = document.getElementById('saveChanges');
    const deleteEvent = document.getElementById('deleteEvent');
    const timestampInput = document.getElementById('timestampInput');
    const actionSelect = document.getElementById('actionSelect');

    let currentEmployeeId;
    let currentEvent;

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
            currentEvent = info.event;
            timestampInput.value = new Date(currentEvent.start).toISOString().slice(0, 16);
            actionSelect.value = currentEvent.extendedProps.action;
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

    saveChanges.addEventListener('click', function () {
        const updatedTimestamp = timestampInput.value;
        const updatedAction = actionSelect.value;

        if (!updatedTimestamp || !updatedAction) {
            alert('모든 필드를 입력하세요.');
            return;
        }

        $.ajax({
            method: 'PUT',
            url: `${_config.api.invokeUrl}/admin/mod-attendance`,
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: updatedTimestamp,
                action: updatedAction
            }),
            success: function () {
                alert('출근부가 수정되었습니다.');
                fetchAttendanceRecords(currentEmployeeId);
                editModal.classList.remove('active');
            },
            error: function () {
                alert('출근부 수정 중 문제가 발생했습니다.');
            }
        });
    });

    deleteEvent.addEventListener('click', function () {
        const timestampToDelete = timestampInput.value;

        $.ajax({
            method: 'DELETE',
            url: `${_config.api.invokeUrl}/admin/delete-attendance`,
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: timestampToDelete
            }),
            success: function () {
                alert('출근부가 삭제되었습니다.');
                fetchAttendanceRecords(currentEmployeeId);
                editModal.classList.remove('active');
            },
            error: function () {
                alert('출근부 삭제 중 문제가 발생했습니다.');
            }
        });
    });

    closeModal.addEventListener('click', function () {
        editModal.classList.remove('active');
    });
}(jQuery));
