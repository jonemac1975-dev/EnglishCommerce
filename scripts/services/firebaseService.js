import { db } from "../../config/firebaseConfig.js";
import {
  ref,
  get,
  set,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export async function readData(path) {
  const snap = await get(ref(db, path));
  return snap.exists() ? snap.val() : null;
}

export async function writeData(path, data) {
  return set(ref(db, path), data);
}

export async function updateData(path, data) {
  return update(ref(db, path), data);
}

export async function deleteData(path) {
  return remove(ref(db, path));
}