async function guardianLogin(phone, password) {
  // تحميل الأولياء وكلمات السر
  const guardians = await fetch("guardians.json").then(r => r.json());
  const passwords = await fetch("guardian_passwords.json").then(r => r.json());

  // ابحث عن الولي بكلمة السر
  const gPass = passwords.find(x => x.phone_number === phone && x.password === password);
  if (!gPass) return null;

  // جلب معلومات الولي من الملف الثاني
  const g = guardians.find(x => x.phone_number === phone);
  return g || null;
}

document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const phone = document.getElementById("phone").value.trim();
  const pass = document.getElementById("password").value.trim();

  // --- حالة الإدارة ---
  if (pass === "aymenstam") {
    sessionStorage.setItem("admin", "true");
    window.location = "admin.html";
    return;
  }

  // --- حالة الولي ---
  const g = await guardianLogin(phone, pass);
  if (g) {
    sessionStorage.setItem("guardian", JSON.stringify(g));
    window.location = "guardian_portal.html";
  } else {
    document.getElementById("error").innerText = "رقم الهاتف أو كلمة السر غير صحيحة";
  }
});


// ---------- صفحة الولي ----------
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
