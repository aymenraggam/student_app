// schedule_script.js

async function buildSchedule(tableId) {
  const perm = await fetch("schedule_permanent.json").then(r=>r.json());
  const temp = await fetch("schedule_temporary.json").then(r=>r.json());

  // قائمة التواقيت
  const timeSlots = [...new Set(perm.map(c=>c.time_slot))].sort();

  const days = ["الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];

  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";

  timeSlots.forEach(slot=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${slot}</td>`;
    days.forEach(day=>{
      const cell = document.createElement("td");

      // حصص دائمة
      const match = perm.find(c=>c.time_slot===slot && c.day_of_week===day);
      if (match) cell.textContent = match.educational_level;

      // حصص إضافية / تعويضية
      const extra = temp.filter(c=>c.time_slot===slot && c.day_of_week===day);
      if (extra.length) {
        cell.style.background="#fffae0";
        cell.textContent += " " + extra.map(e=>e.educational_level).join(",");
      }

      tr.appendChild(cell);
    });
    tbody.appendChild(tr);
  });
}
