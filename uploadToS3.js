require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const DATA_DIR = path.join(__dirname, 'public', 'data', 'medias');
const MEDIA_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.webm'];
const YEAR = '2026';

const s3 = new AWS.S3({
    endpoint: process.env[`S3_ENDPOINT_${YEAR}`],
    accessKeyId: process.env[`S3_ACCESS_KEY_${YEAR}`],
    secretAccessKey: process.env[`S3_SECRET_KEY_${YEAR}`],
    region: process.env[`S3_REGION_${YEAR}`],
    signatureVersion: 'v4',
});
const BUCKET = process.env[`S3_BUCKET_${YEAR}`];

// --- Patterns de nommage ---
// Chaque pattern est une regex avec des groupes nommés : year, month, day, hour, min, sec
// Ajouter de nouveaux patterns ici au besoin
const FILENAME_PATTERNS = [
    {
        name: 'Google Pixel (PXL_YYYYMMDD_HHmmSSxxx)',
        regex: /^PXL_(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})_(?<hour>\d{2})(?<min>\d{2})(?<sec>\d{2})/,
    },
    {
        name: 'Prefixed timestamp (...YYYYMMDDHHmmSS)',
        regex: /(?<year>20\d{2})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})(?<min>\d{2})(?<sec>\d{2})$/,
        // Match à la fin du basename (sans extension)
        matchOnBasename: true,
    },
    {
        name: 'IMG_YYYYMMDD_HHmmSS',
        regex: /^IMG_(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})_(?<hour>\d{2})(?<min>\d{2})(?<sec>\d{2})/,
    },
    {
        name: 'VID_YYYYMMDD_HHmmSS',
        regex: /^VID_(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})_(?<hour>\d{2})(?<min>\d{2})(?<sec>\d{2})/,
    },
    {
        name: 'Already formatted (YYYYMMDDHHmmSS)',
        regex: /^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})(?<min>\d{2})(?<sec>\d{2})$/,
        matchOnBasename: true,
    },
];

// --- Fonctions ---

function extractTimestamp(filename) {
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);

    for (const pattern of FILENAME_PATTERNS) {
        const input = pattern.matchOnBasename ? basename : filename;
        const match = input.match(pattern.regex);
        if (match?.groups) {
            const { year, month, day, hour, min, sec } = match.groups;
            return { timestamp: `${year}${month}${day}${hour}${min}${sec}`, pattern: pattern.name };
        }
    }
    return null;
}

function getLocalMediaFiles() {
    return fs.readdirSync(DATA_DIR).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return MEDIA_EXTENSIONS.includes(ext);
    });
}

async function getExistingS3Keys() {
    try {
        const { Contents } = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
        return new Set((Contents || []).map(obj => obj.Key));
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des fichiers S3 :', error.message);
        throw error;
    }
}

async function uploadFile(localPath, s3Key) {
    const fileStream = fs.createReadStream(localPath);
    const ext = path.extname(s3Key).toLowerCase();
    const contentTypes = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.mp4': 'video/mp4', '.mov': 'video/quicktime',
        '.webm': 'video/webm',
    };

    await s3.upload({
        Bucket: BUCKET,
        Key: s3Key,
        Body: fileStream,
        ContentType: contentTypes[ext] || 'application/octet-stream',
    }).promise();
}

async function main() {
    console.log(`📂 Scan de ${DATA_DIR}...`);
    const localFiles = getLocalMediaFiles();

    if (!localFiles.length) {
        console.log('ℹ️ Aucun fichier média trouvé dans public/data/.');
        return;
    }

    console.log(`📄 ${localFiles.length} fichier(s) média trouvé(s) localement.`);

    // Préparer le renommage
    const toUpload = [];
    const errors = [];

    for (const file of localFiles) {
        const result = extractTimestamp(file);
        if (!result) {
            errors.push(file);
            continue;
        }
        const ext = path.extname(file).toLowerCase();
        const s3Key = `${result.timestamp}${ext}`;
        toUpload.push({ localFile: file, s3Key, pattern: result.pattern });
    }

    if (errors.length) {
        console.error(`\n⚠️ ${errors.length} fichier(s) ignoré(s) (pattern non reconnu) :`);
        errors.forEach(f => console.error(`   - ${f}`));
    }

    if (!toUpload.length) {
        console.log('ℹ️ Aucun fichier à uploader.');
        return;
    }

    // Récupérer les fichiers déjà sur S3
    console.log('\n🔍 Vérification des fichiers existants sur S3...');
    const existingKeys = await getExistingS3Keys();
    console.log(`   ${existingKeys.size} fichier(s) déjà présent(s) sur S3.`);

    // Filtrer les doublons
    const newFiles = toUpload.filter(f => !existingKeys.has(f.s3Key));
    const skipped = toUpload.filter(f => existingKeys.has(f.s3Key));

    if (skipped.length) {
        console.log(`\n⏭️ ${skipped.length} fichier(s) déjà présent(s) sur S3 :`);
        skipped.forEach(f => console.log(`   - ${f.localFile} → ${f.s3Key}`));
    }

    if (!newFiles.length) {
        console.log('\n✅ Tous les fichiers sont déjà sur S3. Rien à faire.');
        return;
    }

    // Upload
    console.log(`\n🚀 Upload de ${newFiles.length} fichier(s) vers s3://${BUCKET}...`);
    for (const file of newFiles) {
        const localPath = path.join(DATA_DIR, file.localFile);
        process.stdout.write(`   📤 ${file.localFile} → ${file.s3Key} (${file.pattern})...`);
        try {
            await uploadFile(localPath, file.s3Key);
            console.log(' ✅');
        } catch (error) {
            console.log(` ❌ ${error.message}`);
        }
    }

    console.log('\n🎉 Upload terminé.');
}

main().catch(error => {
    console.error('❌ Erreur fatale :', error.message);
    process.exit(1);
});
