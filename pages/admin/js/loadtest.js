import {
  readData,
  writeData,
  deleteData
} from "../../../scripts/services/firebaseService.js";

export function init() {

  bindAction(
    "btnCreateStudents",
    createStudents
  );

  bindAction(
    "btnCreate500",
    create500Students
  );

  bindAction(
    "btnCreateSubmissions",
    createSubmissions
  );

  bindAction(
    "btnRandomScore",
    randomScore
  );

  bindAction(
    "btnStatistic",
    showStatistic
  );

  bindAction(
    "btnDeleteTest",
    deleteTestData
  );

}


let isRunning = false;

function setLoading(flag) {

  isRunning = flag;

  document
    .querySelectorAll("button")
    .forEach(btn => {

      btn.disabled = flag;

      btn.style.opacity =
        flag ? 0.6 : 1;

      btn.style.cursor =
        flag ? "not-allowed" : "pointer";

    });

}

function log(msg) {

  const el =
    document.getElementById("testLog");

  if (!el) return;

  el.textContent += msg + "\n";

}

async function createStudents() {

const students =
  await readData("users/students");

const testCount =
  Object.keys(students || {})
  .filter(id =>
    id.startsWith("hv_test_")
  ).length;

if (testCount > 0) {

  log(
    `⚠️ Đã có ${testCount} học viên test`
  );

  return;
}

  log("Bắt đầu tạo học viên...");

  for (let i = 1; i <= 100; i++) {

    const id =
      `hv_test_${String(i).padStart(3,"0")}`;

    await writeData(
      `users/students/${id}`,
      {
        auth: {
          username:
            `Test ${i}`,
          status: "active",
          created_at:
            Date.now()
        },

        profile: {
          ho_ten:
            `Học viên Test ${i}`,
          lop:
            "mh_1779365345712"
        },

        online:false
      }
    );

    log(
      `✔ ${id}`
    );

  }

  log(
    "HOÀN THÀNH 100 HỌC VIÊN"
  );

}

async function create500Students() {

const students =
  await readData("users/students");

const testCount =
  Object.keys(students || {})
  .filter(id =>
    id.startsWith("hv_test_")
  ).length;

if (testCount > 0) {

  log(
    `⚠️ Đã có ${testCount} học viên test`
  );

  return;
}

  log(
    "Tạo 500 học viên..."
  );

  const jobs = [];

  for (let i = 1; i <= 500; i++) {

    const id =
      `hv_test_${String(i).padStart(3,"0")}`;

    jobs.push(

      writeData(
        `users/students/${id}`,
        {
          auth:{
            username:`Test ${i}`,
            status:"active",
            created_at:Date.now()
          },

          profile:{
            ho_ten:
              `Học viên Test ${i}`,
            lop:
              "mh_1779365345712"
          },

          online:false
        }
      )

    );

  }

  await Promise.all(jobs);

  log(
    "🚀 HOÀN THÀNH 500 HỌC VIÊN"
  );

}

async function createSubmissions() {


  log("Bắt đầu tạo bài nộp...");

  const students =
    await readData(
      "users/students"
    );

  if (!students) {
    log("Không có học viên");
    return;
  }

  const teacherId =
    "gv_1773898351463";

  const baiId =
    "kt_1780744814118";

  const kyThi =
    "kt_1773898224045";

  let count = 0;

  for (const studentId of Object.keys(students)) {

    if (!studentId.startsWith("hv_test_"))
      continue;

    await writeData(

      `users/students/${studentId}/examDraw/${teacherId}_${kyThi}`,

      {
        baiId,
        confirmed: true,
        createdAt: Date.now(),
        drawCount: 1,
        maDe: "05"
      }

    );

    await writeData(

      `users/students/${studentId}/kiemtra/${baiId}`,

      {
        bai: baiId,

        diem: 0,
        diem_tn: 0,

        dung: 0,

        diemTNMax: 5,
        diemTLMax: 5,

        tong: 10,

        examType: "mixed",

        giao_vien: teacherId,

        kythi: kyThi,

        lop: "mh_1779365345712",

        monhoc: "mh_1774929141974",

        submittedAt: Date.now(),

        essayPending: true,

        traLoi: [
          null,
          "A",
          "B",
          "C",
          "D",
          "A",
          "B",
          "C",
          "D",
          "A",
          "B"
        ],

        tuLuan: [
          null,
          {
            image:"",
            text:"Bài test tự luận 1"
          },
          {
            image:"",
            text:"Bài test tự luận 2"
          }
        ]
      }

    );

    count++;

    log(
      `✔ ${studentId}`
    );

  }

  log(
    `HOÀN THÀNH ${count} BÀI NỘP`
  );

}


async function randomScore() {

  log("Bắt đầu chấm tự động...");

  const students =
    await readData(
      "users/students"
    );

  if (!students) return;

  let count = 0;

  for (const [studentId, student] of Object.entries(students)) {

    if (!studentId.startsWith("hv_test_"))
      continue;

    const ds =
      student.kiemtra || {};

    for (const [baiId, bai] of Object.entries(ds)) {

      const diemTL =
        Math.floor(Math.random() * 6);

      const tong =
        bai.diem_tn + diemTL;

      await writeData(
        `users/students/${studentId}/kiemtra/${baiId}/diem_tl`,
        diemTL
      );

      await writeData(
        `users/students/${studentId}/kiemtra/${baiId}/tong_diem`,
        tong
      );

      await writeData(
        `users/students/${studentId}/kiemtra/${baiId}/finalScore`,
        tong
      );

      await writeData(
        `users/students/${studentId}/kiemtra/${baiId}/essayPending`,
        false
      );

      await writeData(
        `users/students/${studentId}/kiemtra/${baiId}/chamCount`,
        1
      );

      count++;

    }

  }

  log(
    `✅ Đã chấm ${count} bài`
  );

}


async function showStatistic() {

  const students =
    await readData(
      "users/students"
    );

  if (!students) return;

  let totalStudent = 0;
  let totalExam = 0;
  let daCham = 0;
  let chuaCham = 0;

  for (const [id, student]
    of Object.entries(students)) {

    if (!id.startsWith("hv_test_"))
      continue;

    totalStudent++;

    const ds =
      student.kiemtra || {};

    for (const bai of Object.values(ds)) {

      totalExam++;

      if (bai.essayPending)
        chuaCham++;
      else
        daCham++;

    }

  }

  log("");
  log("===== THỐNG KÊ =====");

  log(
    `Học viên : ${totalStudent}`
  );

  log(
    `Bài nộp : ${totalExam}`
  );

  log(
    `Đã chấm : ${daCham}`
  );

  log(
    `Chưa chấm : ${chuaCham}`
  );

}


async function deleteTestData() {

  const text = prompt(
    "⚠️ Nhập XOA để xác nhận xóa toàn bộ dữ liệu test"
  );

  if (text !== "XOA") {
    log("❌ Hủy xóa");
    return;
  }

  log("🗑 Đang xóa dữ liệu test...");

  const students =
    await readData("users/students");

  if (!students) {
    log("Không có dữ liệu");
    return;
  }

  // ===== BACKUP =====

  const backup = {};

  for (const [id, data] of Object.entries(students)) {

    if (id.startsWith("hv_test_")) {
      backup[id] = data;
    }

  }

  const blob = new Blob(
    [
      JSON.stringify(
        backup,
        null,
        2
      )
    ],
    {
      type: "application/json"
    }
  );

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download =
    `backup_test_${Date.now()}.json`;

  a.click();

  // ===== XÓA =====

  const jobs = [];

  for (const studentId of Object.keys(students)) {

    if (
      studentId.startsWith("hv_test_")
    ) {

      jobs.push(
        deleteData(
          `users/students/${studentId}`
        )
      );

    }

  }

  await Promise.all(jobs);

  log(
    `✅ Đã xóa ${jobs.length} học viên test`
  );

}

window.onerror = function(msg,url,line,col,error){
  console.error(
    "GLOBAL ERROR",
    msg,
    url,
    line
  );
};

function bindAction(id, fn) {

  document
    .getElementById(id)
    ?.addEventListener("click", async () => {

      if (isRunning) return;

      try {

        setLoading(true);

        await fn();

      }
      catch(err) {

        console.error(err);

        log(
          "❌ Lỗi: " +
          err.message
        );

      }
      finally {

        setLoading(false);

      }

    });

}