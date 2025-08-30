// schedule_script.js
async function buildSchedule(tableId) {
  const perm = await fetch("schedule_permanent.json").then(r=>r.json());
  const temp = await fetch("schedule_temporary.json").then(r=>r.json());

  // قائمة الحصص الدائمة التي تم تعويضها ويجب إخفاؤها
  const replacedClassIds = new Set(
    temp.filter(t => t.replaced_class_id !== null)
        .map(t => t.replaced_class_id)
  );

  // قائمة التواقيت (من الحصص الدائمة والمؤقتة)
  const allTimeSlots = [...new Set([
    ...perm.map(c => c.time_slot),
    ...temp.map(c => c.time_slot)
  ])].sort();

  const days = ["الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];

  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";

  allTimeSlots.forEach(slot=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${slot}</td>`;
    
    days.forEach(day=>{
      const cell = document.createElement("td");
      
      // البحث عن حصة مؤقتة في هذا اليوم والتوقيت
      const tempMatch = temp.find(c => c.time_slot === slot && new Date(c.class_date).toLocaleDateString('ar-TN', {weekday: 'long'}) === day);

      // إذا وجدت حصة مؤقتة، اعرضها
      if (tempMatch) {
        cell.textContent = tempMatch.educational_level;
        cell.classList.add('temporary');
        if (tempMatch.class_type === 'replacement_general' || tempMatch.class_type === 'replacement_private') {
          cell.classList.add('replacement');
        } else if (tempMatch.class_type === 'extra_general' || tempMatch.class_type === 'extra_private') {
          cell.classList.add('extra');
        }
      } else {
        // إذا لم توجد حصة مؤقتة، ابحث عن حصة دائمة
        const permMatch = perm.find(c => c.time_slot === slot && c.day_of_week === day);
        
        // اعرض الحصة الدائمة فقط إذا لم يتم تعويضها
        if (permMatch && !replacedClassIds.has(permMatch.id)) {
          cell.textContent = permMatch.educational_level;
          cell.classList.add(permMatch.class_type);
        }
      }

      tr.appendChild(cell);
    });
    tbody.appendChild(tr);
  });
    // بناء مفتاح الألوان تحت الجدول
  const legend = document.createElement("div");
  legend.classList.add("legend");
  const legendItems = [
    { text: "حصة عامة", colorClass: "general" },
    { text: "حصة خاصة", colorClass: "private" },
    { text: "حصة مؤقتة", colorClass: "temporary" },
    { text: "حصة تعويضية", colorClass: "replacement" },
    { text: "حصة إضافية", colorClass: "extra" }
  ];
  legendItems.forEach(item => {
    const legendItem = document.createElement("div");
    legendItem.classList.add("legend-item");
    legendItem.innerHTML = `<span class="legend-color ${item.colorClass}"></span>${item.text}`;
    legend.appendChild(legendItem);
  });
  // إضافة المفتاح بعد الجدول مباشرة
  document.querySelector(`#${tableId}`).after(legend);
}
