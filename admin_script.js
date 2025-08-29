let allData = {};

async function fetchData() {
    try {
        const [studentsRes, guardiansRes, levelsRes, permRes, tempRes] = await Promise.all([
            fetch("students.json"),
            fetch("guardians.json"),
            fetch("levels.json"),
            fetch("schedule_permanent.json"),
            fetch("schedule_temporary.json")
        ]);

        const students = await studentsRes.json();
        const guardians = await guardiansRes.json();
        const levels = await levelsRes.json();
        const schedulePermanent = await permRes.json();
        const scheduleTemporary = await tempRes.json();

        allData = { students, guardians, levels, schedulePermanent, scheduleTemporary };

        const studentsWithGuardians = students.map(st => {
            const guardian = guardians.find(g => g.student_ids.includes(st.id));
            return {
                ...st,
                guardian_name: guardian ? guardian.guardian_full_name : 'غير متوفر',
                phone_number: guardian ? guardian.phone_number : 'غير متوفر'
            };
        });

        renderAllStudents(studentsWithGuardians);
        renderSchedule(schedulePermanent);
        renderStats(studentsWithGuardians);
        renderFinancials(studentsWithGuardians);

        showTab('students');

    } catch (error) {
        console.error("Could not fetch data:", error);
        document.getElementById('students-container').innerHTML = `<p style="color:red; text-align:center;">فشل تحميل البيانات.</p>`;
    }
}

function renderStats(students) {
    const statsBar = document.getElementById('stats-bar');
    const totalStudents = students.length;
    const totalGuardians = allData.guardians.length;
    let totalUnpaid = students.reduce((sum, s) => sum + s.unpaid_total, 0);

    statsBar.innerHTML = `
        <span><strong>الطلاب:</strong> ${totalStudents}</span> | 
        <span><strong>الأولياء:</strong> ${totalGuardians}</span> | 
        <span><strong>إجمالي غير خالص:</strong> ${totalUnpaid.toFixed(2)} د.ت</span>
    `;
}

function renderFinancials(students) {
    const totalAmountEl = document.getElementById('total-overdue-amount');
    const tableBody = document.getElementById('overdue-payments-table');

    let overduePayments = [];
    students.forEach(st => {
        if (st.unpaid_periods && st.unpaid_periods.length > 0) {
            st.unpaid_periods.forEach(p => {
                overduePayments.push({
                    student_name: `${st.name} ${st.surname}`,
                    period_display: p.period,
                    amount: p.amount
                });
            });
        }
    });

    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    totalAmountEl.textContent = `${totalOverdue.toFixed(2)} د.ت`;

    tableBody.innerHTML = '';
    if (overduePayments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">لا توجد دفعات متأخرة حالياً.</td></tr>';
        return;
    }

    overduePayments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.student_name}</td>
            <td>${payment.period_display}</td>
            <td class="amount-cell">${payment.amount.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function renderAllStudents(students) {
    const container = document.getElementById('students-container');
    container.innerHTML = '';

    students.forEach(student => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h3>${student.name} ${student.surname}</h3>
            <p><strong>📚 المستوى:</strong> ${student.educational_level}</p>
            <p><strong>👤 الولي:</strong> ${student.guardian_name}</p>
            <p><strong>📞 الهاتف:</strong> ${student.phone_number}</p>
            <p><strong>❌ الغيابات:</strong> ${student.absence_count}</p>
            <p><strong>💵 غير خالص:</strong> ${student.unpaid_total.toFixed(2)} د.ت</p>
        `;
        container.appendChild(card);
    });
}

function renderSchedule(scheduleData) {
    const container = document.getElementById('schedule-container');
    if (!scheduleData || scheduleData.length === 0) {
        container.innerHTML = "<tr><td>لا يوجد جدول</td></tr>";
        return;
    }

    let tableHtml = '<thead><tr><th>اليوم</th><th>التوقيت</th><th>المستوى</th><th>النوع</th></tr></thead><tbody>';
    scheduleData.forEach(entry => {
        tableHtml += `
            <tr>
                <td>${entry.day_of_week}</td>
                <td>${entry.time_slot}</td>
                <td>${entry.educational_level}</td>
                <td>${entry.class_type === "private" ? "خاصة" : "عامة"}</td>
            </tr>`;
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

fetchData();
