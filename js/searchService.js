import { readData } from "../scripts/services/firebaseService.js";

export async function searchCourses(keyword) {
  try {
    const data = await readData("Courses"); // path tùy ông
    if (!data) return [];

    const kw = keyword.toLowerCase();

    return Object.values(data).filter(c =>
      c.name?.toLowerCase().includes(kw)
    );
  } catch {
    return [];
  }
}


// 📖 Dictionary
export async function searchDictionary(keyword) {
  try {
    const word = keyword.split(" ")[0];

    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data[0];
  } catch {
    return null;
  }
}


