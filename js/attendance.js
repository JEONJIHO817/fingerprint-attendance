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

        // 날짜별 근무 시간 계산
        var workSummary = calculateWorkSummary(records);

        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // 월별 보기
            locale: 'ko', // 한국어 설정
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
            }),
            eventContent: function(arg) {
                // 각 날짜의 총 근무 시간을 표시
                var workTime = workSummary[arg.event.startStr.split('T')[0]] || { hours: 0, minutes: 0 }; // 해당 날짜의 총 근무 시간
                return {
                    html: `<b>${arg.event.title}</b><br/><span>근무 시간: ${workTime.hours}시간 ${workTime.minutes}분</span>`
                };
            }
        });

        calendar.render();
    }

    function calculateWorkSummary(records) {
        var workSummary = {};

        // 출/퇴근 데이터를 날짜별로 그룹화하여 근무 시간 계산
        records.forEach(function(record) {
            var date = record.timestamp.split('T')[0]; // 날짜만 추출 (YYYY-MM-DD)
            if (!workSummary[date]) {
                workSummary[date] = [];
            }
            workSummary[date].push({
                time: new Date(record.timestamp).getTime(),
                action: record.action
            });
        });

        // 날짜별로 근무 시간을 계산
        Object.keys(workSummary).forEach(function(date) {
            var events = workSummary[date];
            events.sort(function(a, b) {
                return a.time - b.time; // 시간 순 정렬
            });

            var totalWorkTimeMs = 0; // 밀리초 단위로 총 근무 시간 계산
            for (var i = 0; i < events.length - 1; i += 2) {
                if (events[i].action === "Clock In" && events[i + 1]?.action === "Clock Out") {
                    totalWorkTimeMs += events[i + 1].time - events[i].time;
                }
            }

            // 밀리초 단위를 시간과 분으로 변환
            var totalMinutes = Math.floor(totalWorkTimeMs / (1000 * 60)); // 총 분 계산
            workSummary[date] = {
                hours: Math.floor(totalMinutes / 60), // 시간 계산
                minutes: totalMinutes % 60 // 남은 분 계산
            };
        });

        return workSummary;
    }
}(jQuery));
