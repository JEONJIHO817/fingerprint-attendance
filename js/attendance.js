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

        // 날짜별 근무 시간 및 상세 근무 기록 계산
        var workSummary = calculateWorkSummary(records);

        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // 월별 보기
            locale: 'ko', // 한국어 설정
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: Object.keys(workSummary).map(function(date) {
                var workData = workSummary[date];
                var details = workData.details.join("<br/>");
                return {
                    title: `${date}<br/>--------------------------<br/>${details}<br/>총 근무 시간: ${workData.total.hours}시간 ${workData.total.minutes}분<br/>--------------------------`,
                    start: date // 날짜에 표시
                };
            }),
            eventContent: function(arg) {
                return {
                    html: `<div style="white-space:normal;">${arg.event.title}</div>`
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
                workSummary[date] = { events: [], total: { hours: 0, minutes: 0 }, details: [] };
            }
            workSummary[date].events.push({
                time: new Date(record.timestamp).getTime(),
                action: record.action
            });
        });

        // 날짜별로 근무 시간을 계산
        Object.keys(workSummary).forEach(function(date) {
            var events = workSummary[date].events;
            events.sort(function(a, b) {
                return a.time - b.time; // 시간 순 정렬
            });

            var totalWorkTimeMs = 0; // 밀리초 단위로 총 근무 시간 계산
            var detailsArray = []; // 출/퇴근 상세 기록
            for (var i = 0; i < events.length - 1; i += 2) {
                if (events[i].action === "Clock In" && events[i + 1]?.action === "Clock Out") {
                    totalWorkTimeMs += events[i + 1].time - events[i].time;
                    var startTime = new Date(events[i].time).toLocaleTimeString("ko-KR", { hour: '2-digit', minute: '2-digit' });
                    var endTime = new Date(events[i + 1].time).toLocaleTimeString("ko-KR", { hour: '2-digit', minute: '2-digit' });
                    detailsArray.push(`${startTime} ~ ${endTime}`);
                }
            }

            // 밀리초 단위를 시간과 분으로 변환
            var totalMinutes = Math.floor(totalWorkTimeMs / (1000 * 60)); // 총 분 계산
            workSummary[date].total = {
                hours: Math.floor(totalMinutes / 60), // 시간 계산
                minutes: totalMinutes % 60 // 남은 분 계산
            };

            // 상세 기록 설정
            workSummary[date].details = detailsArray;
        });

        return workSummary;
    }
}(jQuery));
