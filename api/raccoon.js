// api/raccoon.js
export default async function handler(req, res) {
  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey) {
    return res.status(500).json({ error: "Missing SERPAPI_KEY" });
  }

  // rotate through sane search terms to avoid weird results + caching
  const QUERIES = [
    "real raccoon photo",
    "wild raccoon close up",
    "cute raccoon in nature",
    "baby raccoon face wildlife",
    "raccoon photography outdoors",
    "backyard raccoon at night",
    "raccoon peeking from bush",
    "raccoon portrait wildlife"
  ];
  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];

  // pick a random image page (0..5) for variety
  const ijn = Math.floor(Math.random() * 6);

  const params = new URLSearchParams({
    engine: "google_images",
    q: `${query} -plush -toy -furry -merch -logo -clipart -sticker -cartoon`,
    tbm: "isch",
    tbs: "itp:photo",           // photos only
    ijn: String(ijn),           // pagination page
    api_key: serpKey
  });

  try {
    // 1) fetch image search results
    const resp = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    if (!resp.ok) throw new Error(`SerpAPI ${resp.status}`);
    const data = await resp.json();

    let results = Array.isArray(data.images_results) ? data.images_results : [];

    // 2) filter out junk
    results = results.filter(r => {
      const t = (r.title || "").toLowerCase();
      const u = r.original || "";
      return (
        u &&
        (u.endsWith(".jpg") || u.endsWith(".jpeg") || u.endsWith(".png")) &&
        !t.includes("sticker") &&
        !t.includes("clipart") &&
        !t.includes("fursuit") &&
        !t.includes("meme") &&
        !u.includes(".svg") &&
        !u.includes("logo")
      );
    });

    if (!results.length) {
      return res.status(404).json({ error: "Only cursed raccoons found." });
    }

    // simple shuffle
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    // 3) try fetching up to N candidates until one works & is image/*
    const MAX_TRIES = Math.min(8, results.length);
    for (let i = 0; i < MAX_TRIES; i++) {
      const url = results[i].original;
      try {
        const r = await fetch(url, { redirect: "follow" });
        if (!r.ok) continue;

        const ct = (r.headers.get("content-type") || "").toLowerCase();
        if (!ct.startsWith("image/")) continue;

        const buf = Buffer.from(await r.arrayBuffer());
        const ext =
          ct.includes("png") ? "png" :
          ct.includes("jpeg") ? "jpg" :
          ct.includes("gif") ? "gif" : "jpg";

        res.setHeader("Content-Type", ct || "image/jpeg");
        res.setHeader("Content-Disposition", `inline; filename="raccoon.${ext}"`);
        return res.status(200).send(buf);
      } catch {
        // try next candidate
      }
    }

    return res.status(404).json({ error: "No usable raccoon image found." });
  } catch (err) {
    console.error("Raccoon crash:", err?.message || err);
    return res.status(500).json({ error: "raccoon malfunction" });
  }
}
