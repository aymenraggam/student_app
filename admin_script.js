// --- حماية بكلمة السر (لا تغيير هنا) ---
const correctPassword = "fitourifitouri";
const enteredPassword = prompt("الرجاء إدخال كلمة سر الإدارة:", "");

if (enteredPassword !== correctPassword) {
    alert("كلمة السر خاطئة! لا يمكن الوصول.");
    document.body.innerHTML = '<h1 style="text-align:center; color:red; margin-top: 50px;">وصول مرفوض</h1>';
} else {
    // تم تبسيط الكود: نقوم بتشغيل الدالة مباشرةً بعد إدخال كلمة السر
    initializeAdminPage();
}
// ------------------------------------

let allData = {};
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "20:00 - 22:00"];

function initializeAdminPage() {
    // تم إزالة مستمع الحدث (event listener)
    fetchData();

    // ربط الأزرار مباشرةً
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('onclick').match(/'(.*?)'/)[1];
            showTab(tabId);
        });
    });
}

async function fetchData() {
    try {
        const response = await fetch(`data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allData = await response.json();

        // استدعاء جميع دوال العرض
        renderAllStudents(allData.students);
        renderSchedule(allData.schedule);
        renderFinancialData(allData.financial_data);
        
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function renderAllStudents(students) {
    const container = document.getElementById('students-container');
    container.innerHTML = '';
    // الكود الأصلي لعرض الطلاب
    students.forEach(student => {
        const studentCard = `
            <div class="student-card">
                <h3>${student.name} ${student.surname}</h3>
                <p><strong>المستوى:</strong> ${student.educational_level}</p>
                <p><strong>غياب:</strong> ${student.absence_count} حصة</p>
                <p><strong>متأخرات:</strong> ${student.total_unpaid} د.ت</p>
            </div>
        `;
        container.innerHTML += studentCard;
    });
}

function renderFinancialData(financialData) {
    const overdueTable = document.getElementById('overdue-payments-table');
    const totalAmountSpan = document.getElementById('total-overdue-amount');
    let totalOverdue = 0;
    overdueTable.innerHTML = '';
    // الكود الأصلي لعرض البيانات المالية
    financialData.forEach(item => {
        const row = `
            <tr>
                <td>${item.student_name}</td>
                <td>${item.period}</td>
                <td>${item.amount} د.ت</td>
            </tr>
        `;
        overdueTable.innerHTML += row;
        totalOverdue += item.amount;
    });
    totalAmountSpan.textContent = `${totalOverdue.toFixed(2)} د.ت`;
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
                tableHtml += `<td><div class=\"class-entry ${isPrivate ? 'private-class' : 'general-class'}\">
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
