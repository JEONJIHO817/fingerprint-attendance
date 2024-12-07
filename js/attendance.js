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

        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // 월별 보기
            locale: 'ko', // 한국어 설정
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: records.map(record => ({
                title: record.action === 'Clock In' ? '출근' : '퇴근',
                start: record.timestamp,
                color: record.action === 'Clock In' ? '#4caf50' : '#f44336'
            })),
        });

        calendar.render();
    }
}(jQuery));
