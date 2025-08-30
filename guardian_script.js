async function guardianLogin(phone, password) {
  const guardians = await fetch("guardians.json").then(r => r.json());

  // ابحث عن ولي بالهاتف وكلمة السر
  const g = guardians.find(x => x.phone_number === phone && x.password === password);
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
