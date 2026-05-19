export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { action, ask, answer, uid } = req.query;

  // ─── CHAT ───
  if (action === "chat") {
    if (!ask) return res.json({ error: "Missing 'ask' param" });

    const key = ask.toLowerCase().trim();

    // Check taught answers first
    const teaches = await getTeaches();
    if (teaches[key]) {
      const answers = teaches[key].split(",");
      const reply = answers[Math.floor(Math.random() * answers.length)].trim();
      return res.json({ status: true, reply, source: "taught" });
    }

    // Fallback: Simsimi API
    const simsimi = await callSimsimi(ask);
    return res.json({ status: true, reply: simsimi, source: "simsimi" });
  }

  // ─── TEACH ───
  if (action === "teach") {
    if (!ask || !answer || !uid)
      return res.json({ error: "Missing params" });

    const teaches = await getTeaches();
    teaches[ask.toLowerCase().trim()] = answer;
    await saveTeaches(teaches);

    const stats = await getStats();
    stats[uid] = (parseInt(stats[uid] || 0) + 1).toString();
    await saveStats(stats);

    return res.json({ status: true, message: "Taught successfully! ✅" });
  }

  // ─── MY STATS ───
  if (action === "mystats") {
    if (!uid) return res.json({ error: "Missing uid" });
    const stats = await getStats();
    const count = stats[uid] || 0;
    return res.json({ status: true, uid, count });
  }

  // ─── ALL TEACH COUNT ───
  if (action === "allteach") {
    const teaches = await getTeaches();
    return res.json({ status: true, total: Object.keys(teaches).length });
  }

  // ─── TEACHERS LIST ───
  if (action === "teachers") {
    const stats = await getStats();
    const sorted = Object.entries(stats)
      .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))
      .slice(0, 10)
      .map(([uid, count]) => ({ uid, count: parseInt(count) }));
    return res.json({ status: true, teachers: sorted });
  }

  return res.json({ error: "Invalid action" });
}

// ─── Simsimi API ───
async function callSimsimi(text) {
  try {
    const r = await fetch("https://simsimi.fun/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        lc: "bd",
        key: process.env.SIMSIMI_API_KEY,
      }),
    });
    const data = await r.json();
    return data.success || "Amake aro shekao! 😅";
  } catch {
    return "Ektu pore try koro! 🙏";
  }
}

// ─── KV Store Helpers (Vercel KV) ───
import { kv } from "@vercel/kv";

async function getTeaches() {
  const data = await kv.get("teaches");
  return data || {};
}

async function saveTeaches(obj) {
  await kv.set("teaches", obj);
}

async function getStats() {
  const data = await kv.get("stats");
  return data || {};
}

async function saveStats(obj) {
  await kv.set("stats", obj);
}
