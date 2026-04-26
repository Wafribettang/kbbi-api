const axios = require('axios');
const cheerio = require('cheerio');

async function cariKBBI(kata) {
    const url = `https://kbbi.kemdikbud.go.id/entri/${kata.toLowerCase().trim()}`;
    
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);
        let hasil = [];

        // Ambil judul kata (biar tau ejaannya, misal: ma.ta)
        const judul = $('h2').first().contents().filter(function() {
            return this.type === 'text';
        }).text().trim();

        // Cari di ol (untuk banyak arti) ATAU ul (untuk satu arti)
        // Kita spesifik cari di .last-list-child atau .adjusted-par
        const container = $('ol.last-list-child, ul.adjusted-par').first();
        
        container.find('li').each((i, el) => {
            // Hapus tombol-tombol edit/copy/usulan makna baru
            $(el).find('.entrisButton').remove();
            
            const teks = $(el).text().trim();
            
            // Cek biar tulisan "Usulkan makna baru" gak ikut masuk
            if (teks && !teks.includes("Usulkan makna baru")) {
                // Kalau dari <ol> kita kasih nomor, kalau <ul> (satu arti) langsung aja
                if (container.is('ol')) {
                    hasil.push(`${i + 1}. ${teks}`);
                } else {
                    hasil.push(teks);
                }
            }
        });

        console.log(`\nKata: ${judul}`);
        if (hasil.length > 0) {
            hasil.forEach(def => console.log(def));
        } else {
            console.log("Definisi tidak ditemukan.");
        }

    } catch (error) {
        console.log("Kata tidak ditemukan atau server bermasalah.");
    }
}

// Test sesuai view-source kamu
cariKBBI("mata");
cariKBBI("juling");
