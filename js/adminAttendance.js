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
    const editModal = document.getElementById('editModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const editTimestampInput = document.getElementById('editTimestamp');
    const saveEditButton = document.getElementById('saveEditButton');
    const closeModalButton = document.getElementById('closeModalButton');
    const calendarEl = document.getElementById('calendar');

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
            openEditModal(info.event);
        }
    });

    calendar.render();

    function fetchStudentList() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/admin/students',
            headers: {
                Authorization: authToken
            },
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
        const employeeId = studentDropdown.value;
        if (!employeeId) {
            alert('학생을 선택하세요.');
            return;
        }

        fetchAttendanceRecords(employeeId);
    });

    function fetchAttendanceRecords(employeeId) {
        $.ajax({
            method: 'POST',
            url: `${_config.api.invokeUrl}/admin/get-attendance`,
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
                id: record.timestamp,
                title: record.action === 'Clock In' ? '출근' : '퇴근',
                start: record.timestamp,
                color: record.action === 'Clock In' ? '#4caf50' : '#f44336',
                extendedProps: { employeeId: record.employeeId }
            });
        });
    }

    function openEditModal(event) {
        editTimestampInput.value = event.start.toISOString().slice(0, 16);
        editModal.style.display = 'block';
        modalOverlay.style.display = 'block';

        saveEditButton.onclick = function () {
            const updatedTimestamp = editTimestampInput.value;
            if (!updatedTimestamp) {
                alert('타임스탬프를 입력하세요.');
                return;
            }

            updateAttendanceRecord(event.extendedProps.employeeId, event.id, updatedTimestamp, event);
        };
    }

    closeModalButton.onclick = function () {
        closeEditModal();
    };

    function closeEditModal() {
        editModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    }

    function updateAttendanceRecord(employeeId, oldTimestamp, newTimestamp, event) {
        $.ajax({
            method: 'PUT',
            url: `${_config.api.invokeUrl}/admin/mod-attendance`,
            headers: { Authorization: authToken },
            data: JSON.stringify({ employeeId, oldTimestamp, newTimestamp }),
            success: function () {
                alert('출근부 수정이 완료되었습니다.');
                event.setStart(new Date(newTimestamp));
                closeEditModal();
            },
            error: function () {
                alert('출근부 수정 중 문제가 발생했습니다.');
            }
        });
    }
}(jQuery));
