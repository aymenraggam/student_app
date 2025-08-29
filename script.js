document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    // ربط دالة تسجيل الدخول مع الفورم
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', login);
});

let allData = {}; // لتخزين كل البيانات
const DAYS_ORDER = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const TIME_SLOTS = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];

async function fetchData() {
    try {
        // ✅ تم إصلاح طريقة جلب البيانات لتجنب مشاكل الـ cache
        const response = await fetch(`data.json?v=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allData = await response.json();
        
        // ✅ تم إصلاح تحديث تاريخ آخر تعديل
        if (allData.last_updated) {
            document.getElementById('last-updated').textContent = `آخر تحديث: ${allData.last_updated}`;
        }
        
        renderSchedule(allData.schedule);

    } catch (error) {
        console.error("Could not fetch data:", error);
        // عرض الخطأ في مكان مناسب
        const scheduleContainer = document.getElementById('schedule-container');
        if(scheduleContainer) {
            scheduleContainer.innerHTML = `<tr><td colspan="${DAYS_ORDER.length + 1}" style="color:red; text-align:center;">فشل تحميل البيانات. تأكد من تشغيل خاصية "تصدير للويب" في التطبيق.</td></tr>`;
        }
    }
}

// ✅ تم إصلاح دالة عرض الجدول بالكامل
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

    // بناء محتوى الجدول بدلاً من بناء جدول جديد
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


// ✅ دالة تسجيل الدخول الجديدة بالكامل
async function login(event) {
    event.preventDefault(); // منع الفورم من إعادة تحميل الصفحة

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');

    // التأكد من أن البيانات تم تحميلها
    if (!allData.guardians) {
        errorElement.textContent = "البيانات غير جاهزة، الرجاء المحاولة بعد لحظات.";
        errorElement.style.display = 'block';
        return;
    }

    // البحث عن الولي المطابق
    const guardian = allData.guardians.find(g => {
        const fullName = `${g.guardian_name} ${g.guardian_surname}`;
        return (g.phone_number === usernameInput || fullName === usernameInput) && g.password === passwordInput;
    });

    if (guardian) {
        errorElement.style.display = 'none';
        // تخزين بيانات الولي في المتصفح للانتقال إلى صفحته الخاصة
        sessionStorage.setItem('loggedInGuardian', JSON.stringify(guardian));
        // الانتقال إلى صفحة الولي
        window.location.href = 'guardian_portal.html';
    } else {
        errorElement.textContent = "❌ خطأ في الدخول، تأكد من المعلومات.";
        errorElement.style.display = 'block';
    }
}
