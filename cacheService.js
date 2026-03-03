const NodeCache = require("node-cache");
const { listS3Objects, getSignedUrl } = require("./s3Service");

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const isCacheEnabled = process.env.ENABLE_CACHE === 'true';

const YEARS = [2025, 2026];

function cacheKey(year) {
    return `media_${year}`;
}

async function refreshMediaCache() {
    if (!isCacheEnabled) {
        console.log("⚠️ Cache désactivé. Ignorer la mise à jour.");
        return;
    }

    for (const year of YEARS) {
        try {
            console.log(`🔄 Chargement des médias ${year} depuis S3...`);
            const files = await listS3Objects(year);
            if (!files.length) {
                cache.set(cacheKey(year), []);
                continue;
            }
            const mediaUrls = files.map(file => ({
                key: file.Key,
                url: getSignedUrl(year, file.Key),
            }));
            cache.set(cacheKey(year), mediaUrls);
        } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour du cache ${year} :`, error);
            throw error;
        }
    }
}

async function getMediaFromCache(year) {
    if (!isCacheEnabled) {
        console.log(`⚠️ Cache désactivé. Récupération ${year} directement depuis S3...`);
        const files = await listS3Objects(year);
        return files.map(file => ({
            key: file.Key,
            url: getSignedUrl(year, file.Key),
        }));
    }
    console.log(`📂 Lecture depuis le cache (${year}) :`, cache.keys());
    return cache.get(cacheKey(year)) || [];
}

module.exports = {
    refreshMediaCache,
    getMediaFromCache,
};
