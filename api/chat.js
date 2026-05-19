export const config = { runtime: "edge" };

const DB = {
  teaches: {},
  stats: {},
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const ask = searchParams.get("ask");
  const answer = searchParams.get("answer");
  const uid = searchParams.get("uid");

  const headers = { "Content-Type": "application/json" };

  // ─── CHAT ───
  if (action === "chat") {
    if (!ask) return new Response(JSON.stringify({ error: "Missing ask" }), { headers });

    const key = ask.toLowerCase().trim();
    if (DB.teaches[key]) {
      const arr = DB.teaches[key].split(",");
      const reply = arr[Math.floor(Math.random() * arr.length)].trim();
      return new Response(JSON.stringify({ status: true, reply, source: "taught" }), { headers });
    }

    // Simsimi fallback
    try {
      const r = await fetch(`https://api.simsimi.net/v2/?text=${encodeURIComponent(ask)}&lc=bd`, {
        headers: { "x-api-key": "SIMSIMI_KEY_HERE" }
      });
      const d = await r.json();
      const reply = d.success || "Amake aro shekao! 😅";
      return new Response(JSON.stringify({ status: true, reply, source: "simsimi" }), { headers });
    } catch {
      return new Response(JSON.stringify({ status: true, reply: "Ektu pore try koro! 🙏" }), { headers });
    }
  }

  // ─── TEACH ───
  if (action === "teach") {
    if (!ask || !answer || !uid)
      return new Response(JSON.stringify({ error: "Missing params" }), { headers });

    DB.teaches[ask.toLowerCase().trim()] = answer;
    DB.stats[uid] = (parseInt(DB.stats[uid] || 0) + 1);

    return new Response(JSON.stringify({ status: true, message: "Taught successfully! ✅" }), { headers });
  }

  // ─── ALLTEACH ───
  if (action === "allteach") {
    return new Response(JSON.stringify({ status: true, total: Object.keys(DB.teaches).length }), { headers });
  }

  // ─── MYSTATS ───
  if (action === "mystats") {
    return new Response(JSON.stringify({ status: true, count: DB.stats[uid] || 0 }), { headers });
  }

  // ─── TEACHERS ───
  if (action === "teachers") {
    const sorted = Object.entries(DB.stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, count]) => ({ uid, count }));
    return new Response(JSON.stringify({ status: true, teachers: sorted }), { headers });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { headers });
}
