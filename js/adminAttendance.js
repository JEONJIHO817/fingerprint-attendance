// adminAttendance.js
var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;
    let currentEmployeeId;
    let currentDate = new Date();
    let selectedDate = null;
    let selectedRecord = null;

    // 인증 토큰 확인
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            init();
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token:', error);
        window.location.href = '/signin.html';
    });

    function init() {
        renderCalendar();
        fetchStudentList();
        addEventListeners();
    }

    function addEventListeners() {
        // 날짜 네비게이션
        document.querySelector('.prev').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        document.querySelector('.next').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        // Today 버튼
        document.getElementById('todayBtn').addEventListener('click', () => {
            currentDate = new Date();
            renderCalendar();
        });

        // 조회 버튼
        document.getElementById('fetchAttendanceButton').addEventListener('click', () => {
            currentEmployeeId = document.getElementById('studentDropdown').value;
            if (!currentEmployeeId) {
                alert('학생을 선택하세요.');
                return;
            }
            fetchAttendanceRecords(currentEmployeeId);
        });

        // 기록 추가 버튼
        document.querySelector('.record-add-btn').addEventListener('click', () => {
            if (!currentEmployeeId) {
                alert('먼저 학생을 선택해주세요.');
                return;
            }
            document.getElementById('recordModal').classList.add('active');
        });

        // 모달 닫기 버튼들
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });

        // 기록 저장 버튼
        document.getElementById('saveBtn').addEventListener('click', saveRecord);

        // 기록 삭제 버튼
        document.getElementById('deleteBtn').addEventListener('click', deleteRecord);

        // BACK 버튼
        document.querySelector('.back-btn').addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // 연도와 월 표시 업데이트
        document.querySelector('.year-display').textContent = year.toString().split('').join(' ');
        document.querySelector('.month-number').textContent = month + 1;
        document.querySelector('.month-name').textContent = 
            new Date(year, month).toLocaleString('en', { month: 'long' });

        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 이전 달의 날짜들
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            calendar.appendChild(createDateElement(prevMonthDays - i, true));
        }

        // 현재 달의 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            calendar.appendChild(createDateElement(day, false));
        }

        // 다음 달의 날짜들 (6주 채우기)
        const remainingDays = 42 - (firstDay + daysInMonth);
        for (let day = 1; day <= remainingDays; day++) {
            calendar.appendChild(createDateElement(day, true));
        }
    }

    function createDateElement(day, isOtherMonth) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date';
        if (isOtherMonth) dateDiv.classList.add('other-month');

        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        dateDiv.appendChild(dateNumber);

        if (!isOtherMonth) {
            const dateStr = formatDateString(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                day
            );
            dateDiv.setAttribute('data-date', dateStr);
        }

        return dateDiv;
    }

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
        dropdown.innerHTML = '<option value="">학생 선택</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.employeeId;
            option.textContent = `${student.employeeId} - ${student.id}`;
            dropdown.appendChild(option);
        });
    }

    function fetchAttendanceRecords(employeeId) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/admin/get-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({ employeeId }),
            success: function(records) {
                updateCalendarWithRecords(records);
            },
            error: function() {
                alert('출근부를 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function updateCalendarWithRecords(records) {
        document.querySelectorAll('.date').forEach(dateDiv => {
            dateDiv.classList.remove('clockin', 'clockout');
            dateDiv.querySelector('.work-time')?.remove();
            
            // 클릭 이벤트 리스너 제거
            const newDateDiv = dateDiv.cloneNode(true);
            dateDiv.parentNode.replaceChild(newDateDiv, dateDiv);
        });

        records.forEach(record => {
            const timestampRegex = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2})시\s*(\d{1,2})분\s*(\d{1,2})초/;
            const match = record.timestamp.match(timestampRegex);

            if (match) {
                const [_, year, month, day, hour, minute] = match.map(Number);
                const dateKey = formatDateString(year, month, day);
                const dateDiv = document.querySelector(`[data-date="${dateKey}"]`);

                if (dateDiv && !dateDiv.classList.contains('other-month')) {
                    dateDiv.classList.add(record.action.toLowerCase().replace(' ', ''));
                    
                    let workTimeDiv = dateDiv.querySelector('.work-time');
                    if (!workTimeDiv) {
                        workTimeDiv = document.createElement('div');
                        workTimeDiv.className = 'work-time';
                        dateDiv.appendChild(workTimeDiv);
                    }
                    
                    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    workTimeDiv.textContent = record.action === 'Clock In' ? 
                        `${timeStr} 출근` : `${timeStr} 퇴근`;

                    // 클릭 이벤트 추가
                    dateDiv.addEventListener('click', () => {
                        selectedRecord = record;
                        showDeleteModal(dateKey);
                    });
                }
            }
        });
    }

    function showDeleteModal(dateStr) {
        const deleteModal = document.getElementById('deleteModal');
        document.getElementById('deleteInfo').textContent = 
            `${dateStr} 의 출/퇴근 기록을 삭제하시겠습니까?`;
        deleteModal.classList.add('active');
    }

    function deleteRecord() {
        if (!selectedRecord || !currentEmployeeId) return;

        $.ajax({
            method: 'DELETE',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: selectedRecord.timestamp
            }),
            success: function() {
                alert('출근 기록이 삭제되었습니다.');
                closeModals();
                fetchAttendanceRecords(currentEmployeeId);
            },
            error: function() {
                alert('출근 기록 삭제 중 문제가 발생했습니다.');
            }
        });
    }

    function formatDateString(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function saveRecord() {
        const date = document.getElementById('recordDate').value;
        const time = document.getElementById('recordTime').value;
        const type = document.getElementById('recordType').value;

        if (!date || !time) {
            alert('날짜와 시간을 모두 입력해주세요.');
            return;
        }

        const timestamp = new Date(`${date}T${time}`);
        const formattedTimestamp = `${timestamp.getFullYear()}. ${
            timestamp.getMonth() + 1
        }. ${timestamp.getDate()}. ${timestamp.getHours()}시 ${
            timestamp.getMinutes()
        }분 ${timestamp.getSeconds()}초`;

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: formattedTimestamp,
                action: type
            }),
            success: function() {
                alert('기록이 저장되었습니다.');
                closeModals();
                fetchAttendanceRecords(currentEmployeeId);
            },
            error: function() {
                alert('기록 저장 중 문제가 발생했습니다.');
            }
        });
    }

    function closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

}(jQuery));