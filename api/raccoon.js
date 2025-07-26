import axios from "axios";

export default async function handler(req, res) {
  const query = req.query.q || "funny raccoon";
  const serpKey = process.env.SERPAPI_KEY;

  const params = {
    q: query,
    tbm: "isch",
    api_key: serpKey
  };

  try {
    const response = await axios.get("https://serpapi.com/search", { params });
    const results = response.data.images_results;

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "No raccoons found" });
    }

    const image = results[Math.floor(Math.random() * results.length)].original;

    const imgResp = await axios.get(image, { responseType: "arraybuffer" });

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `inline; filename=\"raccoon.jpg\"`);
    res.status(200).send(imgResp.data);
  } catch (err) {
    console.error("Raccoon crash:", err);
    res.status(500).json({ error: "raccoon malfunction" });
  }
}
