// schedule_script.js
async function buildSchedule(tableId, relevantLevels = null) {
  const [perm, temp, students] = await Promise.all([
    fetch("schedule_permanent.json").then(r=>r.json()),
    fetch("schedule_temporary.json").then(r=>r.json()),
    fetch("students.json").then(r=>r.json()) // Fetch students data
  ]);

  const replacedClassIds = new Set(
    temp.filter(t => t.replaced_class_id !== null)
        .map(t => t.replaced_class_id)
  );

  const allTimeSlots = [...new Set([
    ...perm.map(c => c.time_slot),
    ...temp.map(c => c.time_slot)
  ])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const days = ["الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];

  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";

  allTimeSlots.forEach(slot=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${slot}</td>`;
    
    days.forEach(day=>{
      const cell = document.createElement("td");
      
      const tempMatch = temp.find(c => c.time_slot === slot && new Date(c.class_date).toLocaleDateString('ar-TN', {weekday: 'long'}) === day);

      if (tempMatch) {
          // <<< بداية التعديل للجدول المؤقت (تحسين) >>>
          const isRelevant = !relevantLevels || relevantLevels.length === 0 || relevantLevels.includes(tempMatch.educational_level) || (tempMatch.student_ids && tempMatch.student_ids.some(id => relevantLevels.includes(id)));
          if (isRelevant) {
              cell.textContent = tempMatch.educational_level;
              cell.classList.add('temporary');
              if (tempMatch.class_type.startsWith('replacement')) {
                cell.classList.add('replacement');
              } else if (tempMatch.class_type.startsWith('extra')) {
                cell.classList.add('extra');
              }
          }
          // <<< نهاية التعديل >>>

      } else {
        const permMatch = perm.find(c => c.time_slot === slot && c.day_of_week === day);
        
        if (permMatch && !replacedClassIds.has(permMatch.id)) {
            // <<< بداية التعديل للجدول الدائم (أساسي) >>>
            const classLevels = permMatch.levels || [];
            const isRelevant = !relevantLevels || relevantLevels.length === 0 || classLevels.some(level => relevantLevels.includes(level));

            if (isRelevant) {
                if (permMatch.class_type === 'private' && permMatch.student_ids.length > 0) {
                    const studentNames = permMatch.student_ids.map(id => {
                        const student = students.find(s => s.id === id);
                        return student ? student.name : '';
                    }).filter(name => name).join(', ');
                    
                    // عرض أسماء التلاميذ مع قائمة المستويات
                    cell.innerHTML = `${studentNames}<br><small>(${classLevels.join(', ')})</small>`;
                } else {
                    // عرض قائمة المستويات للحصص العامة
                    cell.textContent = classLevels.join(' - ');
                }
                cell.classList.add(permMatch.class_type);
            }
            // <<< نهاية التعديل >>>
        }
      }

      tr.appendChild(cell);
    });
    tbody.appendChild(tr);
  });

  // Check if legend exists before adding it
  if (!document.querySelector('.legend')) {
      const legend = document.createElement("div");
      legend.classList.add("legend");
      const legendItems = [
        { text: "حصة عامة", colorClass: "general" },
        { text: "حصة خاصة", colorClass: "private" },
        { text: "حصة إنجليزية", colorClass: "english" },
        { text: "حصة مؤقتة", colorClass: "temporary" }
      ];
      legendItems.forEach(item => {
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        legendItem.innerHTML = `<span class="legend-color ${item.colorClass}"></span>${item.text}`;
        legend.appendChild(legendItem);
      });
      
      document.querySelector(`#${tableId}`).after(legend);
  }
}
