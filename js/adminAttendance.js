document.addEventListener('DOMContentLoaded', function () {
    const studentDropdown = document.getElementById('studentDropdown');
    const fetchAttendanceButton = document.getElementById('fetchAttendanceButton');
    const editAttendanceButton = document.getElementById('editAttendanceButton');

    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ko',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [] // API 호출 후 데이터를 동적으로 추가
    });

    // 캘린더 초기 렌더
    calendar.render();

    // 학생 목록 API 호출 및 드롭다운 채우기
    fetch('arn:aws:execute-api:ap-northeast-2:195275678021:tglilj6saa/*/*/admin') // 실제 API 엔드포인트로 교체
        .then(response => response.json())
        .then(employees => {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.employeeId; // employee ID만 값으로 사용
                option.textContent = employee.employeeId; // employee ID만 드롭다운에 표시
                studentDropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching employee list:', error);
            alert('Employee 목록을 가져오는 데 실패했습니다.');
        });

    // 조회 버튼 클릭 이벤트
    fetchAttendanceButton.addEventListener('click', function () {
        const selectedEmployeeId = studentDropdown.value;

        if (!selectedEmployeeId) {
            alert('Employee ID를 선택하세요.');
            return;
        }

        // 출근부 API 호출
        fetch(`arn:aws:execute-api:ap-northeast-2:195275678021:tglilj6saa/*/*/admin/${selectedEmployeeId}`) // 실제 API 엔드포인트로 교체
            .then(response => response.json())
            .then(attendanceRecords => {
                calendar.removeAllEvents(); // 기존 이벤트 제거
                attendanceRecords.forEach(record => {
                    calendar.addEvent({
                        title: record.action, // "출근" 또는 "퇴근"
                        start: record.timestamp, // ISO 형식 날짜
                        color: record.action === "Clock In" ? "#4caf50" : "#f44336" // 출근: 녹색, 퇴근: 빨간색
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching attendance data:', error);
                alert('출근부 데이터를 가져오는 데 실패했습니다.');
            });
    });

    // 수정 버튼 클릭 이벤트
    editAttendanceButton.addEventListener('click', function () {
        const selectedEmployeeId = studentDropdown.value;

        if (!selectedEmployeeId) {
            alert('Employee ID를 선택하세요.');
            return;
        }

        alert(`Employee ID: ${selectedEmployeeId}의 출근부를 수정합니다.`);
        // 수정 페이지 또는 모달로 이동
    });
});
