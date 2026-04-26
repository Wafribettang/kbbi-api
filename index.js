const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.get('/api/kbbi', async (req, res) => {
  const kata = req.query.kata;
  if (!kata) return res.json({ error: 'masukkan kata yang dicari' });

  try {
    // URL disesuaikan ke kemendikdasmen (KBBI VI)
    const { data } = await axios.get(`https://kbbi.kemendikdasmen.go.id/entri/${kata}`);
    const $ = cheerio.load(data);
    
    let hasil = [];

    // Mengambil definisi kata
    $('ul.list-ungulled li, ol li').each((i, el) => {
      const teks = $(el).text().trim();
      if (teks) hasil.push(teks);
    });

    if (hasil.length === 0) {
      return res.json({ pesan: 'kata tidak ditemukan' });
    }

    res.json({ 
      sumber: 'KBBI VI',
      kata: kata, 
      definisi: hasil 
    });
  } catch (err) {
    res.status(500).json({ error: 'gagal mengambil data' });
  }
});

module.exports = app;
