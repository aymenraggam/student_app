// --- حماية بكلمة السر (لا تغيير هنا) ---
const correctPassword = "admin";
const enteredPassword = prompt("الرجاء إدخال كلمة سر الإدارة:", "");

if (enteredPassword !== correctPassword) {
    alert("كلمة السر خاطئة! لا يمكن الوصول.");
    document.body.innerHTML = '<h1 style="text-align:center; color:red; margin-top: 50px;">وصول مرفوض</h1>';
} else {
    initializeAdminPage();
}
// ------------------------------------

let allData = {}; // سيحتوي على كل البيانات من data.json
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "20:00 - 22:00"];

function initializeAdminPage() {
    document.addEventListener('DOMContentLoaded', fetchData);
}

async function fetchData() {
    try {
        const response = await fetch(`data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allData = await response.json();

        // استدعاء جميع دوال العرض
        renderAllStudents(allData.students);
        renderSchedule(allData.schedule);
        renderStats();
        renderFinancials(allData.financial_overview); // <-- جديد

    } catch (error) {
        console.error("Could not fetch data:", error);
        document.getElementById('students-container').innerHTML = `<p style="color:red; text-align:center;">فشل تحميل البيانات.</p>`;
    }
}

function renderStats() {
    const statsBar = document.getElementById('stats-bar');
    const totalStudents = allData.students.length;
    const totalGuardians = allData.guardians.length;
    let totalUnpaid = allData.students.reduce((sum, s) => sum + s.total_unpaid, 0);

    statsBar.innerHTML = `
        <span><strong>الطلاب:</strong> ${totalStudents}</span> | 
        <span><strong>الأولياء:</strong> ${totalGuardians}</span> | 
        <span><strong>إجمالي غير خالص:</strong> ${totalUnpaid.toFixed(2)} د.ت</span>
    `;
}

// <<< دالة جديدة لعرض البيانات المالية >>>
function renderFinancials(financialData) {
    if (!financialData) return;
    
    // تحديث الملخص
    const totalAmountEl = document.getElementById('total-overdue-amount');
    totalAmountEl.textContent = `${financialData.total_overdue_amount.toFixed(2)} د.ت`;

    // ملء جدول الدفعات المتأخرة
    const tableBody = document.getElementById('overdue-payments-table');
    tableBody.innerHTML = ''; // مسح البيانات القديمة

    if (financialData.overdue_payments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">لا توجد دفعات متأخرة حالياً.</td></tr>';
        return;
    }

    financialData.overdue_payments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.student_name}</td>
            <td>${payment.period_display}</td>
            <td class="amount-cell">${payment.amount.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// (باقي دوال الجافاسكريبت تبقى كما هي بدون تغيير)
function renderAllStudents(students) {
    const container = document.getElementById('students-container');
    container.innerHTML = '';

    if (!students || students.length === 0) {
        container.innerHTML = '<p>لا يوجد طلاب لعرضهم.</p>';
        return;
    }
    
    // فرز الطلاب أبجدياً حسب اللقب ثم الاسم
    const sortedStudents = [...students].sort((a, b) => {
        if (a.surname < b.surname) return -1;
        if (a.surname > b.surname) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    sortedStudents.forEach(student => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h3>${student.name} ${student.surname}</h3>
            <p><strong>📚 المستوى:</strong> ${student.educational_level}</p>
            <p><strong>👤 الولي:</strong> ${student.guardian_name} ${student.guardian_surname}</p>
            <p><strong>📞 الهاتف:</strong> ${student.phone_number || 'غير متوفر'}</p>
            <p class="status-line">
                <strong>❌ الغيابات:</strong> 
                <span class="${student.absence_count > 0 ? 'has-absences' : ''}">${student.absence_count}</span>
            </p>
            <p class="status-line">
                <strong>💵 غير خالص:</strong> 
                <span class="${student.total_unpaid > 0 ? 'is-unpaid' : ''}">${student.total_unpaid.toFixed(2)} د.ت</span>
            </p>
        `;
        container.appendChild(card);
    });
}

function filterStudents() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filteredStudents = allData.students.filter(s => {
        const fullName = `${s.name} ${s.surname}`.toLowerCase();
        const guardianName = `${s.guardian_name} ${s.guardian_surname}`.toLowerCase();
        return fullName.includes(searchTerm) || guardianName.includes(searchTerm);
    });
    renderAllStudents(filteredStudents);
}

function renderSchedule(scheduleData) {
    const container = document.getElementById('schedule-container');
    if (!container || !scheduleData) return;

    const scheduleGrid = {};
    TIME_SLOTS.forEach(time => {
        scheduleGrid[time] = {};
        DAYS_ORDER.forEach(day => scheduleGrid[time][day] = null);
    });

    scheduleData.forEach(entry => {
        if (scheduleGrid[entry.time_slot] && scheduleGrid[entry.time_slot][entry.day_of_week] !== undefined) {
            scheduleGrid[entry.time_slot][entry.day_of_week] = entry;
        }
    });

    let tableHtml = '<thead><tr><th>التوقيت</th>';
    DAYS_ORDER.forEach(day => tableHtml += `<th>${day}</th>`);
    tableHtml += '</tr></thead><tbody>';

    TIME_SLOTS.forEach(time => {
        tableHtml += `<tr><th>${time}</th>`;
        DAYS_ORDER.forEach(day => {
            const entry = scheduleGrid[time][day];
            if (entry) {
                const isPrivate = entry.class_type === 'private';
                const studentsHtml = isPrivate && entry.student_names ? `<small>${entry.student_names.replace(/,/g, '<br>')}</small>` : '';
                tableHtml += `<td><div class="class-entry ${isPrivate ? 'private-class' : 'general-class'}">
                                <strong>${entry.educational_level}</strong>
                                ${studentsHtml}
                              </div></td>`;
            } else {
                tableHtml += '<td></td>';
            }
        });
        tableHtml += '</tr>';
    });

    tableHtml += '</tbody>';
    container.innerHTML = tableHtml;
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    document.getElementById(`${tabId}-tab`).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
}
