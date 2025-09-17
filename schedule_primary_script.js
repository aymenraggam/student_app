// <<<< بداية الكود الجديد لدالة buildPrimarySchedule >>>>
async function buildPrimarySchedule(tableId, children = []) {
    try {
        // ١. جلب البيانات اللازمة
        const [scheduleData, students] = await Promise.all([
            fetch("schedule_primary.json").then(res => res.json()),
            fetch("students.json").then(res => res.json())
        ]);

        // ٢. تعريف الثوابت وأنماط التلوين
        const PRIMARY_SCHEDULE_TIMES = ["08:00", "09:00", "10:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
        const SCHEDULE_DAYS = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
        
        const primaryLevelStyles = {
            "1 ابتدائي": { color: "#fab784" },
            "2 ابتدائي": { color: "#08d4d1" },
            "3 ابتدائي": { color: "#e9f57f" },
            "4 ابتدائي": { color: "#91E3AD" },
            "5 ابتدائي": { color: "#8cf5ec" },
            "6 ابتدائي": { color: "#FFD9E0" },
            "default": { color: "#E0E0E0" }
        };

        // ٣. دالة مساعدة لتنسيق العرض مثل التطبيق
        function formatLevelDisplay(levelName, institution) {
            let levelAbbr = levelName.replace(' ابتدائي', '');
            if (levelName.includes('أولى')) levelAbbr = '1';
            if (levelName.includes('ثانية')) levelAbbr = '2';
            if (levelName.includes('ثالثة')) levelAbbr = '3';
            if (levelName.includes('رابعة')) levelAbbr = '4';
            if (levelName.includes('خامسة')) levelAbbr = '5';
            if (levelName.includes('سادسة')) levelAbbr = '6';

            const institutionAbbr = institution ? institution.replace('مدرسة ', '') : 'الكل';
            return `${levelAbbr} (${institutionAbbr})`;
        }
        
        // ٤. تحضير البيانات لسهولة الوصول إليها
        const scheduleMap = new Map();
        scheduleData.forEach(entry => {
            scheduleMap.set(`${entry.day_of_week}|${entry.time_slot}`, entry);
        });

        const studentsMap = new Map(students.map(s => [s.id, s]));

        // ٥. بناء الجدول
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;
        tbody.innerHTML = "";

        PRIMARY_SCHEDULE_TIMES.forEach(time => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${time}</td>`; // خلية التوقيت

            SCHEDULE_DAYS.forEach(day => {
                const td = document.createElement("td");
                const entry = scheduleMap.get(`${day}|${time}`);

                if (entry) {
                    if (entry.class_type === 'private') {
                        const studentNames = entry.student_ids
                            .map(id => studentsMap.get(id)?.name || '')
                            .filter(Boolean)
                            .join(', ');
                        td.innerHTML = `<div class="private-primary-cell">${studentNames || '(فارغة)'}</div>`;

                    } else if (entry.levels_data && entry.levels_data.length === 1) {
                        const levelInfo = entry.levels_data[0];
                        const style = primaryLevelStyles[levelInfo.level] || primaryLevelStyles.default;
                        td.style.backgroundColor = style.color;
                        td.style.verticalAlign = 'middle';
                        td.style.textAlign = 'center';
                        td.textContent = formatLevelDisplay(levelInfo.level, levelInfo.institution);

                    } else if (entry.levels_data && entry.levels_data.length > 1) {
                        td.style.padding = '0';
                        const container = document.createElement('div');
                        container.className = 'multi-level-cell';
                        
                        entry.levels_data.forEach(levelInfo => {
                            const tile = document.createElement('div');
                            tile.className = 'level-tile';
                            const style = primaryLevelStyles[levelInfo.level] || primaryLevelStyles.default;
                            tile.style.backgroundColor = style.color;
                            tile.textContent = formatLevelDisplay(levelInfo.level, levelInfo.institution);
                            container.appendChild(tile);
                        });
                        td.appendChild(container);
                    }
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // ٦. إضافة مفتاح الألوان (Legend)
        const container = document.querySelector(`#${tableId}`).closest('.table-responsive');
        if (container && !container.querySelector('.legend')) {
            const legend = document.createElement("div");
            legend.classList.add("legend");
            legend.innerHTML = `
                <div class="legend-item"><span class="legend-color" style="background-color: #fab784;"></span>سنة 1</div>
                <div class="legend-item"><span class="legend-color" style="background-color: #08d4d1;"></span>سنة 2</div>
                <div class="legend-item"><span class="legend-color" style="background-color: #e9f57f;"></span>سنة 3</div>
                <div class="legend-item"><span class="legend-color" style="background-color: #91E3AD;"></span>سنة 4</div>
                <div class="legend-item"><span class="legend-color" style="background-color: #8cf5ec;"></span>سنة 5</div>
                <div class="legend-item"><span class="legend-color" style="background-color: #FFD9E0;"></span>سنة 6</div>
                <div class="legend-item"><span class="legend-color" style="background-color: #f76d6d;"></span>حصة خاصة</div>
            `;
            container.appendChild(legend);
        }

    } catch (error) {
        console.error("Failed to build primary schedule:", error);
        const tbody = document.querySelector(`#${tableId} tbody`);
        if(tbody) tbody.innerHTML = `<tr><td colspan="8">حدث خطأ في تحميل الجدول.</td></tr>`;
    }
}
// <<<< نهاية الكود الجديد >>>>
