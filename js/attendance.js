/*global WildRydes _config */

var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;
    let currentDate = new Date();

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            init();
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token: ', error);
        window.location.href = '/signin.html';
    });

    function init() {
        renderCalendar();
        fetchAttendanceRecords();
        addEventListeners();
    }

    function addEventListeners() {
        // 날짜 네비게이션
        document.querySelector('.prev').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
            fetchAttendanceRecords();
        });

        document.querySelector('.next').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
            fetchAttendanceRecords();
        });

        // Today 버튼
        document.getElementById('todayBtn').addEventListener('click', () => {
            currentDate = new Date();
            renderCalendar();
            fetchAttendanceRecords();
        });

        // BACK 버튼
        document.querySelector('.back-btn').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/student.html';
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

    function fetchAttendanceRecords() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            success: function(records) {
                updateCalendarWithRecords(records);
                calculateMonthlyHours(records);
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error fetching attendance records: ', textStatus, ', Details: ', errorThrown);
                alert('출근부를 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function updateCalendarWithRecords(records) {
        // 기존 기록 초기화
        document.querySelectorAll('.date').forEach(dateDiv => {
            dateDiv.querySelectorAll('.work-record').forEach(record => record.remove());
        });

        // 날짜별로 기록 그룹화
        const recordsByDate = records.reduce((acc, record) => {
            const timestampRegex = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2})시\s*(\d{1,2})분\s*(\d{1,2})초/;
            const match = record.timestamp.match(timestampRegex);

            if (match) {
                const [_, year, month, day, hour, minute] = match.map(Number);
                const dateKey = formatDateString(year, month, day);
                
                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push({
                    ...record,
                    hour,
                    minute
                });
            }
            return acc;
        }, {});

        // 그룹화된 기록을 캘린더에 표시
        Object.entries(recordsByDate).forEach(([dateKey, dayRecords]) => {
            const dateDiv = document.querySelector(`[data-date="${dateKey}"]`);
            
            if (dateDiv && !dateDiv.classList.contains('other-month')) {
                const recordsContainer = document.createElement('div');
                recordsContainer.className = 'records-container';
                
                // 시간 순으로 정렬
                dayRecords.sort((a, b) => {
                    if (a.hour !== b.hour) return a.hour - b.hour;
                    return a.minute - b.minute;
                });

                dayRecords.forEach(record => {
                    const recordDiv = document.createElement('div');
                    recordDiv.className = `work-record ${record.action.toLowerCase().replace(' ', '')}`;
                    
                    const timeStr = `${String(record.hour).padStart(2, '0')}:${String(record.minute).padStart(2, '0')}`;
                    recordDiv.textContent = record.action === 'Clock In' ? 
                        `${timeStr} 출근` : `${timeStr} 퇴근`;

                    recordsContainer.appendChild(recordDiv);
                });

                dateDiv.appendChild(recordsContainer);
                
                // 출/퇴근 기록이 있는 날짜 스타일링
                if (dayRecords.some(r => r.action === 'Clock In')) {
                    dateDiv.classList.add('has-clockin');
                }
                if (dayRecords.some(r => r.action === 'Clock Out')) {
                    dateDiv.classList.add('has-clockout');
                }
            }
        });
    }

    function calculateMonthlyHours(records) {
        let totalMinutes = 0;
        const recordsByDate = {};

        // 날짜별로 기록 그룹화
        records.forEach(record => {
            const date = record.timestamp.split('.').slice(0, 3).join('.');
            if (!recordsByDate[date]) {
                recordsByDate[date] = [];
            }
            recordsByDate[date].push(record);
        });

        // 각 날짜별로 근무시간 계산
        Object.values(recordsByDate).forEach(dayRecords => {
            // 시간순으로 정렬
            dayRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            let clockIn = null;
            dayRecords.forEach(record => {
                if (record.action === 'Clock In') {
                    clockIn = new Date(record.timestamp);
                } else if (record.action === 'Clock Out' && clockIn) {
                    const clockOut = new Date(record.timestamp);
                    totalMinutes += (clockOut - clockIn) / (1000 * 60);
                    clockIn = null;
                }
            });
        });

        // 시간으로 변환하여 표시 (소수점 1자리까지)
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
        document.getElementById('monthlyHours').textContent = totalHours;
    }

    function formatDateString(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

}(jQuery));