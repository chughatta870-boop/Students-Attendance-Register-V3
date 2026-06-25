// =========================
// ADVANCED ATTENDANCE APP
// =========================

// ---------- DOM ----------
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginTeacherName = document.getElementById("loginTeacherName");
const loginSchoolName = document.getElementById("loginSchoolName");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");

const schoolInfo = document.getElementById("schoolInfo");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const totalStudentsCard = document.getElementById("totalStudentsCard");
const presentCard = document.getElementById("presentCard");
const absentCard = document.getElementById("absentCard");
const leaveCard = document.getElementById("leaveCard");

const editStudentId = document.getElementById("editStudentId");
const studentName = document.getElementById("studentName");
const studentRoll = document.getElementById("studentRoll");
const studentClass = document.getElementById("studentClass");
const saveStudentBtn = document.getElementById("saveStudentBtn");
const studentFormTitle = document.getElementById("studentFormTitle");

const attendanceDate = document.getElementById("attendanceDate");
const searchStudent = document.getElementById("searchStudent");
const classFilter = document.getElementById("classFilter");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const resetTodayStatusBtn = document.getElementById("resetTodayStatusBtn");

const studentsTableBody = document.getElementById("studentsTableBody");
const exportStudentsBtn = document.getElementById("exportStudentsBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

const reportMonth = document.getElementById("reportMonth");
const generateReportBtn = document.getElementById("generateReportBtn");
const exportReportBtn = document.getElementById("exportReportBtn");
const reportTableBody = document.getElementById("reportTableBody");

const historyContainer = document.getElementById("historyContainer");

// ---------- STORAGE KEYS ----------
const KEYS = {
  login: "attendance_login",
  session: "attendance_session",
  students: "attendance_students",
  attendance: "attendance_records",
  theme: "attendance_theme"
};

// ---------- STATE ----------
let students = JSON.parse(localStorage.getItem(KEYS.students)) || [];
let attendanceRecords = JSON.parse(localStorage.getItem(KEYS.attendance)) || {};
let loginData = JSON.parse(localStorage.getItem(KEYS.login)) || null;
let session = JSON.parse(localStorage.getItem(KEYS.session)) || { loggedIn: false };

// ---------- INITIAL DEFAULTS ----------
attendanceDate.valueAsDate = new Date();
const today = new Date();
reportMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

// ---------- THEME ----------
function applyTheme() {
  const savedTheme = localStorage.getItem(KEYS.theme) || "light";
  document.body.classList.toggle("dark", savedTheme === "dark");
  themeToggleBtn.textContent = savedTheme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode";
}

function toggleTheme() {
  const current = localStorage.getItem(KEYS.theme) || "light";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem(KEYS.theme, next);
  applyTheme();
}

// ---------- LOGIN ----------
function showLogin() {
  loginScreen.classList.add("active");
  appScreen.classList.remove("active");
}

function showApp() {
  loginScreen.classList.remove("active");
  appScreen.classList.add("active");
}

function loadLoginPrefill() {
  if (loginData) {
    loginTeacherName.value = loginData.teacherName || "";
    loginSchoolName.value = loginData.schoolName || "";
    loginUsername.value = loginData.username || "";
  }
}

function handleLogin() {
  const teacherName = loginTeacherName.value.trim();
  const schoolName = loginSchoolName.value.trim();
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  if (!teacherName || !schoolName || !username || !password) {
    alert("Please fill Teacher Name, School Name, Username and Password.");
    return;
  }

  // First time save login
  if (!loginData) {
    loginData = { teacherName, schoolName, username, password };
    localStorage.setItem(KEYS.login, JSON.stringify(loginData));
  } else {
    // Check credentials
    if (username !== loginData.username || password !== loginData.password) {
      alert("Invalid username or password.");
      return;
    }

    // Update teacher/school names if user changed them
    loginData.teacherName = teacherName;
    loginData.schoolName = schoolName;
    localStorage.setItem(KEYS.login, JSON.stringify(loginData));
  }

  session = { loggedIn: true };
  localStorage.setItem(KEYS.session, JSON.stringify(session));
  initApp();
}

function logout() {
  const ok = confirm("Do you want to logout?");
  if (!ok) return;

  session = { loggedIn: false };
  localStorage.setItem(KEYS.session, JSON.stringify(session));
  showLogin();
}

// ---------- HELPERS ----------
function saveStudents() {
  localStorage.setItem(KEYS.students, JSON.stringify(students));
}

function saveAttendanceRecords() {
  localStorage.setItem(KEYS.attendance, JSON.stringify(attendanceRecords));
}

function getSelectedDate() {
  return attendanceDate.value;
}

function getAttendanceForDate(date) {
  if (!attendanceRecords[date]) attendanceRecords[date] = {};
  return attendanceRecords[date];
}

function escapeCsv(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

function downloadCSV(filename, rows) {
  const csvContent = rows.map(row => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function getFilteredStudents() {
  const query = searchStudent.value.trim().toLowerCase();
  const selectedClass = classFilter.value;

  return students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(query) ||
      student.roll.toLowerCase().includes(query);

    const matchesClass =
      selectedClass === "all" || student.className === selectedClass;

    return matchesSearch && matchesClass;
  });
}

function getStatusBadge(status) {
  if (status === "Present") {
    return `<span class="status-pill status-present">Present</span>`;
  }
  if (status === "Absent") {
    return `<span class="status-pill status-absent">Absent</span>`;
  }
  if (status === "Leave") {
    return `<span class="status-pill status-leave">Leave</span>`;
  }
  return `<span class="muted">Not Marked</span>`;
}

// ---------- CLASS FILTER ----------
function populateClassFilter() {
  const classes = [...new Set(students.map(s => s.className).filter(Boolean))].sort();

  classFilter.innerHTML = `<option value="all">All Classes</option>`;
  classes.forEach(cls => {
    const option = document.createElement("option");
    option.value = cls;
    option.textContent = cls;
    classFilter.appendChild(option);
  });
}

// ---------- STUDENT CRUD ----------
function clearStudentForm() {
  editStudentId.value = "";
  studentName.value = "";
  studentRoll.value = "";
  studentClass.value = "";
  studentFormTitle.textContent = "Add Student";
  saveStudentBtn.textContent = "Save Student";
}

function saveStudent() {
  const name = studentName.value.trim();
  const roll = studentRoll.value.trim();
  const className = studentClass.value.trim();
  const editId = editStudentId.value;

  if (!name || !roll || !className) {
    alert("Please enter student name, roll number and class.");
    return;
  }

  // Prevent duplicate roll number within same class
  const duplicate = students.find(s =>
    s.roll.toLowerCase() === roll.toLowerCase() &&
    s.className.toLowerCase() === className.toLowerCase() &&
    String(s.id) !== String(editId || "")
  );

  if (duplicate) {
    alert("This roll number already exists in the same class.");
    return;
  }

  if (editId) {
    const index = students.findIndex(s => String(s.id) === String(editId));
    if (index !== -1) {
      students[index].name = name;
      students[index].roll = roll;
      students[index].className = className;
    }
  } else {
    students.push({
      id: Date.now(),
      name,
      roll,
      className
    });
  }

  saveStudents();
  populateClassFilter();
  renderStudents();
  updateDashboard();
  clearStudentForm();
}

function editStudent(id) {
  const student = students.find(s => s.id === id);
  if (!student) return;

  editStudentId.value = student.id;
  studentName.value = student.name;
  studentRoll.value = student.roll;
  studentClass.value = student.className;
  studentFormTitle.textContent = "Edit Student";
  saveStudentBtn.textContent = "Update Student";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteStudent(id) {
  const ok = confirm("Delete this student?");
  if (!ok) return;

  students = students.filter(s => s.id !== id);

  // Also remove attendance entries for this student from all dates
  Object.keys(attendanceRecords).forEach(date => {
    if (attendanceRecords[date] && attendanceRecords[date][id]) {
      delete attendanceRecords[date][id];
    }
  });

  saveStudents();
  saveAttendanceRecords();
  populateClassFilter();
  renderStudents();
  renderHistory();
  updateDashboard();
  clearStudentForm();
}

// ---------- ATTENDANCE ----------
function setStudentStatus(studentId, status) {
  const date = getSelectedDate();
  if (!date) {
    alert("Please select attendance date first.");
    return;
  }

  const dateRecord = getAttendanceForDate(date);
  dateRecord[studentId] = status;
  saveAttendanceRecords();
  updateDashboard();
}

function resetTodayStatus() {
  const date = getSelectedDate();
  if (!date) {
    alert("Please select attendance date first.");
    return;
  }

  const ok = confirm("Reset all attendance status for selected date?");
  if (!ok) return;

  attendanceRecords[date] = {};
  saveAttendanceRecords();
  renderStudents();
  updateDashboard();
}

function saveAttendance() {
  const date = getSelectedDate();
  if (!date) {
    alert("Please select attendance date.");
    return;
  }

  if (students.length === 0) {
    alert("Please add students first.");
    return;
  }

  // Ensure every student has some status; if not, default to Absent
  const dateRecord = getAttendanceForDate(date);
  students.forEach(student => {
    if (!dateRecord[student.id]) {
      dateRecord[student.id] = "Absent";
    }
  });

  saveAttendanceRecords();
  renderHistory();
  updateDashboard();
  alert("Attendance saved successfully!");
}

// ---------- RENDER STUDENTS ----------
function renderStudents() {
  const filtered = getFilteredStudents();
  const selectedDate = getSelectedDate();
  const dateRecord = selectedDate ? getAttendanceForDate(selectedDate) : {};

  studentsTableBody.innerHTML = "";

  if (filtered.length === 0) {
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="center muted">No students found.</td>
      </tr>
    `;
    return;
  }

  filtered.forEach((student, index) => {
    const currentStatus = dateRecord[student.id] || "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${student.name}</td>
      <td>${student.roll}</td>
      <td>${student.className}</td>

      <td>
        <div class="radio-wrap">
          <input type="radio" name="attendance-${student.id}" value="Present" ${currentStatus === "Present" ? "checked" : ""}>
        </div>
      </td>
      <td>
        <div class="radio-wrap">
          <input type="radio" name="attendance-${student.id}" value="Absent" ${currentStatus === "Absent" ? "checked" : ""}>
        </div>
      </td>
      <td>
        <div class="radio-wrap">
          <input type="radio" name="attendance-${student.id}" value="Leave" ${currentStatus === "Leave" ? "checked" : ""}>
        </div>
      </td>

      <td>
        <div class="inline-actions">
          <button class="warning" data-edit="${student.id}">Edit</button>
        </div>
      </td>
      <td>
        <div class="inline-actions">
          <button class="danger" data-delete="${student.id}">Delete</button>
        </div>
      </td>
    `;

    studentsTableBody.appendChild(row);

    // Attendance radios
    const radios = row.querySelectorAll(`input[name="attendance-${student.id}"]`);
    radios.forEach(radio => {
      radio.addEventListener("change", (e) => {
        setStudentStatus(student.id, e.target.value);
      });
    });

    // Edit button
    const editBtn = row.querySelector(`[data-edit="${student.id}"]`);
    editBtn.addEventListener("click", () => editStudent(student.id));

    // Delete button
    const deleteBtn = row.querySelector(`[data-delete="${student.id}"]`);
    deleteBtn.addEventListener("click", () => deleteStudent(student.id));
  });
}

// ---------- DASHBOARD ----------
function updateDashboard() {
  totalStudentsCard.textContent = students.length;

  const date = getSelectedDate();
  if (!date || !attendanceRecords[date]) {
    presentCard.textContent = 0;
    absentCard.textContent = 0;
    leaveCard.textContent = 0;
    return;
  }

  const dateRecord = attendanceRecords[date];
  let present = 0;
  let absent = 0;
  let leave = 0;

  students.forEach(student => {
    const status = dateRecord[student.id];
    if (status === "Present") present++;
    else if (status === "Absent") absent++;
    else if (status === "Leave") leave++;
  });

  presentCard.textContent = present;
  absentCard.textContent = absent;
  leaveCard.textContent = leave;
}

// ---------- HISTORY ----------
function renderHistory() {
  historyContainer.innerHTML = "";

  const dates = Object.keys(attendanceRecords).sort().reverse();

  if (dates.length === 0) {
    historyContainer.innerHTML = `<p class="center muted">No attendance saved yet.</p>`;
    return;
  }

  dates.forEach(date => {
    const record = attendanceRecords[date];
    const card = document.createElement("div");
    card.className = "history-card";

    let present = 0, absent = 0, leave = 0;
    let listItems = "";

    students.forEach(student => {
      const status = record[student.id];
      if (!status) return;

      if (status === "Present") present++;
      else if (status === "Absent") absent++;
      else if (status === "Leave") leave++;

      listItems += `
        <li>
          <strong>${student.name}</strong> (Roll: ${student.roll}, ${student.className}) - ${getStatusBadge(status)}
        </li>
      `;
    });

    if (!listItems) {
      listItems = `<li class="muted">No student status saved for this date.</li>`;
    }

    card.innerHTML = `
      <h3>Date: ${date}</h3>
      <p class="muted" style="margin-bottom:10px;">
        Present: <strong>${present}</strong> |
        Absent: <strong>${absent}</strong> |
        Leave: <strong>${leave}</strong>
      </p>
      <ul class="history-list">${listItems}</ul>
    `;

    historyContainer.appendChild(card);
  });
}

// ---------- MONTHLY REPORT ----------
function generateMonthlyReport() {
  const month = reportMonth.value; // format: YYYY-MM
  if (!month) {
    alert("Please select report month.");
    return;
  }

  reportTableBody.innerHTML = "";

  if (students.length === 0) {
    reportTableBody.innerHTML = `
      <tr><td colspan="8" class="center muted">No students available.</td></tr>
    `;
    return;
  }

  const reportRows = [];

  students.forEach((student, index) => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    Object.keys(attendanceRecords).forEach(date => {
      if (date.startsWith(month)) {
        const status = attendanceRecords[date][student.id];
        if (status === "Present") present++;
        else if (status === "Absent") absent++;
        else if (status === "Leave") leave++;
      }
    });

    const total = present + absent + leave;

    reportRows.push({
      index: index + 1,
      name: student.name,
      roll: student.roll,
      className: student.className,
      present,
      absent,
      leave,
      total
    });
  });

  if (reportRows.length === 0) {
    reportTableBody.innerHTML = `
      <tr><td colspan="8" class="center muted">No report data found.</td></tr>
    `;
    return;
  }

  reportRows.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.index}</td>
      <td>${row.name}</td>
      <td>${row.roll}</td>
      <td>${row.className}</td>
      <td>${row.present}</td>
      <td>${row.absent}</td>
      <td>${row.leave}</td>
      <td>${row.total}</td>
    `;
    reportTableBody.appendChild(tr);
  });
}

function exportMonthlyReport() {
  const month = reportMonth.value;
  if (!month) {
    alert("Please select report month.");
    return;
  }

  const rows = [
    ["Monthly Attendance Report"],
    [`Month`, month],
    [],
    ["#", "Student Name", "Roll No", "Class", "Present", "Absent", "Leave", "Total Marked Days"]
  ];

  students.forEach((student, index) => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    Object.keys(attendanceRecords).forEach(date => {
      if (date.startsWith(month)) {
        const status = attendanceRecords[date][student.id];
        if (status === "Present") present++;
        else if (status === "Absent") absent++;
        else if (status === "Leave") leave++;
      }
    });

    const total = present + absent + leave;

    rows.push([
      index + 1,
      student.name,
      student.roll,
      student.className,
      present,
      absent,
      leave,
      total
    ]);
  });

  downloadCSV(`monthly_attendance_${month}.csv`, rows);
}

// ---------- EXPORT STUDENT LIST ----------
function exportStudentList() {
  const rows = [
    ["Student List"],
    [],
    ["#", "Student Name", "Roll No", "Class"]
  ];

  students.forEach((student, index) => {
    rows.push([
      index + 1,
      student.name,
      student.roll,
      student.className
    ]);
  });

  downloadCSV("student_list.csv", rows);
}

// ---------- CLEAR ALL ----------
function clearAllData() {
  const ok = confirm("This will delete login, students, attendance and all app data. Continue?");
  if (!ok) return;

  localStorage.removeItem(KEYS.login);
  localStorage.removeItem(KEYS.session);
  localStorage.removeItem(KEYS.students);
  localStorage.removeItem(KEYS.attendance);

  students = [];
  attendanceRecords = {};
  loginData = null;
  session = { loggedIn: false };

  clearStudentForm();
  showLogin();
  loadLoginPrefill();
  alert("All app data cleared.");
}

// ---------- APP INIT ----------
function initApp() {
  loginData = JSON.parse(localStorage.getItem(KEYS.login)) || null;
  students = JSON.parse(localStorage.getItem(KEYS.students)) || [];
  attendanceRecords = JSON.parse(localStorage.getItem(KEYS.attendance)) || {};
  session = JSON.parse(localStorage.getItem(KEYS.session)) || { loggedIn: false };

  if (!loginData || !session.loggedIn) {
    showLogin();
    loadLoginPrefill();
    applyTheme();
    return;
  }

  schoolInfo.textContent = `${loginData.teacherName} | ${loginData.schoolName}`;
  showApp();

  populateClassFilter();
  renderStudents();
  renderHistory();
  updateDashboard();
  applyTheme();
}

// ---------- EVENTS ----------
loginBtn.addEventListener("click", handleLogin);
logoutBtn.addEventListener("click", logout);
themeToggleBtn.addEventListener("click", toggleTheme);

saveStudentBtn.addEventListener("click", saveStudent);

attendanceDate.addEventListener("change", () => {
  renderStudents();
  updateDashboard();
});

searchStudent.addEventListener("input", renderStudents);
classFilter.addEventListener("change", renderStudents);

saveAttendanceBtn.addEventListener("click", saveAttendance);
resetTodayStatusBtn.addEventListener("click", resetTodayStatus);

generateReportBtn.addEventListener("click", generateMonthlyReport);
exportReportBtn.addEventListener("click", exportMonthlyReport);

exportStudentsBtn.addEventListener("click", exportStudentList);
clearAllBtn.addEventListener("click", clearAllData);

// ---------- START ----------
initApp();

// ---------- SERVICE WORKER ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch(err => console.log("SW registration failed:", err));
  });
}
