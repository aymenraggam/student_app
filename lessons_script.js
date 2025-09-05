document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('lessons-container');
  
  try {
    const response = await fetch('lessons.json');
    if (!response.ok) {
      throw new Error('فشل تحميل ملف الدروس.');
    }
    const lessons = await response.json();

    // 1. تجميع الدروس حسب المستوى ثم المادة
    const groupedLessons = lessons.reduce((acc, lesson) => {
      // تجاهل الدروس الفارغة
      if (!lesson.lesson_name || !lesson.subject) {
        return acc;
      }

      const level = lesson.educational_level;
      const subject = lesson.subject;

      if (!acc[level]) {
        acc[level] = {};
      }
      if (!acc[level][subject]) {
        acc[level][subject] = [];
      }
      acc[level][subject].push(lesson);
      return acc;
    }, {});

    // 2. عرض الدروس على الصفحة
    container.innerHTML = '';
    
    if (Object.keys(groupedLessons).length === 0) {
        container.innerHTML = '<p style="text-align: center;">لا توجد دروس متاحة حالياً.</p>';
        return;
    }

    // فرز المستويات (إذا كان لديك ترتيب معين)
    const sortedLevels = Object.keys(groupedLessons).sort(); 

    sortedLevels.forEach(level => {
      const levelElement = document.createElement('div');
      levelElement.className = 'level-section';
      levelElement.innerHTML = `<h2>${level}</h2>`;
      
      const sortedSubjects = Object.keys(groupedLessons[level]).sort();

      sortedSubjects.forEach(subject => {
        const subjectElement = document.createElement('div');
        subjectElement.className = 'subject-section';
        subjectElement.innerHTML = `<h3>${subject}</h3>`;

        const lessonsList = document.createElement('ul');
        lessonsList.className = 'lessons-list';

        groupedLessons[level][subject].forEach(lesson => {
          let filesHTML = '<div class="files-list">الملفات المرفقة: ';
          if (lesson.files && lesson.files.length > 0) {
            filesHTML += lesson.files.map(file => 
              `<a href="${file.path}" target="_blank">${file.name}</a>`
            ).join(' | ');
          } else {
            filesHTML += 'لا يوجد';
          }
          filesHTML += '</div>';

          const lessonItem = document.createElement('li');
          lessonItem.innerHTML = `
            <span class="lesson-date">${lesson.lesson_date}</span>
            <span class="lesson-name">${lesson.lesson_name}</span>
            ${filesHTML}
          `;
          lessonsList.appendChild(lessonItem);
        });

        subjectElement.appendChild(lessonsList);
        levelElement.appendChild(subjectElement);
      });

      container.appendChild(levelElement);
    });

  } catch (error) {
    container.innerHTML = `<p style="text-align: center; color: red;">حدث خطأ أثناء تحميل الدروس: ${error.message}</p>`;
    console.error(error);
  }
});
