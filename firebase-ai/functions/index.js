const functions = require("firebase-functions");
const fetch = require("node-fetch");

// 🔑 DANH SÁCH KEY
const API_KEYS = [
  "KEY_1",
  "KEY_2",
  "KEY_3"
];

// 🔗 API Gemini
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// cache key lỗi
let badKeys = new Set();

exports.callAI = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  const prompt = req.body.prompt || "Hello";

  // 🔀 random key
  const keys = API_KEYS.sort(() => 0.5 - Math.random());

  for (let key of keys) {
    if (badKeys.has(key)) continue;

    try {
      console.log("👉 Đang thử key:", key.substring(0, 10));

      const response = await fetch(`${API_URL}?key=${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      });

      const data = await response.json();

      if (response.ok) {
        return res.json({
          success: true,
          keyUsed: key,
          data
        });
      }

      badKeys.add(key);
      console.log("❌ Key lỗi:", data);

    } catch (err) {
      badKeys.add(key);
      console.log("❌ Fetch lỗi:", err.message);
    }
  }

  return res.status(500).json({
    success: false,
    message: "All keys failed"
  });
});