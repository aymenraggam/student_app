if (location.pathname.endsWith("admin.html")) {
  Promise.all([
    fetch("guardians.json").then(r => r.json()),
    fetch("students.json").then(r => r.json()),
    fetch("levels.json").then(r => r.json())
  ]).then(([guardians, students, levels]) => {
    const levelMap = {};
    levels.forEach(l => levelMap[String(l.id)] = l.name);

    // حساب اجمالي الدفعات (الفائتة + الغير خالصة)
    let totalDue = 0;
    const today = new Date();

    students.forEach(s => {
      (s.unpaid_payments || []).forEach(p => {
        // كل الدفعات غير المدفوعة نعتبرها
        totalDue += Number(p.amount) || 0;
      });
    });

    document.getElementById("totalUnpaid").innerText = totalDue;

    // الطلبة
    const stBody = document.querySelector("#students tbody");
    students.forEach(s => {
      const levelName = levelMap[String(s.educational_level)] || s.educational_level;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.name} ${s.surname}</td>
                      <td>${levelName}</td>
                      <td>${s.phone_number}</td>
                      <td>${s.unpaid_total ?? 0}</td>`;
      stBody.appendChild(tr);
    });

    // الأولياء
    const gBody = document.querySelector("#guardians tbody");
    guardians.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${g.guardian_full_name}</td>
                      <td>${g.phone_number}</td>
                      <td>${g.student_ids.length}</td>
                      <td>${g.unpaid_total}</td>`;
      gBody.appendChild(tr);
    });

    // البحث
    document.getElementById("search").addEventListener("input", e => {
      const term = e.target.value.trim();
      document.querySelectorAll("table.datatable tbody tr").forEach(tr => {
        tr.style.display = tr.innerText.includes(term) ? "" : "none";
      });
    });
  });
}
