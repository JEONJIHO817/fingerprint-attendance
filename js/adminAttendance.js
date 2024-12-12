/*global WildRydes _config */

var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;
    let currentEmployeeId;
    let selectedDate;
    let selectedEvent;

    class AdminCalendar {
        constructor() {
            this.init();
        }

        init() {
            // 초기 설정
            this.date = new Date();
            this.currentYear = this.date.getFullYear();
            this.currentMonth = this.date.getMonth();
            this.selectedDate = null;
            this.today = new Date(
                this.date.getFullYear(),
                this.date.getMonth(),
                this.date.getDate()
            ).getTime();
            
            this.renderCalendar();
            this.addEventListeners();
        }

        renderCalendar() {
            const calendar = document.getElementById('calendar');
            const monthNumber = document.querySelector('.month-number');
            const monthName = document.querySelector('.month-name');
            const year = document.querySelector('.year');
            
            calendar.innerHTML = '';
            monthNumber.textContent = this.currentMonth + 1;
            monthName.textContent = new Date(this.currentYear, this.currentMonth)
                .toLocaleString('ko', { month: 'long' });
            year.textContent = this.currentYear.toString().split('').join(' ');

            const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
            const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
            const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

            for (let i = firstDay - 1; i >= 0; i--) {
                this.createDateElement(prevMonthDays - i, true);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                this.createDateElement(day, false);
            }

            const totalCells = 42;
            const remainingCells = totalCells - (firstDay + daysInMonth);
            for (let day = 1; day <= remainingCells; day++) {
                this.createDateElement(day, true);
            }
        }

        createDateElement(day, isOtherMonth) {
            const calendar = document.getElementById('calendar');
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date';
            
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            
            const workTimeDiv = document.createElement('div');
            workTimeDiv.className = 'work-time';

            if (isOtherMonth) {
                dateDiv.classList.add('other-month');
            } else {
                const currentDate = new Date(this.currentYear, this.currentMonth, day).getTime();
                if (currentDate === this.today) {
                    dateDiv.classList.add('today');
                }

                const dayOfWeek = new Date(this.currentYear, this.currentMonth, day).getDay();
                if (dayOfWeek === 0) dateNumber.classList.add('sunday');
                if (dayOfWeek === 6) dateNumber.classList.add('saturday');

                // 이벤트 클릭 핸들러
                dateDiv.addEventListener('click', () => {
                    this.selectDate(currentDate, dateDiv);
                });
            }
            
            dateDiv.appendChild(dateNumber);
            dateDiv.appendChild(workTimeDiv);
            calendar.appendChild(dateDiv);

            // 날짜에 해당하는 출퇴근 기록이 있으면 표시
            if (!isOtherMonth && this.events) {
                const currentDateStr = `${this.currentYear}. ${this.currentMonth + 1}. ${day}`;
                const dayEvents = this.events.filter(event => {
                    return event.timestamp.startsWith(currentDateStr);
                });

                if (dayEvents.length > 0) {
                    const eventTexts = dayEvents.map(event => 
                        `${event.timestamp.split('.')[3].trim()} ${event.action === 'Clock In' ? '출근' : '퇴근'}`
                    );
                    workTimeDiv.textContent = eventTexts.join('\n');
                }
            }
        }

        selectDate(date, dateDiv) {
            const prevSelected = document.querySelector('.date.selected');
            if (prevSelected) {
                prevSelected.classList.remove('selected');
            }

            dateDiv.classList.add('selected');
            this.selectedDate = date;

            // 해당 날짜의 이벤트들을 찾아서 모달에 표시
            if (this.events) {
                const selectedDateObj = new Date(date);
                const dateStr = `${selectedDateObj.getFullYear()}. ${selectedDateObj.getMonth() + 1}. ${selectedDateObj.getDate()}`;
                const dayEvents = this.events.filter(event => event.timestamp.startsWith(dateStr));
                
                if (dayEvents.length > 0) {
                    const eventInfo = document.getElementById('eventInfo');
                    eventInfo.innerHTML = dayEvents.map(event => 
                        `${event.timestamp} - ${event.action === 'Clock In' ? '출근' : '퇴근'}`
                    ).join('<br>');
                    
                    selectedEvent = dayEvents[0]; // 첫 번째 이벤트 선택
                    document.getElementById('editModal').classList.add('active');
                }
            }
        }

        updateEvents(records) {
            this.events = records;
            this.renderCalendar();
        }

        addEventListeners() {
            document.querySelector('.prev').addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.renderCalendar();
            });

            document.querySelector('.next').addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderCalendar();
            });

            document.querySelector('.today-btn').addEventListener('click', () => {
                this.goToToday();
            });
        }

        goToToday() {
            this.currentYear = this.date.getFullYear();
            this.currentMonth = this.date.getMonth();
            this.selectedDate = null;
            this.renderCalendar();
        }
    }

    // 달력 인스턴스 생성
    const calendarInstance = new AdminCalendar();

    // AWS 인증 처리
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

    function fetchStudentList() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/admin/students',
            headers: { Authorization: authToken },
            success: function (response) {
                const students = JSON.parse(response.body);
                populateStudentDropdown(students);
            },
            error: function () {
                alert('학생 목록을 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function populateStudentDropdown(students) {
        const studentDropdown = document.getElementById('studentDropdown');
        studentDropdown.innerHTML = '<option value="">학생을 선택하세요</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.employeeId;
            option.textContent = `${student.employeeId} - ${student.id}`;
            studentDropdown.appendChild(option);
        });
    }

    document.getElementById('fetchAttendanceButton').addEventListener('click', function () {
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
            success: function(records) {
                calendarInstance.updateEvents(records);
            },
            error: function () {
                alert('출근부를 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    document.getElementById('addRecordButton').addEventListener('click', function () {
        const dateToAdd = prompt('추가할 날짜를 입력하세요 (YYYY-MM-DD):');
        const timeToAdd = prompt('추가할 시간을 입력하세요 (HH:mm):');
        const action = prompt('추가할 액션을 입력하세요 (Clock In/Clock Out):');

        if (!dateToAdd || !timeToAdd || !action || (action !== 'Clock In' && action !== 'Clock Out')) {
            alert('올바른 날짜, 시간 및 액션을 입력하세요.');
            return;
        }

        const newDate = new Date(`${dateToAdd}T${timeToAdd}:00`);
        const kstDate = new Date(newDate.getTime());
        const timestampToAdd = `${kstDate.getFullYear()}. ${kstDate.getMonth() + 1}. ${kstDate.getDate()}. ${kstDate.getHours()}시 ${kstDate.getMinutes()}분 ${kstDate.getSeconds()}초`;

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: timestampToAdd,
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

    document.getElementById('deleteEvent').addEventListener('click', function () {
        if (!selectedEvent || !currentEmployeeId) {
            alert('삭제할 출근 기록이 선택되지 않았습니다.');
            return;
        }

        $.ajax({
            method: 'DELETE',
            url: _config.api.invokeUrl + '/admin/mod-attendance',
            headers: { Authorization: authToken },
            data: JSON.stringify({
                employeeId: currentEmployeeId,
                timestamp: selectedEvent.timestamp
            }),
            success: function () {
                alert('출근 기록이 삭제되었습니다.');
                fetchAttendanceRecords(currentEmployeeId);
                document.getElementById('editModal').classList.remove('active');
            },
            error: function () {
                alert('출근 기록 삭제 중 문제가 발생했습니다.');
            }
        });
    });

    document.getElementById('closeModal').addEventListener('click', function () {
        document.getElementById('editModal').classList.remove('active');
    });

    window.addEventListener('click', function (event) {
        if (event.target === document.getElementById('editModal')) {
            document.getElementById('editModal').classList.remove('active');
        }
    });
}(jQuery));