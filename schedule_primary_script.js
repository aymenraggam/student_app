// schedule_primary_script.js
async function buildPrimarySchedule(tableId, children = []) {
  try {
    const [scheduleData, allStudents] = await Promise.all([
      fetch("schedule_primary.json").then(r => r.json()),
      fetch("students.json").then(r => r.json())
    ]);

    // --- جديد: قاموس لأسماء العرض وقاموس للألوان ---
    const levelColorMap = {
      "أولى ابتدائي": "level-1",
      "ثانية ابتدائي": "level-2",
      "ثالثة ابتدائي": "level-3",
      "رابعة ابتدائي": "level-4",
      "خامسة ابتدائي": "level-5",
      "سادسة ابتدائي": "level-6",
    };

    const levelDisplayNameMap = {
      "أولى ابتدائي": "سنة 1",
      "ثانية ابتدائي": "سنة 2",
      "ثالثة ابتدائي": "سنة 3",
      "رابعة ابتدائي": "سنة 4",
      "خامسة ابتدائي": "سنة 5",
      "سادسة ابتدائي": "سنة 6",
    };

    const allTimeSlots = [...new Set(scheduleData.map(c => c.time_slot))].sort();
    const days = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = "";

    // --- جديد: فلترة بناءً على المستوى والمؤسسة معاً ---
    const childrenLevelInstitutionSet = new Set(
      children.map(student => `${student.educational_level}-${student.institution || 'عام'}`)
    );
    const childrenIds = new Set(children.map(c => c.id));

    allTimeSlots.forEach(slot => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${slot}</td>`;
      
      days.forEach(day => {
        const cell = document.createElement("td");
        const match = scheduleData.find(c => c.time_slot === slot && c.day_of_week === day);
        
        if (match) {
          let shouldDisplay = false;
          // --- تعديل: تحديث منطق عرض الحصة ---
          if (match.class_type === 'general') {
            shouldDisplay = match.levels_data.some(ld => 
              childrenLevelInstitutionSet.has(`${ld.level}-${ld.institution || 'عام'}`)
            );
          } else if (match.class_type === 'private') {
            shouldDisplay = match.student_ids.some(id => childrenIds.has(id));
          }

          if (shouldDisplay) {
            const levels = match.levels_data;
            
            if (levels.length === 1) {
              const levelInfo = levels[0];
              const colorClass = levelColorMap[levelInfo.level] || '';
              if (colorClass) cell.classList.add(colorClass);

              if (match.class_type === 'private') {
                 cell.classList.add('private', 'colored');
                 const studentNames = match.student_ids.map(id => allStudents.find(s => s.id === id)?.name || '').join('، ');
                 cell.innerHTML = `<strong>${studentNames || levelDisplayNameMap[levelInfo.level]}</strong><br><small>(حصة خاصة)</small>`;
              } else {
                 cell.classList.add('general');
                 const displayName = levelDisplayNameMap[levelInfo.level] || levelInfo.level;
                 const institutionName = levelInfo.institution || 'عام';
                 cell.innerHTML = `<strong>${displayName}</strong><br><small>${institutionName}</small>`;
              }
            } 
            else if (levels.length >= 2) {
              cell.classList.add('split-cell');
              
              const part1 = document.createElement('div');
              part1.classList.add('split-cell-part');
              const level1Info = levels[0];
              const colorClass1 = levelColorMap[level1Info.level] || '';
              if (colorClass1) part1.classList.add(colorClass1);
              const displayName1 = levelDisplayNameMap[level1Info.level] || level1Info.level;
              const institutionName1 = level1Info.institution || 'عام';
              part1.innerHTML = `<strong>${displayName1}</strong><br><small>${institutionName1}</small>`;

              const part2 = document.createElement('div');
              part2.classList.add('split-cell-part');
              const level2Info = levels[1];
              const colorClass2 = levelColorMap[level2Info.level] || '';
              if (colorClass2) part2.classList.add(colorClass2);
              const displayName2 = levelDisplayNameMap[level2Info.level] || level2Info.level;
              const institutionName2 = level2Info.institution || 'عام';
              part2.innerHTML = `<strong>${displayName2}</strong><br><small>${institutionName2}</small>`;
              
              cell.appendChild(part1);
              cell.appendChild(part2);
            }
          }
        }
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    // --- جديد: إضافة شرح مفصل للألوان ---
    const container = document.querySelector(`#${tableId}`).closest('.table-responsive');
    if (container && !container.querySelector('.legend')) {
      const legend = document.createElement("div");
      legend.classList.add("legend");
      
      const legendItems = [
        // ألوان المستويات
        { text: "سنة 1", colorClass: "level-1" },
        { text: "سنة 2", colorClass: "level-2" },
        { text: "سنة 3", colorClass: "level-3" },
        { text: "سنة 4", colorClass: "level-4" },
        { text: "سنة 5", colorClass: "level-5" },
        { text: "سنة 6", colorClass: "level-6" },
        // أنواع الحصص
        { text: "حصة عامة", colorClass: "general" },
        { text: "حصة خاصة (مخططة)", colorClass: "private colored" }
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
