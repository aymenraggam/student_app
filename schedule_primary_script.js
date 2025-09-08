// schedule_primary_script.js
async function buildPrimarySchedule(tableId, children = []) {
  try {
    const response = await fetch("schedule_primary.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const scheduleData = await response.json();
    
    const allTimeSlots = [...new Set(scheduleData.map(c => c.time_slot))].sort();
    const days = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) {
      console.error(`Table body not found for selector: #${tableId} tbody`);
      return;
    }
    tbody.innerHTML = "";

    const relevantLevels = children.length > 0 ? [...new Set(children.map(student => student.educational_level))] : null;
    const childrenIds = children.map(c => c.id);

    allTimeSlots.forEach(slot => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${slot}</td>`;
      
      days.forEach(day => {
        const cell = document.createElement("td");
        const match = scheduleData.find(c => c.time_slot === slot && c.day_of_week === day);
        
        if (match) {
          let shouldDisplay = !relevantLevels; // إذا لم يكن هناك فلترة، اعرض كل شيء

          if (relevantLevels) {
            if (match.class_type === 'general' && relevantLevels.includes(match.educational_level)) {
              shouldDisplay = true;
            } else if (match.class_type === 'private' && match.student_ids.some(id => childrenIds.includes(id))) {
              shouldDisplay = true;
            }
          }

          if (shouldDisplay) {
            cell.textContent = match.educational_level;
            cell.classList.add(match.class_type);
          }
        }
        
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    // إضافة الشرح أسفل الجدول
    const container = document.querySelector(`#${tableId}`).closest('.table-responsive');
    if (container && !container.querySelector('.legend')) {
      const legend = document.createElement("div");
      legend.classList.add("legend");
      const legendItems = [
        { text: "حصة عامة", colorClass: "general" },
        { text: "حصة خاصة", colorClass: "private" }
      ];
      legendItems.forEach(item => {
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        legendItem.innerHTML = `<span class="legend-color ${item.colorClass}"></span>${item.text}`;
        legend.appendChild(legendItem);
      });
      container.appendChild(legend);
    }

  } catch (error) {
    console.error("Error building primary schedule:", error);
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8">حدث خطأ في تحميل الجدول. يرجى المحاولة لاحقاً.</td></tr>`;
    }
  }
}
