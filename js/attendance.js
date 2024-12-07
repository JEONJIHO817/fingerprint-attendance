/*global WildRydes _config */

var WildRydes = window.WildRydes || {};
WildRydes.attendance = WildRydes.attendance || {};

(function attendanceScopeWrapper($) {
    var authToken;

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            fetchAttendanceRecords();
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token: ', error);
        window.location.href = '/signin.html';
    });

    function fetchAttendanceRecords() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            success: displayAttendanceRecords,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error fetching attendance records: ', textStatus, ', Details: ', errorThrown);
                alert('출근부를 가져오는 중 문제가 발생했습니다.');
            }
        });
    }

    function displayAttendanceRecords(records) {
        // FullCalendar 설정
        var calendarEl = document.getElementById('attendance-calendar');
    
        // 데이터 형식 변환: FullCalendar가 이해할 수 있는 ISO 형식으로 변환
        var events = records.map(record => {
            // timestamp를 Date 객체로 변환
            var dateParts = record.timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
            var timeParts = record.timestamp.match(/(\d{1,2})시\s*(\d{1,2})분\s*(\d{1,2})초/);
            
            if (dateParts && timeParts) {
                var year = parseInt(dateParts[1], 10);
                var month = parseInt(dateParts[2], 10) - 1; // JavaScript는 0부터 시작하는 월 사용
                var day = parseInt(dateParts[3], 10);
                var hours = parseInt(timeParts[1], 10);
                var minutes = parseInt(timeParts[2], 10);
                var seconds = parseInt(timeParts[3], 10);
    
                var date = new Date(year, month, day, hours, minutes, seconds);
    
                return {
                    title: record.action === 'Clock In' ? '출근' : '퇴근',
                    start: date.toISOString(), // ISO 형식으로 변환
                    color: record.action === 'Clock In' ? '#4caf50' : '#f44336'
                };
            } else {
                console.error('Invalid timestamp format:', record.timestamp);
                return null;
            }
        }).filter(event => event !== null); // 유효하지 않은 이벤트 제거
    
        // FullCalendar 초기화
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // 월별 보기
            locale: 'ko', // 한국어 설정
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events, // 변환된 이벤트 데이터를 설정
        });
    
        calendar.render();
    }
}(jQuery));
