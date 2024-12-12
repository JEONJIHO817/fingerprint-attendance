// adminAttendance.js
var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;
    let selectedStudent = null;
    let currentDate = new Date();

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

        // 모달 관련
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });

        document.querySelector('.student-select-btn').addEventListener('click', () => {
            document.getElementById('studentModal').classList.add('active');
        });

        document.querySelector('.record-add-btn').addEventListener('click', showAddRecordModal);

        document.getElementById('saveBtn').addEventListener('click', saveRecord);
        document.getElementById('viewBtn').addEventListener('click', viewStudentRecords);

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

        if (!isOtherMonth && selectedStudent) {
            // 출퇴근 기록 표시 로직
            const currentDateStr = formatDateString(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                day
            );
            if (selectedStudent.records && selectedStudent.records[currentDateStr]) {
                const record = selectedStudent.records[currentDateStr];
                dateDiv.classList.add(record.type.toLowerCase().replace(' ', ''));
            }
        }

        return dateDiv;
    }

    function formatDateString(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function fetchStudentList() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/admin/students',
            headers: { Authorization: authToken },
            success: function(response) {
                const students = JSON.parse(response.body);
                renderStudentList(students);
            },
            error: function() {
                alert('학생 목록을 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function renderStudentList(students) {
        const studentList = document.querySelector('.student-list');
        studentList.innerHTML = '';
        
        students.forEach(student => {
            const studentItem = document.createElement('div');
            studentItem.className = 'student-item';
            studentItem.textContent = `${student.employeeId} - ${student.id}`;
            
            studentItem.addEventListener('click', () => {
                document.querySelectorAll('.student-item').forEach(item => {
                    item.classList.remove('selected');
                });
                studentItem.classList.add('selected');
                selectedStudent = student;
            });
            
            studentList.appendChild(studentItem);
        });
    }

    function viewStudentRecords() {
        if (!selectedStudent) {
            alert('학생을 선택해주세요.');
            return;
        }

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/admin/get-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({ employeeId: selectedStudent.employeeId }),
            success: function(records) {
                selectedStudent.records = formatRecords(records);
                closeModals();
                renderCalendar();
            },
            error: function() {
                alert('출근부를 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function formatRecords(records) {
        const formatted = {};
        records.forEach(record => {
            const date = new Date(record.timestamp);
            const dateKey = formatDateString(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
            );
            formatted[dateKey] = {
                type: record.action,
                timestamp: record.timestamp
            };
        });
        return formatted;
    }

    function showAddRecordModal() {
        if (!selectedStudent) {
            alert('먼저 학생을 선택해주세요.');
            return;
        }
        document.getElementById('recordModal').classList.add('active');
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
                employeeId: selectedStudent.employeeId,
                timestamp: formattedTimestamp,
                action: type
            }),
            success: function() {
                alert('기록이 저장되었습니다.');
                closeModals();
                viewStudentRecords();
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