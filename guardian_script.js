function normalizePhone(p) {
  return (p || "").replace(/[^\d]/g, "");
}

async function guardianLogin(phone, password) {
  phone = normalizePhone(phone);
  password = String(password);

  // جلب بيانات الأولياء وكلمات السر في نفس الوقت
  const [guardians, passwords] = await Promise.all([
    fetch("guardians.json").then(r => r.json()),
    fetch("guardian_passwords.json").then(r => r.json())
  ]);

  // التحقق من وجود الولي
  const g = guardians.find(gd => normalizePhone(gd.phone_number) === phone);
  if (!g) {
    return null; // إذا لم يتم العثور على الولي، لا داعي للتحقق من كلمة السر
  }

  // التحقق من تطابق كلمة السر من الملف الخارجي
  if (passwords[phone] === password) {
    return g; // تم تسجيل الدخول بنجاح
  }
  
  return null; // كلمة السر غير صحيحة
}

document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const phone = document.getElementById("phone").value.trim();
  const pass = document.getElementById("password").value.trim();
  const errorElement = document.getElementById("error");

  // حالة تسجيل دخول الإدارة
  if (pass === "aymenstam") {
    sessionStorage.setItem("admin", "true");
    window.location = "admin.html";
    return;
  }

  // حالة تسجيل دخول الولي
  try {
    const guardian = await guardianLogin(phone, pass);
    if (guardian) {
      sessionStorage.setItem("guardian", JSON.stringify(guardian));
      window.location = "guardian_portal.html";
    } else {
      errorElement.innerText = "❌ رقم الهاتف أو كلمة السر غير صحيحة";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorElement.innerText = "حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.";
  }
});
