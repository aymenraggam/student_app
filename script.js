document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

// متغيرات لتخزين كل البيانات
let allData = {};
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];

// جلب البيانات من ملف JSON
async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allData = await response.json();

        document.getElementById('last-updated').textContent = allData.last_updated;
        
        // عرض كل الأقسام بالبيانات الجديدة
        renderDashboard(allData.statistics);
        renderStudents(allData.students);
        renderGuardians(allData.guardians);
        renderSchedule(allData.schedule);

        // ربط أحداث البحث بعد تحميل البيانات
        document.getElementById('student-search-input').addEventListener('keyup', () => renderStudents(allData.students));
        document.getElementById('guardian-search-input').addEventListener('keyup', () => renderGuardians(allData.guardians));

    } catch (error) {
        console.error("Could not fetch data:", error);
        document.querySelector('.main-content').innerHTML = `<p style="color:red; text-align:center;">فشل تحميل البيانات. تأكد من تحديث وتصدير ملف data.json من البرنامج.</p>`;
    }
}

// 1. عرض صفحة الإحصائيات
function renderDashboard(stats) {
    const container = document.getElementById('stats-container');
    container.innerHTML = `
        <div class="stat-card">
            <div class="value">${stats.total_students}</div>
            <div class="label">إجمالي الطلاب</div>
        </div>
        <div class="stat-card">
            <div class="value">${stats.active_guardians}</div>
            <div class="label">ولي نشط</div>
        </div>
        <div class="stat-card">
            <div class="value" style="color: #dc3545;">${stats.total_unpaid_overall.toFixed(2)}</div>
            <div class="label">د.ت (دفعات فائتة)</div>
        </div>
    `;
}

// 2. عرض الطلاب في بطاقات
function renderStudents(students) {
    const searchTerm = document.getElementById('student-search-input').value.toLowerCase();
    const filteredStudents = students.filter(student => {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        const guardianName = `${student.guardian_name} ${student.guardian_surname}`.toLowerCase();
        return fullName.includes(searchTerm) || guardianName.includes(searchTerm);
    });

    const container = document.getElementById('students-container');
    container.innerHTML = ''; 

    if (filteredStudents.length === 0) {
        container.innerHTML = `<p style="text-align:center;">لا يوجد طلاب مطابقون للبحث.</p>`;
        return;
    }

    filteredStudents.forEach(student => {
        const card = document.createElement('div');
        card.className = 'student-card';
        const absenceClass = student.absence_count > 0 ? 'unpaid' : 'no-absences';
        const unpaidClass = student.total_unpaid > 0 ? 'unpaid' : 'no-absences';

        card.innerHTML = `
            <h2>${student.name} ${student.surname}</h2>
            <div class="details">
                <p><strong>المستوى:</strong> ${student.educational_level}</p>
                <p><strong>الولي:</strong> ${student.guardian_name} ${student.guardian_surname}</p>
                <p><strong>الهاتف:</strong> ${student.phone_number || 'غير مسجل'}</p>
            </div>
            <div class="status">
                <div class="status-item">
                    <div class="value ${unpaidClass}">${student.total_unpaid.toFixed(2)}</div>
                    <div class="label">د.ت (غير خالص)</div>
                </div>
                <div class="status-item">
                    <div class="value ${absenceClass}">${student.absence_count}</div>
                    <div class="label">غيابات</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. عرض الأولياء في بطاقات
function renderGuardians(guardians) {
    const searchTerm = document.getElementById('guardian-search-input').value.toLowerCase();
    const filteredGuardians = guardians.filter(g => {
        const fullName = `${g.guardian_name} ${g.guardian_surname}`.toLowerCase();
        return fullName.includes(searchTerm) || (g.phone_number && g.phone_number.includes(searchTerm));
    });

    const container = document.getElementById('guardians-container');
    container.innerHTML = '';

    if (filteredGuardians.length === 0) {
        container.innerHTML = `<p style="text-align:center;">لا يوجد أولياء مطابقون للبحث.</p>`;
        return;
    }

    filteredGuardians.forEach(g => {
        const card = document.createElement('div');
        card.className = 'student-card'; // Re-use student card style
        const unpaidClass = g.total_unpaid > 0 ? 'unpaid' : 'no-absences';

        card.innerHTML = `
            <h2>${g.guardian_name} ${g.guardian_surname}</h2>
            <div class="details">
                 <p><strong>الهاتف:</strong> ${g.phone_number || 'غير مسجل'}</p>
            </div>
            <div class="status">
                <div class="status-item">
                    <div class="value">${g.children_count}</div>
                    <div class="label">عدد الأبناء</div>
                </div>
                <div class="status-item">
                    <div class="value ${unpaidClass}">${g.total_unpaid.toFixed(2)}</div>
                    <div class="label">د.ت (غير خالص)</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 4. عرض جدول الحصص
function renderSchedule(scheduleData) {
    const container = document.getElementById('schedule-container');
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

    let tableHtml = '<div class="schedule-wrapper"><table class="schedule-table"><thead><tr><th>التوقيت</th>';
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

    tableHtml += '</tbody></table></div>';
    container.innerHTML = tableHtml;
}

// التحكم في عرض الصفحات
function showPage(pageId) {
    // إخفاء كل الصفحات
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    // إزالة الحالة النشطة من كل روابط التصفح
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    // إظهار الصفحة المطلوبة
    document.getElementById(`${pageId}-page`).classList.add('active');
    // تفعيل الرابط المطلوب
    const activeLink = document.querySelector(`.nav-link[onclick="showPage('${pageId}')"]`);
    activeLink.classList.add('active');

    // تحديث عنوان الصفحة
    document.getElementById('page-title').textContent = activeLink.textContent.replace(/📊|👥|👤|🗓️/g, '').trim();
}
