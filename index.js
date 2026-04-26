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
    let kumpulanHasil = [];

    // Cari semua elemen h2 (ejaan) dan ul (definisi) yang sejajar
    $('h2').each((i, el) => {
      let ejaanTeks = $(el).contents().filter(function() {
        return this.type === 'text';
      }).text().trim();

      // Jika ada angka superscript (pangkat), ambil juga
      let pangkat = $(el).find('sup').text().trim();
      let ejaanFull = ejaanTeks + (pangkat ? ` (${pangkat})` : '');

      // Cari ul.adjusted-par yang berada tepat setelah h2 ini
      let definisiList = [];
      $(el).nextAll('ul.adjusted-par').first().find('li').each((j, li) => {
        $(li).find('.entrisButton').remove();
        let teksDefinisi = $(li).text().trim();
        if (teksDefinisi && !teksDefinisi.includes("Usulkan makna baru")) {
          definisiList.push(teksDefinisi);
        }
      });

      if (ejaanFull && definisiList.length > 0) {
        kumpulanHasil.push({
          ejaan: ejaanFull,
          arti: definisiList
        });
      }
    });

    if (kumpulanHasil.length === 0) {
      return res.json({ pesan: 'kata tidak ditemukan' });
    }

    res.json({ 
      sumber: 'KBBI VI',
      kata: kata,
      hasil: kumpulanHasil
    });

  } catch (err) {
    res.status(500).json({ error: 'gagal mengambil data' });
  }
});

module.exports = app;
