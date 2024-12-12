/*global WildRydes _config */

var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;
    let calendar;
    let currentEmployeeId;
    let selectedEvent;

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            initializeCalendar();
            fetchStudentList();
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token:', error);
        window.location.href = '/signin.html';
    });

    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
            },
            events: [],
            eventClick: function(info) {
                selectedEvent = info.event;
                showEditModal(info.event);
            }
        });
        calendar.render();
    }

    function showEditModal(event) {
        const modal = document.getElementById('editModal');
        const eventInfo = document.getElementById('eventInfo');
        eventInfo.textContent = `날짜: ${event.startStr}, 액션: ${event.extendedProps.action}`;
        modal.classList.add('active');
    }

    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('editModal').classList.remove('active');
    });

    document.getElementById('deleteEvent').addEventListener('click', function() {
        if (!selectedEvent) {
            alert('삭제할 출근 기록이 선택되지 않았습니다.');
            return;
        }

        const selectedTimestamp = selectedEvent.start;
        const kstDate = new Date(selectedTimestamp);
        const timestampToDelete = `${kstDate.getFullYear()}. ${kstDate.getMonth() + 1}. ${kstDate.getDate()}. ${kstDate.getHours()}시 ${kstDate.getMinutes()}분 ${kstDate.getSeconds()}초`;

        $.ajax({
            method: 'DELETE',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: timestampToDelete
            }),
            success: function() {
                alert('출근 기록이 삭제되었습니다.');
                fetchAttendanceRecords(currentEmployeeId);
                document.getElementById('editModal').classList.remove('active');
            },
            error: function() {
                alert('출근 기록 삭제 중 문제가 발생했습니다.');
            }
        });
    });

    function fetchStudentList() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/admin/students',
            headers: { Authorization: authToken },
            success: function(response) {
                const students = JSON.parse(response.body);
                populateStudentDropdown(students);
            },
            error: function() {
                alert('학생 목록을 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function populateStudentDropdown(students) {
        const dropdown = document.getElementById('studentDropdown');
        dropdown.innerHTML = '<option value="">학생을 선택하세요</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.employeeId;
            option.textContent = `${student.employeeId} - ${student.id}`;
            dropdown.appendChild(option);
        });
    }

    document.getElementById('fetchAttendanceButton').addEventListener('click', function() {
        currentEmployeeId = document.getElementById('studentDropdown').value;
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
            error: function() {
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
                console.error('Invalid timestamp format:', record.timestamp);
                return;
            }

            calendar.addEvent({
                title: record.action === 'Clock In' ? '출근' : '퇴근',
                start: parsedDate.toISOString(),
                className: record.action.toLowerCase().replace(' ', ''),
                extendedProps: { action: record.action }
            });
        });
    }

    document.getElementById('addRecordButton').addEventListener('click', function() {
        const dateToAdd = prompt('추가할 날짜를 입력하세요 (YYYY-MM-DD):');
        const timeToAdd = prompt('추가할 시간을 입력하세요 (HH:mm):');
        const action = prompt('추가할 액션을 입력하세요 (Clock In/Clock