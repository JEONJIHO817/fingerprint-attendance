class AdminCalendar {
    constructor(authToken) {
        this.authToken = authToken;
        this.init();
    }

    init() {
        this.date = new Date();
        this.currentYear = this.date.getFullYear();
        this.currentMonth = this.date.getMonth();
        this.selectedStudent = null;
        this.calendar = null;

        this.students = [];

        this.initCalendar();
        this.addEventListeners();
        this.fetchStudents();
    }

    initCalendar() {
        const calendarEl = document.getElementById('calendar');
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: [],
            eventClick: (info) => this.handleEventClick(info)
        });
        this.calendar.render();
    }

    fetchStudents() {
        fetch(_config.api.invokeUrl + '/admin/students', {
            headers: { Authorization: this.authToken }
        })
            .then(response => response.json())
            .then(data => {
                this.students = data.body;
                this.renderStudentDropdown();
            })
            .catch(error => {
                console.error('Failed to fetch students:', error);
            });
    }

    renderStudentDropdown() {
        const dropdown = document.getElementById('studentSelect');
        dropdown.innerHTML = '<option value="">학생을 선택하세요</option>';
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.employeeId;
            option.textContent = `${student.employeeId} - ${student.name}`;
            dropdown.appendChild(option);
        });
    }

    addEventListeners() {
        document.querySelector('.student-select-btn').addEventListener('click', () => {
            this.showModal('studentModal');
        });

        document.querySelector('.record-add-btn').addEventListener('click', () => {
            this.showModal('recordModal');
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModals();
            });
        });

        document.querySelector('.view-btn').addEventListener('click', () => {
            const studentId = document.getElementById('studentSelect').value;
            if (!studentId) {
                alert('학생을 선택하세요.');
                return;
            }
            this.selectedStudent = this.students.find(s => s.employeeId === studentId);
            this.loadAttendanceRecords(studentId);
            this.hideModals();
        });

        document.querySelector('.save-btn').addEventListener('click', () => {
            this.addAttendanceRecord();
            this.hideModals();
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    loadAttendanceRecords(employeeId) {
        fetch(_config.api.invokeUrl + '/admin/get-attendance', {
            method: 'POST',
            headers: {
                Authorization: this.authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employeeId })
        })
            .then(response => response.json())
            .then(data => {
                this.updateCalendar(data.body);
            })
            .catch(error => {
                console.error('Failed to fetch attendance records:', error);
            });
    }

    updateCalendar(records) {
        this.calendar.removeAllEvents();
        records.forEach(record => {
            const { timestamp, action } = record;
            const date = new Date(timestamp);

            this.calendar.addEvent({
                title: action === 'Clock In' ? '출근' : '퇴근',
                start: date.toISOString(),
                color: action === 'Clock In' ? '#4caf50' : '#f44336',
                extendedProps: { action }
            });
        });
    }

    addAttendanceRecord() {
        const studentId = document.getElementById('studentSelect').value;
        const date = document.getElementById('recordDate').value;
        const timeIn = document.getElementById('timeIn').value;
        const timeOut = document.getElementById('timeOut').value;

        if (!studentId || !date || !timeIn || !timeOut) {
            alert('모든 필드를 입력하세요.');
            return;
        }

        const recordData = {
            employeeId: studentId,
            records: [
                { timestamp: `${date}T${timeIn}:00`, action: 'Clock In' },
                { timestamp: `${date}T${timeOut}:00`, action: 'Clock Out' }
            ]
        };

        fetch(_config.api.invokeUrl + '/admin/mod-attendance', {
            method: 'POST',
            headers: {
                Authorization: this.authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recordData)
        })
            .then(() => {
                alert('출근 기록이 추가되었습니다.');
                this.loadAttendanceRecords(studentId);
            })
            .catch(error => {
                console.error('Failed to add attendance record:', error);
            });
    }

    handleEventClick(info) {
        const { event } = info;
        const modal = document.getElementById('editModal');
        const eventInfo = document.getElementById('eventInfo');

        eventInfo.textContent = `날짜: ${event.start.toISOString().split('T')[0]}, 액션: ${event.extendedProps.action}`;
        modal.style.display = 'block';

        document.getElementById('deleteEvent').addEventListener('click', () => {
            this.deleteAttendanceRecord(event);
            modal.style.display = 'none';
        });
    }

    deleteAttendanceRecord(event) {
        const employeeId = this.selectedStudent.employeeId;
        const timestamp = event.start.toISOString();

        fetch(_config.api.invokeUrl + '/admin/mod-attendance', {
            method: 'DELETE',
            headers: {
                Authorization: this.authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employeeId, timestamp })
        })
            .then(() => {
                alert('출근 기록이 삭제되었습니다.');
                this.loadAttendanceRecords(employeeId);
            })
            .catch(error => {
                console.error('Failed to delete attendance record:', error);
            });
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    WildRydes.authToken.then(function setAuthToken(token) {
        console.log('Auth Token:', token);
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
    
});