const axios = require('axios');
const cheerio = require('cheerio');

async function cariKBBI(kata) {
    const url = `https://kbbi.kemdikbud.go.id/entri/${kata.toLowerCase().trim()}`;
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);
        let hasilDefinisi = [];

        // 1. Coba cari yang model list dulu (untuk yang banyak arti seperti 'goblok')
        const listDefinisi = $('ol.last-list-child li');
        
        if (listDefinisi.length > 0) {
            listDefinisi.each((i, el) => {
                $(el).find('.entrisButton').remove();
                hasilDefinisi.push(`${i + 1}. ${$(el).text().trim()}`);
            });
        } else {
            // 2. Kalau list ga ada, cari definisi tunggal (untuk yang 1 arti seperti 'juling')
            // Biasanya ada di elemen setelah tag <hr> atau di dalam tag <ul> / <li> tanpa <ol>
            $('ul.last-list-child li, .container.body-content li').each((i, el) => {
                // Pastikan bukan bagian dari menu navigasi
                if (!$(el).closest('.navbar').length) {
                    $(el).find('.entrisButton').remove();
                    const txt = $(el).text().trim();
                    if (txt) hasilDefinisi.push(txt);
                }
            });
        }

        // Kalau masih kosong juga, ambil teks kasar di bawah header
        if (hasilDefinisi.length === 0) {
            let rawText = $('h2').nextAll('ul, ol, li').first().text().trim();
            if (rawText) hasilDefinisi.push(rawText);
        }

        console.log(`kata: ${kata}`);
        if (hasilDefinisi.length > 0) {
            hasilDefinisi.forEach(def => console.log(def));
        } else {
            console.log("definisi tidak ditemukan.");
        }

    } catch (error) {
        console.log("error atau kata tidak ada.");
    }
}

// Test dua-duanya
cariKBBI("goblok");
cariKBBI("juling");
