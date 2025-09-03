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

    // إنشاء خريطة لربط كل طالب بالولي الخاص به لتسهيل البحث
    // نستخدم String() لضمان أن تكون المفاتيح نصية دائمًا
    const studentToGuardianMap = {};
    guardians.forEach(g => {
        g.student_ids.forEach(studentId => {
            studentToGuardianMap[String(studentId)] = g;
        });
    });

    // دالة لتسجيل الدخول كولي
    const loginAsGuardian = (guardian) => {
        if (guardian) {
            sessionStorage.setItem("guardian", JSON.stringify(guardian));
            window.open("guardian_portal.html", "_blank");
        } else {
            alert("لم يتم العثور على الولي المرتبط.");
        }
    };

    document.getElementById('totalUnpaid').textContent = `${statistics.total_overdue_unpaid_amount} د.ت`;

    const stBody = document.querySelector("#students tbody");
    stBody.innerHTML = '';
    students.forEach(s => {
      const levelName = levelMap[String(s.educational_level)] || s.educational_level;
      const tr = document.createElement("tr");

      // البحث عن ولي أمر الطالب باستخدام مفتاح نصي
      const guardian = studentToGuardianMap[String(s.id)];
      
      const studentNameCell = guardian 
        ? `<a href="#" class="login-as-guardian-link" data-guardian-id="${guardian.id}">${s.name} ${s.surname}</a>`
        : `${s.name} ${s.surname}`;

      const absencesLink = s.absence_count && s.absence_count.length > 0
          ? `<a href="#" class="show-absences-link" data-absences='${JSON.stringify(s.absence_count)}'>${s.absence_count.length}</a>`
          : '0';

      tr.innerHTML = `<td>${studentNameCell}</td>
                      <td>${levelName}</td>
                      <td>${s.phone_number}</td>
                      <td>${s.unpaid_total ?? 0} د.ت</td>
                      <td>${absencesLink}</td>
                      <td><button class="add-note-btn" data-student-id="${s.id}">إضافة ملاحظة</button></td>`;
      stBody.appendChild(tr);
    });

    const gBody = document.querySelector("#guardians tbody");
    gBody.innerHTML = '';
    guardians.forEach(g => {
      const tr = document.createElement("tr");
      const guardianNameCell = `<a href="#" class="login-as-guardian-link" data-guardian-id="${g.id}">${g.guardian_full_name}</a>`;
      tr.innerHTML = `<td>${guardianNameCell}</td>
                      <td>${g.phone_number}</td>
                      <td>${g.student_ids.length}</td>
                      <td>${g.unpaid_total} د.ت</td>`;
      gBody.appendChild(tr);
    });
    
    // دالة موحدة للتعامل مع النقرات وتسجيل الدخول كولي
    const handleLoginClick = (event) => {
        if (event.target.classList.contains('login-as-guardian-link')) {
            event.preventDefault();
            const guardianId = event.target.dataset.guardianId;
            // نستخدم '==' للمقارنة المتساهلة لتجنب مشاكل أنواع البيانات (رقم مقابل نص)
            const guardian = guardians.find(g => g.id == guardianId);
            loginAsGuardian(guardian);
        }
    };

    // تطبيق الدالة على كلا الجدولين
    stBody.addEventListener('click', handleLoginClick);
    gBody.addEventListener('click', handleLoginClick);

    // التعامل مع الأحداث الأخرى في جدول الطلاب
    stBody.addEventListener('click', e => {
        if (e.target.classList.contains('show-absences-link')) {
            e.preventDefault();
            const absences = JSON.parse(e.target.dataset.absences);
            alert('تواريخ الغيابات:\n' + absences.join('\n'));
        }

        if (e.target.classList.contains('add-note-btn')) {
            const studentId = parseInt(e.target.dataset.studentId, 10);
            const note = prompt(`أضف ملاحظة للطالب (ID: ${studentId}):`);
            if (note) {
                const student = window.studentsData.find(s => s.id === studentId);
                if (student) {
                    if (!student.notes) student.notes = [];
                    student.notes.push(note);
                    alert(`تمت إضافة الملاحظة:\n"${note}"\n\nملاحظة: لحفظ هذه الملاحظة بشكل دائم، يجب تحديث ملف students.json على الخادم.`);
                }
            }
        }
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
