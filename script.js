document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

// تخزين كل البيانات
let allData = {};
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];

// جلب البيانات من ملف JSON
async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allData = await response.json();
        renderSchedule(allData.schedule);

    } catch (error) {
        console.error("Could not fetch data:", error);
        document.querySelector('.main-content').innerHTML = 
            `<p style="color:red; text-align:center;">فشل تحميل البيانات. تأكد من تحديث وتصدير ملف data.json من البرنامج.</p>`;
    }
}

// 🗓️ عرض جدول الحصص
function renderSchedule(scheduleData) {
    const container = document.getElementById('schedule-container');
    if (!container) return;

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

// 🔐 تسجيل الدخول
function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // البحث في قائمة الأولياء
    const guardian = allData.guardians.find(g => 
    (g.phone_number === username || g.guardian_name === username) 
    && g.password === password
    );

    if (guardian) {
        document.getElementById('login-error').style.display = 'none';
        showGuardianDashboard(guardian);
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// 👨‍👩‍👦 صفحة بيانات الولي وأبنائه
function showGuardianDashboard(guardian) {
    const container = document.querySelector('.main-content');
    container.innerHTML = `
        <header><h1>مرحبا ${guardian.guardian_name} ${guardian.guardian_surname}</h1></header>
        
        <div class="stat-card">
            <p><strong>📞 الهاتف:</strong> ${guardian.phone_number}</p>
            <p><strong>👨‍👩‍👦 عدد الأبناء:</strong> ${guardian.children_count}</p>
            <p><strong>💰 إجمالي غير خالص:</strong> ${guardian.total_unpaid.toFixed(2)} د.ت</p>
        </div>

        <h2>أبناؤك:</h2>
        <div class="cards-container">
            ${allData.students.filter(s => s.guardian_id === guardian.guardian_id).map(student => `
                <div class="student-card">
                    <h2>${student.name} ${student.surname}</h2>
                    <p><strong>📚 المستوى:</strong> ${student.educational_level}</p>
                    <p><strong>❌ غيابات:</strong> ${student.absence_count}</p>
                    <p><strong>💵 غير خالص:</strong> ${student.total_unpaid.toFixed(2)} د.ت</p>
                </div>
            `).join('')}
        </div>
    `;
}

