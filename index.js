const axios = require('axios');
const cheerio = require('cheerio');

async function cariKBBI(kata) {
    const url = `https://kbbi.kemdikbud.go.id/entri/${kata.toLowerCase().trim()}`;
    
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);

        // Ambil judul (misal: ber.sih)
        const judul = $('h2').first().contents().filter(function() {
            return this.type === 'text';
        }).text().trim();

        if (!judul) {
            console.log('kata tidak ditemukan.');
            return;
        }

        console.log(`hasil: ${judul}`);

        // Ambil daftar definisi
        $('ol.last-list-child li').each((i, el) => {
            // Hapus tombol-tombol (edit, copy, dll) biar teks bersih
            $(el).find('.entrisButton').remove();
            
            const definisi = $(el).text().trim();
            console.log(`${i + 1}. ${definisi}`);
        });

    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('kata tidak ditemukan (404).');
        } else {
            console.log('terjadi kesalahan:', error.message);
        }
    }
}

// Cara pakai
const kataInput = "bersih"; // ganti jadi input dari bot kamu
cariKBBI(kataInput);
