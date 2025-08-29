document.addEventListener('DOMContentLoaded', () => {
    const guardianData = sessionStorage.getItem('loggedInGuardian');

    // إذا لم يجد بيانات الولي، يعود لصفحة الدخول
    if (!guardianData) {
        window.location.href = 'index.html';
        return;
    }

    const guardian = JSON.parse(guardianData);
    displayGuardianInfo(guardian);
    
    // ربط زر تسجيل الخروج
    document.getElementById('logout-button').addEventListener('click', () => {
        sessionStorage.removeItem('loggedInGuardian');
        window.location.href = 'index.html';
    });
});

function displayGuardianInfo(guardian) {
    document.getElementById('welcome-message').textContent = `مرحباً بك، ${guardian.guardian_name} ${guardian.guardian_surname}`;
    fetchAndDisplayChildren(guardian.guardian_id);
}

async function fetchAndDisplayChildren(guardianId) {
    try {
        const response = await fetch(`data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('فشل تحميل البيانات');
        
        const allData = await response.json();
        
        // عرض جدول الحصص العام
        renderSchedule(allData.schedule);

        // فلترة الطلاب لإيجاد أبناء هذا الولي فقط
        const children = allData.students.filter(student => student.guardian_id === guardianId);
        
        const container = document.getElementById('children-container');
        container.innerHTML = '';

        if (children.length === 0) {
            container.innerHTML = '<p>لا يوجد أبناء مسجلون لهذا الولي.</p>';
            return;
        }

        children.forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card compact'; // استخدام تصميم مضغوط للبطاقة

            const absenceClass = student.absence_count > 0 ? 'unpaid' : 'no-absences';
            const unpaidClass = student.total_unpaid > 0 ? 'unpaid' : 'no-absences';

            card.innerHTML = `
                <h2>${student.name} ${student.surname}</h2>
                <div class="details">
                    <p><strong>المستوى:</strong> ${student.educational_level}</p>
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

    } catch (error) {
        console.error(error);
        document.getElementById('children-container').innerHTML = '<p style="color:red;">حدث خطأ أثناء عرض بيانات الأبناء.</p>';
    }
}

// دالة عرض الجدول (مكررة من script.js لتعمل هنا أيضاً)
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];

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

    let theadHtml = '<thead><tr><th>التوقيت</th>';
    DAYS_ORDER.forEach(day => theadHtml += `<th>${day}</th>`);
    theadHtml += '</tr></thead>';

    let tbodyHtml = '<tbody>';
    TIME_SLOTS.forEach(time => {
        tbodyHtml += `<tr><th>${time}</th>`;
        DAYS_ORDER.forEach(day => {
            const entry = scheduleGrid[time][day];
            if (entry) {
                const isPrivate = entry.class_type === 'private';
                 const studentsHtml = isPrivate && entry.student_names ? `<small>${entry.student_names.replace(/,/g, '<br>')}</small>` : '';
                tbodyHtml += `<td><div class="class-entry ${isPrivate ? 'private-class' : 'general-class'}">
                                <strong>${entry.educational_level}</strong>
                                ${studentsHtml}
                              </div></td>`;
            } else {
                tbodyHtml += '<td></td>';
            }
        });
        tbodyHtml += '</tr>';
    });
    tbodyHtml += '</tbody>';

    container.innerHTML = theadHtml + tbodyHtml;
}
