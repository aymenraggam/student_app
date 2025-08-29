async function fetchAndDisplayChildren(guardianPhone) {
    try {
        const [studentsRes, guardiansRes, scheduleRes] = await Promise.all([
            fetch("students.json"),
            fetch("guardians.json"),
            fetch("schedule_permanent.json")
        ]);

        const students = await studentsRes.json();
        const guardians = await guardiansRes.json();
        const schedule = await scheduleRes.json();

        const guardian = guardians.find(g => g.phone_number === guardianPhone);
        if (!guardian) {
            document.getElementById('children-container').innerHTML = '<p>لم يتم العثور على بيانات الولي.</p>';
            return;
        }

        renderSchedule(schedule);

        const children = students.filter(st => guardian.student_ids.includes(st.id));
        const container = document.getElementById('children-container');
        container.innerHTML = '';

        if (children.length === 0) {
            container.innerHTML = '<p>لا يوجد أبناء مسجلون لهذا الولي.</p>';
            return;
        }

        children.forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card compact';

            const absenceClass = student.absence_count > 0 ? 'unpaid' : 'no-absences';
            const unpaidClass = student.unpaid_total > 0 ? 'unpaid' : 'no-absences';

            card.innerHTML = `
                <h2>${student.name} ${student.surname}</h2>
                <div class="details">
                    <p><strong>المستوى:</strong> ${student.educational_level}</p>
                </div>
                <div class="status">
                    <div class="status-item">
                        <div class="value ${unpaidClass}">${student.unpaid_total.toFixed(2)}</div>
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

function displayGuardianInfo(guardian) {
    document.getElementById('welcome-message').textContent = `مرحباً بك، ${guardian.guardian_full_name}`;
    fetchAndDisplayChildren(guardian.phone_number);
}

function renderSchedule(scheduleData) {
    const container = document.getElementById('schedule-container');
    if (!scheduleData || scheduleData.length === 0) {
        container.innerHTML = "<tr><td>لا يوجد جدول حالياً</td></tr>";
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
