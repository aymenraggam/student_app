if (location.pathname.endsWith("guardian_portal.html")) {
  const g = JSON.parse(sessionStorage.getItem("guardian") || "null");
  if (!g) location.href = "login.html";

  document.getElementById("guardianName").innerText = g.guardian_full_name || "";
  document.getElementById("totalUnpaid").innerText = g.unpaid_total ?? 0;

  Promise.all([
    fetch("students.json").then(r => r.json()),
    fetch("levels.json").then(r => r.json())
  ]).then(([students, levels]) => {
    const levelMap = {};
    levels.forEach(l => levelMap[String(l.id)] = l.name);

    const children = students.filter(s => (g.student_ids || []).includes(s.id));

    // جدول الأبناء
    const tbody = document.querySelector("#children tbody");
    children.forEach(c => {
      const levelName = levelMap[String(c.educational_level)] || c.educational_level;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.name} ${c.surname}</td>
                      <td>${levelName}</td>
                      <td>${c.unpaid_total ?? 0}</td>`;
      tbody.appendChild(tr);
    });

    // جدول الدفعات غير الخالصة
    const payBody = document.querySelector("#payments tbody");
    children.forEach(c => {
      (c.unpaid_payments || []).forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.period}</td>
                        <td>${p.amount}</td>
                        <td>${c.name} ${c.surname}</td>`;
        payBody.appendChild(tr);
      });
    });
  });
}
