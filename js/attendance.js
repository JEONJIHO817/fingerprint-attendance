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
                alert('An error occurred while fetching attendance records.');
            }
        });
    }

    function displayAttendanceRecords(records) {
        // FullCalendar 설정
        var calendarEl = document.getElementById('attendance-calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // 월별 보기
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: records.map(function(record) {
                return {
                    title: record.action, // "Clock In" 또는 "Clock Out"
                    start: record.timestamp, // ISO 형식 날짜
                    color: record.action === "Clock In" ? "#4caf50" : "#f44336" // 출근은 녹색, 퇴근은 빨간색
                };
            })
        });

        calendar.render();
    }
}(jQuery));
