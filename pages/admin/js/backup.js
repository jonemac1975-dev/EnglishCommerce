import {
  readRoot,
  writeRoot
}
from "../../../scripts/services/firebaseService.js";

export async function init() {

  document
    .getElementById("btnBackupDb")
    ?.addEventListener(
      "click",
      backupDatabase
    );

  document
    .getElementById("btnRestoreDb")
    ?.addEventListener(
      "click",
      () => {

        document
          .getElementById(
            "restoreFile"
          )
          .click();

      }
    );

  document
    .getElementById("restoreFile")
    ?.addEventListener(
      "change",
      restoreDatabase
    );

}

/* ================= BACKUP ================= */

async function backupDatabase() {

  try {

    showToast?.(
      "Đang backup..."
    );

    const data = await readRoot();

    const json =
      JSON.stringify(
        data,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `firebase_backup_${
        new Date()
        .toISOString()
        .slice(0,10)
      }.json`;

    a.click();

    URL.revokeObjectURL(
      url
    );

    showToast?.(
      "✅ Backup thành công",
      "success"
    );

  }
  catch(err){

    console.error(err);

    alert(
      "Backup thất bại"
    );

  }

}

/* ================= RESTORE ================= */

async function restoreDatabase(e) {

  const file =
    e.target.files[0];

  if (!file) return;

  const ok =
    confirm(
      "Restore sẽ ghi đè toàn bộ dữ liệu.\nBạn chắc chắn chứ?"
    );

  if (!ok) return;

  try {

    showToast?.(
      "Đang restore..."
    );

    const text =
      await file.text();

    const data =
      JSON.parse(text);

    await writeRoot(data);

    showToast?.(
      "✅ Restore thành công",
      "success"
    );

    alert(
      "Restore hoàn tất.\nVui lòng tải lại trang."
    );

  }
  catch(err){

    console.error(err);

    alert(
      "Restore thất bại"
    );

  }

}