const fs = require('fs');
const https = require('https');
const sharp = require('sharp');
const path = require('path');

const dir = path.join(__dirname, 'public', 'bg');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const convert = (name, url) => {
    https.get(url, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            sharp(buffer)
                .webp({ quality: 80, effort: 6 })
                .toFile(path.join(dir, name + '.webp'))
                .then(() => console.log('Converted', name))
                .catch(e => console.error(e));
        });
    });
};

convert('P3', 'https://skillzone.cz/wp-content/uploads/2024/04/P3.png');
convert('P4', 'https://skillzone.cz/wp-content/uploads/2024/04/P4.png');
