// Attendance Modal Elements
const attendanceModal = new bootstrap.Modal(document.getElementById('attendanceModal'));
const attendanceTableBody = document.getElementById('attendanceTableBody');

// Fingerprint Modal Elements
const fingerprintModal = new bootstrap.Modal(document.getElementById('fingerprintModal'));
const fingerprintForm = document.getElementById('fingerprintForm');

// View Attendance Button
document.getElementById('viewAllAttendanceBtn').onclick = function () {
  console.log('Fetching all attendance data...');
  
  // Simulate API Call to Fetch Attendance
  fetch('/api/admin/attendance') // Replace with your API endpoint
    .then(response => response.json())
    .then(data => {
      populateAttendanceTable(data);
      attendanceModal.show();
    })
    .catch(error => {
      console.error('Error fetching attendance data:', error);
      alert('Failed to fetch attendance data.');
    });
};

// Register Fingerprint Button
document.getElementById('registerFingerprintBtn').onclick = function () {
  fingerprintModal.show();
};

// Populate Attendance Table
function populateAttendanceTable(data) {
  attendanceTableBody.innerHTML = ''; // Clear existing rows

  data.forEach(record => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.studentName}</td>
      <td>${record.date}</td>
      <td>${record.clockIn}</td>
      <td>${record.clockOut}</td>
      <td>${record.totalHours}</td>
      <td>
        <button class="btn btn-sm btn-warning">Edit</button>
        <button class="btn btn-sm btn-danger">Delete</button>
      </td>
    `;
    attendanceTableBody.appendChild(row);
  });
}

// Handle Fingerprint Form Submission
fingerprintForm.onsubmit = function (e) {
  e.preventDefault();
  
  const studentId = document.getElementById('studentId').value;
  const fingerprintFile = document.getElementById('fingerprintFile').files[0];
  
  if (!studentId || !fingerprintFile) {
    alert('Please provide all required fields.');
    return;
  }

  const formData = new FormData();
  formData.append('studentId', studentId);
  formData.append('fingerprint', fingerprintFile);

  // Simulate API Call for Fingerprint Registration
  fetch('/api/admin/registerFingerprint', { // Replace with your API endpoint
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      alert(data.message || 'Fingerprint registered successfully!');
      fingerprintModal.hide();
    })
    .catch(error => {
      console.error('Error registering fingerprint:', error);
      alert('Failed to register fingerprint.');
    });
};
