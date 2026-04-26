const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.get('/api/kbbi', async (req, res) => {
  const kata = req.query.kata;
  if (!kata) return res.json({ error: 'masukan kata yang dicari' });

  try {
    const { data } = await axios.get(`https://kbbi.kemdikbud.go.id/entri/${kata}`);
    const $ = cheerio.load(data);
    let hasil = [];

    $('ol li, ul li').each((i, el) => {
      hasil.push($(el).text().trim());
    });

    if (hasil.length === 0) return res.json({ pesan: 'kata tidak ditemukan' });

    res.json({ kata, definisi: hasil });
  } catch (err) {
    res.status(500).json({ error: 'gagal mengambil data dari pusat' });
  }
});

module.exports = app;
