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
            container.innerHTML = '<p>لا يوجد أبناء مسجلين تحت هذا الحساب.</p>';
            return;
        }

        children.forEach(child => {
            const childCard = document.createElement('div');
            childCard.className = 'student-card';
            
            // فلترة الدفعات المتأخرة لهذا الطفل
            const childOverduePayments = allData.financial_overview.overdue_payments.filter(payment => payment.student_name === `${child.name} ${child.surname}`);
            
            childCard.innerHTML = `
                <h3>${child.name} ${child.surname}</h3>
                <p><strong>📚 المستوى:</strong> ${child.educational_level}</p>
                <p><strong>❌ الغيابات:</strong> ${child.absence_count} حصة</p>
                <p class="status-line">
                    <strong>💵 غير خالص:</strong> 
                    <span class="${child.total_unpaid > 0 ? 'is-unpaid' : ''}">${child.total_unpaid.toFixed(2)} د.ت</span>
                </p>
                <div class="financial-details" style="display: none;">
                    <h4>الدفعات المتأخرة:</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>الفترة</th>
                                <th>المبلغ (د.ت)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${childOverduePayments.map(p => `
                                <tr>
                                    <td>${p.period_display}</td>
                                    <td>${p.amount.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            ${childOverduePayments.length === 0 ? '<tr><td colspan="2">لا توجد دفعات متأخرة.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
                <button class="toggle-details-btn">إظهار التفاصيل</button>
            `;
            container.appendChild(childCard);
        });

        // ربط زر إظهار التفاصيل
        document.querySelectorAll('.toggle-details-btn').forEach(button => {
            button.addEventListener('click', () => {
                const details = button.previousElementSibling;
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    button.textContent = 'إخفاء التفاصيل';
                } else {
                    details.style.display = 'none';
                    button.textContent = 'إظهار التفاصيل';
                }
            });
        });

    } catch (error) {
        console.error("فشل تحميل البيانات:", error);
        document.getElementById('children-container').innerHTML = '<p style="color:red;">فشل تحميل بيانات الأبناء. يرجى المحاولة لاحقًا.</p>';
    }
}

// دالة عرض الجدول
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "20:00 - 22:00"];

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
