// schedule_primary_script.js
async function buildPrimarySchedule(tableId, children = []) {
  try {
    const [scheduleData, allStudents] = await Promise.all([
      fetch("schedule_primary.json").then(r => r.json()),
      fetch("students.json").then(r => r.json())
    ]);
    
    const levelColorMap = {
      "أولى ابتدائي": "level-1",
      "ثانية ابتدائي": "level-2",
      "ثالثة ابتدائي": "level-3",
      "رابعة ابتدائي": "level-4",
      "خامسة ابتدائي": "level-5",
      "سادسة ابتدائي": "level-6",
    };

    const allTimeSlots = [...new Set(scheduleData.map(c => c.time_slot))].sort();
    const days = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = "";

    const relevantLevels = children.length > 0 ? new Set(children.map(student => student.educational_level)) : null;
    const childrenIds = new Set(children.map(c => c.id));

    allTimeSlots.forEach(slot => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${slot}</td>`;
      
      days.forEach(day => {
        const cell = document.createElement("td");
        const match = scheduleData.find(c => c.time_slot === slot && c.day_of_week === day);
        
        if (match) {
          let shouldDisplay = !relevantLevels;
          if (relevantLevels) {
            // <<< تعديل: التحقق من حقل levels_data الجديد >>>
            if (match.class_type === 'general' && match.levels_data.some(ld => relevantLevels.has(ld.level))) {
              shouldDisplay = true;
            } else if (match.class_type === 'private' && match.student_ids.some(id => childrenIds.has(id))) {
              shouldDisplay = true;
            }
          }

          if (shouldDisplay) {
            const levels = match.levels_data; // <<< تعديل: استخدام الحقل الجديد
            
            if (levels.length === 1) {
              const levelInfo = levels[0];
              const colorClass = levelColorMap[levelInfo.level] || '';
              if (colorClass) cell.classList.add(colorClass);

              if (match.class_type === 'private') {
                 cell.classList.add('private', 'colored');
                 const studentNames = match.student_ids.map(id => allStudents.find(s => s.id === id)?.name || '').join('، ');
                 cell.textContent = studentNames || levelInfo.level;
              } else {
                 cell.classList.add('general');
                 // <<< تعديل: عرض المستوى مع المؤسسة إذا كانت موجودة >>>
                 cell.textContent = `${levelInfo.level.replace(' ابتدائي','')} (${levelInfo.institution || 'عام'})`;
              }
            } 
            else if (levels.length >= 2) {
              cell.classList.add('split-cell');
              
              const part1 = document.createElement('div');
              part1.classList.add('split-cell-part');
              const level1Info = levels[0];
              const colorClass1 = levelColorMap[level1Info.level] || '';
              if (colorClass1) part1.classList.add(colorClass1);
              // <<< تعديل: عرض المستوى مع المؤسسة >>>
              part1.textContent = `${level1Info.level.replace(' ابتدائي','')} (${level1Info.institution || 'عام'})`;

              const part2 = document.createElement('div');
              part2.classList.add('split-cell-part');
              const level2Info = levels[1];
              const colorClass2 = levelColorMap[level2Info.level] || '';
              if (colorClass2) part2.classList.add(colorClass2);
              // <<< تعديل: عرض المستوى مع المؤسسة >>>
              part2.textContent = `${level2Info.level.replace(' ابتدائي','')} (${level2Info.institution || 'عام'})`;
              
              cell.appendChild(part1);
              cell.appendChild(part2);
            }
          }
        }
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    // ... (كود إنشاء الـ Legend يبقى كما هو)

  } catch (error) {
    console.error("Error building primary schedule:", error);
    // ... (كود معالجة الخطأ يبقى كما هو)
  }
}
