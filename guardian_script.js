if (location.pathname.endsWith("guardian_portal.html")) {
  const g = JSON.parse(sessionStorage.getItem("guardian") || "null");
  if (!g) location.href = "login.html";

  document.getElementById("guardianName").innerText = g.guardian_full_name;
  document.getElementById("totalUnpaid").innerText = g.unpaid_total;

  fetch("students.json").then(r => r.json()).then(students => {
    const children = students.filter(s => g.student_ids.includes(s.id));

    // جدول الأبناء
    const tbody = document.querySelector("#children tbody");
    children.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.name} ${c.surname}</td>
                      <td>${c.educational_level}</td>
                      <td>${c.unpaid_total}</td>`;
      tbody.appendChild(tr);
    });

    // جدول الدفعات
    const payBody = document.querySelector("#payments tbody");
    children.forEach(c => {
      if (c.unpaid_payments) {
        c.unpaid_payments.forEach(p => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${p.period}</td>
                          <td>${p.amount}</td>
                          <td>${c.name} ${c.surname}</td>`;
          payBody.appendChild(tr);
        });
      }
    });
  });
}
