document.getElementById('management-login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const password = document.getElementById('management-password').value;
    // يمكنك تغيير "your_password_here" بكلمة المرور التي تحددها
    const managementPassword = 'كلمة_السر_الخاصة_بالإدارة';

    if (password === managementPassword) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        fetchManagementData();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

async function fetchManagementData() {
    try {
        // افترض أن ملفًا باسم 'management_data.json'
        // يحتوي على جميع البيانات (الطلاب، الأولياء، الدفعات)
        const response = await fetch('management_data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        renderManagementDashboard(data);
    } catch (error) {
        console.error("Could not fetch management data:", error);
        document.getElementById('dashboard').innerHTML = 
            `<p style="color:red; text-align:center;">فشل تحميل بيانات الإدارة. تأكد من تحديث ملف management_data.json.</p>`;
    }
}

function renderManagementDashboard(data) {
    const dashboardContainer = document.getElementById('dashboard');
    dashboardContainer.innerHTML = `
        <h2>بيانات الطلاب</h2>
        <table class="management-table">
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>اللقب</th>
                    <th>المستوى</th>
                    <th>تاريخ الدخول</th>
                    <th>هاتف الولي</th>
                </tr>
            </thead>
            <tbody>
                ${data.students.map(s => `
                    <tr>
                        <td>${s.name}</td>
                        <td>${s.surname}</td>
                        <td>${s.educational_level}</td>
                        <td>${s.entry_date}</td>
                        <td>${s.phone_number}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>التقرير المالي</h2>
        <table class="management-table">
            <thead>
                <tr>
                    <th>اسم الطالب</th>
                    <th>فترة الدفعة</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
                ${data.all_payments.map(p => `
                    <tr>
                        <td>${p.student_name}</td>
                        <td>${p.payment_period}</td>
                        <td>${p.amount.toFixed(2)} د.ت</td>
                        <td>${p.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
