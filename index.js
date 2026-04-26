const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.get('/api/kbbi', async (req, res) => {
  const kata = req.query.kata;
  if (!kata) return res.json({ error: 'masukkan kata yang dicari' });

  try {
    const { data } = await axios.get(`https://kbbi.kemendikdasmen.go.id/entri/${kata}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    
    // Ambil ejaan (misal: ma.ma.li.a)
    const ejaan = $('h2').first().contents().filter(function() {
      return this.type === 'text';
    }).text().trim();

    let hasil = [];

    // Target utama: ul dengan class adjusted-par sesuai source code mu
    $('ul.adjusted-par li').each((i, el) => {
      // Kita ambil teksnya, tapi buang bagian tombol-tombol (entrisButton)
      $(el).find('.entrisButton').remove();
      let teks = $(el).text().trim();
      
      if (teks && !teks.includes("Usulkan makna baru")) {
        hasil.push(teks);
      }
    });

    if (hasil.length === 0) {
      return res.json({ pesan: 'kata tidak ditemukan atau tidak ada definisi' });
    }

    res.json({ 
      sumber: 'KBBI VI',
      kata: kata,
      ejaan: ejaan,
      definisi: hasil 
    });

  } catch (err) {
    res.status(500).json({ error: 'gagal mengambil data, pastikan kata benar' });
  }
});

module.exports = app;
