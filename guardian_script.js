// guardian_script.js

function normalizePhone(p) {
  return (p || "").replace(/[^\d]/g, ""); // فقط أرقام
}

async function guardianLogin(phone, password) {
  phone = normalizePhone(phone);

  // حمّل الملفات
  const guardians = await fetch("guardians.json").then(r => r.json());
  const passwords = await fetch("guardian_passwords.json").then(r => r.json());

  // تحقق من كلمة السر
  if (!(phone in passwords)) return null;
  if (String(passwords[phone]) !== String(password)) return null;

  // جلب بيانات الولي
  const g = guardians.find(x => normalizePhone(x.phone_number) === phone);
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
