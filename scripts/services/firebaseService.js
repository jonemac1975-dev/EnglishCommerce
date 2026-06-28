import { db } from "../../config/firebaseConfig.js";
import {
  ref,
  get,
  set,
  update,
  remove,
onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

export async function readRoot() {
  const snap = await get(ref(db));
  return snap.exists() ? snap.val() : null;
}

export async function writeRoot(data) {
  return set(ref(db), data);
}


export function listenData(path, callback) {
  const r = ref(db, path);

  const unsubscribe = onValue(r, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });

  return unsubscribe; // có thể stop listener nếu cần
}


export function listenChildAdded(path, callback) {
  const r = ref(db, path);

  return onValue(r, (snapshot) => {
    callback(snapshot.val());
  });
}

export function onDataChange(path, callback) {
  const r = ref(db, path);

  const unsubscribe = onValue(r, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });

  return unsubscribe;
}