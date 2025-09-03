if (location.pathname.endsWith("admin.html")) {
  Promise.all([
    fetch("guardians.json").then(r => r.json()),
    fetch("students.json").then(r => r.json()),
    fetch("levels.json").then(r => r.json()),
    fetch("statistics.json").then(r => r.json())
  ]).then(([guardians, students, levels, statistics]) => {
    const levelMap = {};
    levels.forEach(l => levelMap[String(l.id)] = l.name);
    
    window.studentsData = students;

    // --- الجزء الأول: الربط بين الطلاب والأولياء ---
    const studentToGuardianMap = {};
    guardians.forEach(g => {
        g.student_ids.forEach(studentId => {
            studentToGuardianMap[String(studentId)] = g;
        });
    });

    // --- الجزء الثاني: دالة تسجيل الدخول المحورية ---
    const loginAsGuardian = (guardian) => {
        if (guardian) {
            sessionStorage.setItem("guardian", JSON.stringify(guardian));
            window.open("guardian_portal.html", "_blank");
        } else {
            alert("لم يتم العثور على الولي المرتبط.");
        }
    };

    document.getElementById('totalUnpaid').textContent = `${statistics.total_overdue_unpaid_amount} د.ت`;

    // --- الجزء الثالث: تعديل جدول الطلاب ليعتمد على رقم الهاتف ---
    const stBody = document.querySelector("#students tbody");
    stBody.innerHTML = '';
    students.forEach(s => {
      const levelName = levelMap[String(s.educational_level)] || s.educational_level;
      const tr = document.createElement("tr");
      const guardian = studentToGuardianMap[String(s.id)];
      
      // هنا التغيير الأساسي: نستخدم رقم الهاتف "data-guardian-phone"
      const studentNameCell = guardian 
        ? `<a href="#" class="login-as-guardian-link" data-guardian-phone="${guardian.phone_number}">${s.name} ${s.surname}</a>`
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

    // --- الجزء الرابع: تعديل جدول الأولياء ليعتمد على رقم الهاتف ---
    const gBody = document.querySelector("#guardians tbody");
    gBody.innerHTML = '';
    guardians.forEach(g => {
      const tr = document.createElement("tr");
      // هنا أيضاً نستخدم رقم الهاتف "data-guardian-phone"
      const guardianNameCell = `<a href="#" class="login-as-guardian-link" data-guardian-phone="${g.phone_number}">${g.guardian_full_name}</a>`;
      tr.innerHTML = `<td>${guardianNameCell}</td>
                      <td>${g.phone_number}</td>
                      <td>${g.student_ids.length}</td>
                      <td>${g.unpaid_total} د.ت</td>`;
      gBody.appendChild(tr);
    });
    
    // --- الجزء الخامس: تعديل منطق البحث ليعتمد على رقم الهاتف ---
    const handleLoginClick = (event) => {
        const link = event.target.closest('.login-as-guardian-link');
        if (link) {
            event.preventDefault();
            const guardianPhone = link.dataset.guardianPhone;
            // نبحث عن الولي باستخدام رقم الهاتف بدلاً من ID
            const guardian = guardians.find(g => g.phone_number === guardianPhone);
            loginAsGuardian(guardian);
        }
    };

    stBody.addEventListener('click', handleLoginClick);
    gBody.addEventListener('click', handleLoginClick);

    // بقية الوظائف (ملاحظات، غيابات) تبقى كما هي
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
