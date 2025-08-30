function normalizePhone(p) {
  return (p || "").replace(/[^\d]/g, "");
}

async function guardianLogin(phone, password) {
  phone = normalizePhone(phone);

  const guardians = await fetch("guardians.json").then(r => r.json());

  // تحقق من الهاتف وكلمة السر مباشرة
  return guardians.find(
    g => normalizePhone(g.phone_number) === phone && String(g.password) === String(password)
  ) || null;
}

document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const phone = document.getElementById("phone").value.trim();
  const pass = document.getElementById("password").value.trim();

  // حالة الإدارة
  if (pass === "aymenstam") {
    sessionStorage.setItem("admin", "true");
    window.location = "admin.html";
    return;
  }

  // حالة الولي
  const g = await guardianLogin(phone, pass);
  if (g) {
    sessionStorage.setItem("guardian", JSON.stringify(g));
    window.location = "guardian_portal.html";
  } else {
    document.getElementById("error").innerText = "❌ رقم الهاتف أو كلمة السر غير صحيحة";
  }
});
