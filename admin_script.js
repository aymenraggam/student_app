if (location.pathname.endsWith("admin.html")) {
  Promise.all([
    fetch("guardians.json").then(r => r.json()),
    fetch("students.json").then(r => r.json()),
    fetch("levels.json").then(r => r.json()),
    fetch("statistics.json").then(r => r.json())
  ]).then(([guardians, students, levels, statistics]) => {
    const levelMap = {};
    levels.forEach(l => levelMap[String(l.id)] = l.name);
    
    // جعل بيانات الطلاب متاحة على نطاق أوسع
    window.studentsData = students;

    document.getElementById('totalUnpaid').textContent = `${statistics.total_overdue_unpaid_amount} د.ت`;

    const stBody = document.querySelector("#students tbody");
    stBody.innerHTML = '';
    students.forEach(s => {
      const levelName = levelMap[String(s.educational_level)] || s.educational_level;
      const tr = document.createElement("tr");
      // عرض الغيابات كرابط
      const absencesLink = s.absence_count && s.absence_count.length > 0
          ? `<a href="#" class="show-absences-link" data-absences='${JSON.stringify(s.absence_count)}'>${s.absence_count.length}</a>`
          : '0';

      tr.innerHTML = `<td>${s.name} ${s.surname}</td>
                      <td>${levelName}</td>
                      <td>${s.phone_number}</td>
                      <td>${s.unpaid_total ?? 0} د.ت</td>
                      <td>${absencesLink}</td>
                      <td><button class="add-note-btn" data-student-id="${s.id}">إضافة ملاحظة</button></td>`;
      stBody.appendChild(tr);
    });

    stBody.addEventListener('click', e => {
        // عرض الغيابات
        if (e.target.classList.contains('show-absences-link')) {
            e.preventDefault();
            const absences = JSON.parse(e.target.dataset.absences);
            alert('تواريخ الغيابات:\n' + absences.join('\n'));
        }

        // إضافة ملاحظة
        if (e.target.classList.contains('add-note-btn')) {
            const studentId = parseInt(e.target.dataset.studentId, 10);
            const note = prompt(`أضف ملاحظة للطالب (ID: ${studentId}):`);
            if (note) {
                const student = window.studentsData.find(s => s.id === studentId);
                if (student) {
                    if (!student.notes) {
                        student.notes = [];
                    }
                    student.notes.push(note);
                    alert(`تمت إضافة الملاحظة:\n"${note}"\n\nملاحظة: لحفظ هذه الملاحظة بشكل دائم، يجب تحديث ملف students.json على الخادم.`);
                }
            }
        }
    });

    const gBody = document.querySelector("#guardians tbody");
    gBody.innerHTML = '';
    guardians.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${g.guardian_full_name}</td>
                      <td>${g.phone_number}</td>
                      <td>${g.student_ids.length}</td>
                      <td>${g.unpaid_total} د.ت</td>`;
      gBody.appendChild(tr);
    });

    document.getElementById("search").addEventListener("input", e => {
      const term = e.target.value.trim().toLowerCase();
      document.querySelectorAll("table.datatable tbody tr").forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(term) ? "" : "none";
      });
    });

  }).catch(error => {
      console.error('Error fetching data:', error);
      alert('حدث خطأ أثناء تحميل البيانات.');
  });
}
