const axios = require("axios");
const cheerio = require("cheerio");

export default async function handler(req, res) {
  // Hanya izinkan GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { kata } = req.query;

  if (!kata || kata.trim() === "") {
    return res.status(400).json({ error: "Query parameter ?kata= wajib diisi." });
  }

  const encodedKata = encodeURIComponent(kata.trim().toLowerCase());
  const url = `https://kbbi.kemdikbud.go.id/entri/${encodedKata}`;

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://kbbi.kemdikbud.go.id/",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    // Ambil judul kata dari elemen h2
    const judulRaw = $("h2").first().clone();
    judulRaw.find(".entrisButton").remove();
    const judul = judulRaw.text().trim();

    if (!judul) {
      return res.status(404).json({ error: `Kata "${kata}" tidak ditemukan di KBBI.` });
    }

    const definisi = [];

    /**
     * Helper: bersihkan dan ambil teks dari elemen <li>
     * - Hapus .entrisButton
     * - Abaikan li yang mengandung "Usulkan makna baru"
     */
    function extractFromList(selector) {
      $(selector).each((_, el) => {
        const item = $(el).clone();
        item.find(".entrisButton").remove();

        const teks = item.text().replace(/\s+/g, " ").trim();

        if (!teks || teks.toLowerCase().includes("usulkan makna baru")) return;

        definisi.push(teks);
      });
    }

    // Kata dengan BANYAK arti → ol.last-list-child li
    extractFromList("ol.last-list-child li");

    // Kata dengan SATU arti → ul.adjusted-par li (fallback jika ol kosong)
    if (definisi.length === 0) {
      extractFromList("ul.adjusted-par li");
    }

    if (definisi.length === 0) {
      return res.status(404).json({
        error: `Definisi untuk kata "${kata}" tidak berhasil diekstrak. Struktur halaman mungkin berbeda.`,
      });
    }

    return res.status(200).json({
      kata: judul,
      definisi,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: `Kata "${kata}" tidak ditemukan di KBBI.` });
    }

    console.error("Scraping error:", err.message);
    return res.status(500).json({ error: "Terjadi kesalahan saat mengambil data dari KBBI." });
  }
}
