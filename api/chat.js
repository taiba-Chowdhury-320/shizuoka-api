export const config = { runtime: "edge" };

// Simple in-memory DB (Vercel Edge এ persistent না, KV লাগবে)
// নিচে KV ছাড়া JSON store দিচ্ছি

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const q = searchParams.get("q") || searchParams.get("ask") || "";
  const senderId = searchParams.get("senderId") || searchParams.get("uid") || "unknown";

  if (!q) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing query" }),
      { headers }
    );
  }

  // DB থেকে শেখানো answer খোঁজো
  const db = await getDB();
  const key = q.toLowerCase().trim();
  const found = db.teaches[key];

  if (found) {
    const answers = found.answers;
    const reply = answers[Math.floor(Math.random() * answers.length)];
    const react = found.react || "💬";

    return new Response(
      JSON.stringify({
        success: true,
        response: reply,
        react,
        id: senderId,
        source: "database",
      }),
      { headers }
    );
  }

  // Simsimi fallback
  try {
    const r = await fetch(
      `https://simsimi.fun/api/v2?text=${encodeURIComponent(q)}&lc=bd`,
      { headers: { "x-api-key": process.env.SIMSIMI_KEY || "" } }
    );
    const d = await r.json();
    const reply = d.success || "Amake aro shekao! 😅";

    return new Response(
      JSON.stringify({
        success: true,
        response: reply,
        react: "💬",
        id: senderId,
        source: "simsimi",
      }),
      { headers }
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: true,
        response: "Ektu pore try koro! 🙏",
        react: "😅",
        id: senderId,
        source: "fallback",
      }),
      { headers }
    );
  }
}

async function getDB() {
  try {
    const r = await fetch(
      "https://raw.githubusercontent.com/taiba-Chowdhury-320/shizuoka-api/main/db.json"
    );
    return await r.json();
  } catch {
    return { teaches: {}, stats: {} };
  }
}
