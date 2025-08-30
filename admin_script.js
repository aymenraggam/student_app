if (location.pathname.endsWith("admin.html")) {
  fetch("guardians.json").then(r => r.json()).then(guardians => {
    fetch("students.json").then(r => r.json()).then(students => {
      document.getElementById("totalUnpaid").innerText =
        guardians.reduce((a, g) => a + g.unpaid_total, 0);

      // الطلبة
      const stBody = document.querySelector("#students tbody");
      students.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s.name} ${s.surname}</td>
                        <td>${s.educational_level}</td>
                        <td>${s.phone_number}</td>
                        <td>${s.unpaid_total}</td>`;
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
  });
}
