import axios from "axios";

export default async function handler(req, res) {
  const query = req.query.q || "funny raccoon";
  const serpKey = process.env.SERPAPI_KEY;

const params = {
  engine: "google_images",
  q: query,
  tbm: "isch",
  tbs: "itp:photo,ic:trans", // photo + transparent (removes some memes/stock)
  api_key: serpKey
};


try {
  const response = await axios.get("https://serpapi.com/search", { params });

  // Extract images from SerpAPI
  let results = response.data.images_results;

  // ✅ Filter to get rid of memes, stickers, fursuits, etc.
  results = results.filter(r =>
    r.original &&
    r.original.endsWith(".jpg") &&
    !r.title.toLowerCase().includes("sticker") &&
    !r.title.toLowerCase().includes("clipart") &&
    !r.title.toLowerCase().includes("fursuit") &&
    !r.original.includes(".svg") &&
    !r.original.includes("logo") &&
    !r.title.toLowerCase().includes("meme")
  );

  if (!results.length) {
    return res.status(404).json({ error: "Only cursed raccoons found." });
  }

  const image = results[Math.floor(Math.random() * results.length)].original;

  // ✅ Stream the image back
  const imgResp = await axios.get(image, { responseType: "arraybuffer" });

  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Content-Disposition", `inline; filename="raccoon.jpg"`);
  res.status(200).send(imgResp.data);

} catch (err) {
  console.error("Raccoon crash:", err.message);
  res.status(500).json({ error: "raccoon malfunction" });
}
}
