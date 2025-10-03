// This script is now significantly simplified.

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const guardianData = sessionStorage.getItem("guardian");
    if (!guardianData) {
        window.location = "login.html";
        return;
    }

    const guardian = JSON.parse(guardianData);
    const students = await fetch("students.json").then(res => res.json());
    const children = students.filter(student => guardian.student_ids.includes(student.id));

    // Display guardian's name and total unpaid amount
    document.getElementById("guardianName").innerText = `مرحباً، ${guardian.guardian_full_name}`;
    document.getElementById("totalUnpaid").innerText = `${guardian.unpaid_total.toFixed(2)} دينار`;

    // Populate the children table (this is the only table left)
    const childrenTableBody = document.getElementById("children").getElementsByTagName('tbody')[0];
    if (childrenTableBody) {
        childrenTableBody.innerHTML = ''; 
        children.forEach(student => {
          let childRow = childrenTableBody.insertRow();
          childRow.innerHTML = `<td>${student.name} ${student.surname}</td>
                                <td>${student.educational_level}</td>
                                <td>${student.institution || 'غير محددة'}</td>
                                <td>${student.unpaid_total.toFixed(2)}</td>
                                <td>${Array.isArray(student.absence_count) ? student.absence_count.length : 0}</td>`;
        });
    }

  } catch (error) {
    console.error("حدث خطأ:", error);
    alert("عفواً، حدث خطأ أثناء تحميل بيانات الصفحة. قد تكون البيانات غير مكتملة.");
  }
});
