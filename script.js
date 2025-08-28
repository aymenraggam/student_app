document.addEventListener('DOMContentLoaded', () => {
    // تحميل البيانات عند فتح الصفحة
    fetchData();

    // ربط حدث البحث
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keyup', filterStudents);
});

let allStudents = [];
let allSchedule = [];
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];

// جلب البيانات من ملف JSON
async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        allStudents = data.students;
        allSchedule = data.schedule;

        document.getElementById('last-updated').textContent = data.last_updated;
        
        renderStudents(allStudents);
        renderSchedule(allSchedule);

    } catch (error) {
        console.error("Could not fetch data:", error);
        document.getElementById('students-container').innerHTML = `<p style="color:red; text-align:center;">فشل تحميل البيانات. تأكد من وجود ملف data.json.</p>`;
    }
}

// عرض الطلاب في بطاقات
function renderStudents(studentsToRender) {
    const container = document.getElementById('students-container');
    container.innerHTML = ''; // مسح المحتوى القديم

    if (studentsToRender.length === 0) {
        container.innerHTML = `<p style="text-align:center;">لا يوجد طلاب مطابقون للبحث.</p>`;
        return;
    }

    studentsToRender.forEach(student => {
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

// عرض جدول الحصص
function renderSchedule(scheduleData) {
    const container = document.getElementById('schedule-container');
    
    // إنشاء هيكل الجدول الفارغ
    const scheduleGrid = {};
    TIME_SLOTS.forEach(time => {
        scheduleGrid[time] = {};
        DAYS_ORDER.forEach(day => {
            scheduleGrid[time][day] = null;
        });
    });

    // ملء الهيكل بالحصص الموجودة
    scheduleData.forEach(entry => {
        if (scheduleGrid[entry.time_slot] && scheduleGrid[entry.time_slot][entry.day_of_week] !== undefined) {
            scheduleGrid[entry.time_slot][entry.day_of_week] = entry;
        }
    });

    // تحويل الهيكل إلى HTML
    let tableHtml = '<table class="schedule-table"><thead><tr><th>التوقيت</th>';
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

    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
}


// فلترة الطلاب بناء على البحث
function filterStudents() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtered = allStudents.filter(student => {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        const guardianName = `${student.guardian_name} ${student.guardian_surname}`.toLowerCase();
        return fullName.includes(searchTerm) || guardianName.includes(searchTerm);
    });
    renderStudents(filtered);
}

// التحكم في التبويبات (Tabs)
function showTab(tabId) {
    // إخفاء كل المحتويات
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    // إزالة الحالة النشطة من كل الأزرار
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    // إظهار المحتوى المطلوب
    document.getElementById(`${tabId}-tab`).classList.add('active');
    // تفعيل الزر المطلوب
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
}