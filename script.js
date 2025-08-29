document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

// متغير لتخزين كل البيانات بعد تحميلها
let allData = {};
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "20:00 - 22:00"];

// جلب البيانات من ملف JSON
async function fetchData() {
    try {
        // إضافة متغير عشوائي لمنع المتصفح من استخدام النسخة القديمة (cache)
        const response = await fetch(`data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allData = await response.json();
        renderSchedule(allData.schedule);

    } catch (error) {
        console.error("Could not fetch data:", error);
        document.querySelector('.main-content').innerHTML = 
            `<p style="color:red; text-align:center; font-size: 1.2rem;">
                ❌ فشل تحميل البيانات. <br>
                تأكد من تحديث وتصدير ملف data.json من البرنامج الرئيسي.
            </p>`;
    }
}

// 🗓️ عرض جدول الحصص
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

// 🔐 تسجيل الدخول
function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginError = document.getElementById('login-error');

    if (!allData.guardians) {
        loginError.textContent = 'بيانات الأولياء غير متوفرة. يرجى التصدير من جديد.';
        loginError.style.display = 'block';
        return;
    }

    // البحث في قائمة الأولياء
    const guardian = allData.guardians.find(g => 
        (g.phone_number === username || g.guardian_name === username) 
        && g.password === password
    );

    if (guardian) {
        loginError.style.display = 'none';
        showGuardianDashboard(guardian);
    } else {
        loginError.textContent = '❌ خطأ في الدخول، تأكد من المعلومات.';
        loginError.style.display = 'block';
    }
}

// 👨‍👩‍👦 عرض صفحة بيانات الولي وأبنائه (نسخة محسّنة)
function showGuardianDashboard(guardian) {
    const container = document.querySelector('.main-content');
    
    // فلترة أبناء الولي المحدد فقط
    const children = allData.students.filter(s => s.guardian_identifier === guardian.identifier);

    container.innerHTML = `
        <header class="guardian-dashboard-header">
            <h1>مرحباً، ${guardian.guardian_name} ${guardian.guardian_surname}</h1>
            <button onclick="logout()" class="logout-button">تسجيل الخروج</button>
        </header>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">📞</div>
                <div class="label">${guardian.phone_number}</div>
            </div>
            <div class="stat-card">
                <div class="value">${guardian.children_count}</div>
                <div class="label">عدد الأبناء</div>
            </div>
            <div class="stat-card">
                <div class="value unpaid-value">${guardian.total_unpaid.toFixed(2)}</div>
                <div class="label">إجمالي غير خالص (د.ت)</div>
            </div>
        </div>

        <h2>تفاصيل الأبناء:</h2>
        <div class="cards-container">
            ${children.map(student => `
                <div class="student-card">
                    <h3>${student.name} ${student.surname}</h3>
                    <p><strong>📚 المستوى:</strong> ${student.educational_level}</p>
                    <p class="status-line">
                        <strong>❌ الغيابات:</strong> 
                        <span class="${student.absence_count > 0 ? 'has-absences' : ''}">${student.absence_count}</span>
                    </p>
                    <p class="status-line">
                        <strong>💵 غير خالص:</strong> 
                        <span class="${student.total_unpaid > 0 ? 'is-unpaid' : ''}">${student.total_unpaid.toFixed(2)} د.ت</span>
                    </p>
                </div>
            `).join('') || '<p>لا يوجد أبناء مسجلون لهذا الولي.</p>'}
        </div>
    `;
}

// 🚪 تسجيل الخروج والعودة للصفحة الرئيسية
function logout() {
    // ببساطة، إعادة تحميل الصفحة سيعيدك إلى شاشة تسجيل الدخول
    location.reload();
}
