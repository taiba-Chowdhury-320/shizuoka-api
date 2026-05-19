export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const action = searchParams.get("action") || "all";
  const uid = searchParams.get("uid") || "";

  const r = await fetch(
    "https://raw.githubusercontent.com/taiba-Chowdhury-320/shizuoka-api/main/db.json"
  );
  const db = await r.json();

  // Total teach count
  if (action === "allteach") {
    return new Response(
      JSON.stringify({
        success: true,
        total: Object.keys(db.teaches).length,
      }),
      { headers }
    );
  }

  // My stats
  if (action === "mystats" && uid) {
    return new Response(
      JSON.stringify({
        success: true,
        id: uid,
        count: db.stats[uid] || 0,
      }),
      { headers }
    );
  }

  // Top teachers
  if (action === "teachers") {
    const sorted = Object.entries(db.stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, count]) => ({ uid, count }));
    return new Response(
      JSON.stringify({ success: true, teachers: sorted }),
      { headers }
    );
  }

  return new Response(
    JSON.stringify({ success: false, message: "Invalid action" }),
    { headers }
  );
}
