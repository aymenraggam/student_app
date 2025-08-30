if (location.pathname.endsWith("admin.html")) {
  Promise.all([
    fetch("guardians.json").then(r => r.json()),
    fetch("students.json").then(r => r.json()),
    fetch("levels.json").then(r => r.json()),
    fetch("statistics.json").then(r => r.json()) // <<< إضافة جلب ملف الإحصائيات هنا
  ]).then(([guardians, students, levels, statistics]) => { // <<< إضافة متغير statistics هنا
    const levelMap = {};
    levels.forEach(l => levelMap[String(l.id)] = l.name);

    // تحديث إجمالي المبالغ غير الخالصة
    document.getElementById('totalUnpaid').textContent = `${statistics.total_overdue_unpaid_amount} د.ت`;

    // الطلبة
    const stBody = document.querySelector("#students tbody");
    stBody.innerHTML = ''; // تنظيف الجدول قبل التعبئة
    students.forEach(s => {
      const levelName = levelMap[String(s.educational_level)] || s.educational_level;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.name} ${s.surname}</td>
                      <td>${levelName}</td>
                      <td>${s.phone_number}</td>
                      <td>${s.unpaid_total ?? 0} د.ت</td>`;
      stBody.appendChild(tr);
    });

    // إضافة مستمع للأحداث (Event Listener) لفتح النافذة المنبثقة
    stBody.addEventListener('click', e => {
        if (e.target.classList.contains('show-absences-link')) {
            e.preventDefault();
            const absences = JSON.parse(e.target.dataset.absences);
            if (absences.length > 0) {
                let htmlContent = '<h4>تواريخ الغيابات:</h4><ul>';
                absences.forEach(date => {
                    htmlContent += `<li>${date}</li>`;
                });
                htmlContent += '</ul>';
                alert(htmlContent.replace(/<br>/g, '\n').replace(/<h4>|<\/h4>|<ul>|<\/ul>|<li>|<\/li>/g, ''));
            } else {
                alert('لا توجد غيابات مسجلة.');
            }
        }
    });

    // الأولياء
    const gBody = document.querySelector("#guardians tbody");
    gBody.innerHTML = ''; // تنظيف الجدول قبل التعبئة
    guardians.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${g.guardian_full_name}</td>
                      <td>${g.phone_number}</td>
                      <td>${g.student_ids.length}</td>
                      <td>${g.unpaid_total} د.ت</td>`;
      gBody.appendChild(tr);
    });

    // البحث
    document.getElementById("search").addEventListener("input", e => {
      const term = e.target.value.trim();
      document.querySelectorAll("table.datatable tbody tr").forEach(tr => {
        tr.style.display = tr.innerText.includes(term) ? "" : "none";
      });
    });

  }).catch(error => {
      console.error('Error fetching data:', error);
      alert('حدث خطأ أثناء تحميل البيانات. يرجى التأكد من وجود ملفات التصدير.');
  });
}
