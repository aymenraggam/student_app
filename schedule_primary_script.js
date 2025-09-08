// schedule_primary_script.js
async function buildPrimarySchedule(tableId) {
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

    allTimeSlots.forEach(slot => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${slot}</td>`;
      
      days.forEach(day => {
        const cell = document.createElement("td");
        const match = scheduleData.find(c => c.time_slot === slot && c.day_of_week === day);
        
        if (match) {
          // بما أن كل الحصص في هذا الملف عامة، يمكننا تبسيط المنطق
          cell.textContent = match.educational_level;
          cell.classList.add(match.class_type); // ستكون 'general' أو 'private'
        }
        
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error building primary schedule:", error);
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8">حدث خطأ في تحميل الجدول. يرجى المحاولة لاحقاً.</td></tr>`;
    }
  }
}
