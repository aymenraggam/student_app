// schedule_primary_script.js
async function buildPrimarySchedule(tableId, children = []) {
  try {
    // جلب البيانات اللازمة من ملفات JSON
    const [scheduleData, allStudents] = await Promise.all([
      fetch("schedule_primary.json").then(r => r.json()),
      fetch("students.json").then(r => r.json())
    ]);

    // قواميس مساعدة للألوان وأسماء العرض المختصرة
    const levelColorMap = {
      "أولى ابتدائي": "level-1", "ثانية ابتدائي": "level-2", "ثالثة ابتدائي": "level-3",
      "رابعة ابتدائي": "level-4", "خامسة ابتدائي": "level-5", "سادسة ابتدائي": "level-6",
    };
    const levelDisplayNameMap = {
      "أولى ابتدائي": "سنة 1", "ثانية ابتدائي": "سنة 2", "ثالثة ابتدائي": "سنة 3",
      "رابعة ابتدائي": "سنة 4", "خامسة ابتدائي": "سنة 5", "سادسة ابتدائي": "سنة 6",
    };

    const allTimeSlots = [...new Set(scheduleData.map(c => c.time_slot))].sort();
    const days = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
    
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = "";

    // --- بداية التعديل الرئيسي ---
    const isGuardianPortal = children.length > 0;
    const childrenLevelInstitutionSet = new Set(children.map(student => `${student.educational_level}-${student.institution || 'عام'}`));
    const childrenIds = new Set(children.map(c => c.id));

    allTimeSlots.forEach(slot => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${slot}</td>`;
      
      days.forEach(day => {
        const cell = document.createElement("td");
        const match = scheduleData.find(c => c.time_slot === slot && c.day_of_week === day);
        
        if (match) {
          let shouldDisplay = false;
          
          // تحديد ما إذا كان يجب عرض الحصة
          if (!isGuardianPortal) {
            // إذا كنا في الصفحة الرئيسية، اعرض كل الحصص
            shouldDisplay = true;
          } else {
            // إذا كنا في صفحة الولي، قم بالفلترة
            if (match.class_type === 'general') {
              shouldDisplay = match.levels_data.some(ld => 
                childrenLevelInstitutionSet.has(`${ld.level}-${ld.institution || 'عام'}`)
              );
            } else if (match.class_type === 'private') {
              shouldDisplay = match.student_ids.some(id => childrenIds.has(id));
            }
          }

          if (shouldDisplay) {
            // منطق عرض الخلية بناءً على نوع الحصة
            if (match.class_type === 'private') {
              // عرض الحصص الخاصة بنفس طريقة التطبيق
              cell.classList.add('private', 'colored');
              const studentNames = match.student_ids
                .map(id => {
                    const student = allStudents.find(s => s.id === id);
                    return student ? student.name : ''; // عرض الاسم الأول فقط
                })
                .filter(name => name)
                .join('، ');
              cell.innerHTML = `<strong>${studentNames || '(فارغة)'}</strong>`;

            } else { // الحصص العامة
              const levels = match.levels_data;
              if (levels.length === 1) {
                // حصة عامة بمستوى واحد
                const levelInfo = levels[0];
                const colorClass = levelColorMap[levelInfo.level] || '';
                if (colorClass) cell.classList.add(colorClass);
                cell.classList.add('general');
                const displayName = levelDisplayNameMap[levelInfo.level] || levelInfo.level;
                const institutionName = levelInfo.institution || 'عام';
                cell.innerHTML = `<strong>${displayName}</strong><br><small>${institutionName}</small>`;

              } else if (levels.length >= 2) {
                // حصة عامة بمستويات متعددة (مقسمة)
                cell.classList.add('split-cell');
                levels.forEach(levelInfo => {
                    const part = document.createElement('div');
                    part.classList.add('split-cell-part');
                    const colorClass = levelColorMap[levelInfo.level] || '';
                    if (colorClass) part.classList.add(colorClass);
                    const displayName = levelDisplayNameMap[levelInfo.level] || levelInfo.level;
                    const institutionName = levelInfo.institution || 'عام';
                    part.innerHTML = `<strong>${displayName}</strong><br><small>${institutionName}</small>`;
                    cell.appendChild(part);
                });
              }
            }
          }
        }
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });
    // --- نهاية التعديل الرئيسي ---

    const container = document.querySelector(`#${tableId}`).closest('.table-responsive');
    if (container && !container.querySelector('.legend')) {
      const legend = document.createElement("div");
      legend.classList.add("legend");
      
      const legendItems = [
        { text: "سنة 1", colorClass: "level-1" }, { text: "سنة 2", colorClass: "level-2" },
        { text: "سنة 3", colorClass: "level-3" }, { text: "سنة 4", colorClass: "level-4" },
        { text: "سنة 5", colorClass: "level-5" }, { text: "سنة 6", colorClass: "level-6" },
        { text: "حصة خاصة", colorClass: "private colored" }
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
