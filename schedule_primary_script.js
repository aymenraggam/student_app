// schedule_primary_script.js
async function buildPrimarySchedule(tableId, children = []) {
  try {
    // جلب بيانات الجدول والتلاميذ في نفس الوقت لتحسين الأداء
    const [scheduleData, allStudents] = await Promise.all([
      fetch("schedule_primary.json").then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      }),
      fetch("students.json").then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
    ]);
    
    // --- جديد: خريطة لربط المستويات بالفئات اللونية في CSS ---
    const levelColorMap = {
      "1 ابتدائي": "level-1", "أولى ابتدائي": "level-1",
      "2 ابتدائي": "level-2", "ثانية ابتدائي": "level-2",
      "3 ابتدائي": "level-3", "ثالثة ابتدائي": "level-3",
      "4 ابتدائي": "level-4", "رابعة ابتدائي": "level-4",
      "5 ابتدائي": "level-5", "خامسة ابتدائي": "level-5",
      "6 ابتدائي": "level-6", "سادسة ابتدائي": "level-6",
    };

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
          let shouldDisplay = !relevantLevels;
          if (relevantLevels) {
            if (match.class_type === 'general' && match.educational_levels.some(level => relevantLevels.includes(level))) {
              shouldDisplay = true;
            } else if (match.class_type === 'private' && match.student_ids.some(id => childrenIds.includes(id))) {
              shouldDisplay = true;
            }
          }

          if (shouldDisplay) {
            // --- بداية المنطق الجديد لتلوين الخلايا ---
            
            const levels = match.educational_levels;
            
            // الحالة 1: الحصة لمستوى واحد فقط
            if (levels.length === 1) {
              const levelName = levels[0];
              const colorClass = levelColorMap[levelName] || '';
              if (colorClass) cell.classList.add(colorClass);

              if (match.class_type === 'private') {
                 cell.classList.add('private', 'colored');
                 const studentNames = match.student_ids.map(id => allStudents.find(s => s.id === id)?.name || '').join('، ');
                 cell.textContent = studentNames || levelName; // عرض الأسماء أو المستوى
              } else {
                 cell.classList.add('general');
                 cell.textContent = levelName;
              }
            } 
            // الحالة 2: الحصة لمستويين
            else if (levels.length >= 2) {
              cell.classList.add('split-cell');
              
              // الجزء الأول من الخلية (للمستوى الأول)
              const part1 = document.createElement('div');
              part1.classList.add('split-cell-part');
              const level1Name = levels[0];
              const colorClass1 = levelColorMap[level1Name] || '';
              if (colorClass1) part1.classList.add(colorClass1);
              part1.textContent = level1Name.replace(' ابتدائي','');

              // الجزء الثاني من الخلية (للمستوى الثاني)
              const part2 = document.createElement('div');
              part2.classList.add('split-cell-part');
              const level2Name = levels[1];
              const colorClass2 = levelColorMap[level2Name] || '';
              if (colorClass2) part2.classList.add(colorClass2);
              part2.textContent = level2Name.replace(' ابتدائي','');
              
              cell.appendChild(part1);
              cell.appendChild(part2);
            }
            // --- نهاية المنطق الجديد لتلوين الخلايا ---
          }
        }
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    const container = document.querySelector(`#${tableId}`).closest('.table-responsive');
    if (container && !container.querySelector('.legend')) {
      const legend = document.createElement("div");
      legend.classList.add("legend");
      const legendItems = [
        { text: "حصة عامة", colorClass: "general" },
        { text: "حصة خاصة (مخططة)", colorClass: "private colored level-1" }
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
