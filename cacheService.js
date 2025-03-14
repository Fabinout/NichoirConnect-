const NodeCache = require("node-cache");
const { listS3Objects, getSignedUrl } = require("./s3Service");

const CACHE_KEY = 'mediaList';
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Vérifie si le cache est activé
const isCacheEnabled = process.env.ENABLE_CACHE === 'true';

async function refreshMediaCache() {
    if (!isCacheEnabled) {
        console.log("⚠️ Cache désactivé. Ignorer la mise à jour.");
        return;
    }

    try {
        console.log("🔄 Chargement de médias depuis S3...");
        const files = await fetchS3Files();
        if (!files.length) {
            resetCache();
            return;
        }

        const mediaUrls = mapFilesToSignedUrls(files);
        updateCache(mediaUrls);
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du cache :", error);
        handleError(error);
    }
}

function fetchS3Files() {
    return listS3Objects();
}

function mapFilesToSignedUrls(files) {
    return files.map(file => ({
        key: file.Key,
        url: getSignedUrl(file.Key),
    }));
}

function updateCache(mediaUrls) {
    if (!isCacheEnabled) {
        console.log("⚠️ Cache désactivé. Modification du cache ignorée.");
        return;
    }
    cache.set(CACHE_KEY, mediaUrls);
}

function resetCache() {
    if (!isCacheEnabled) {
        console.log("⚠️ Cache désactivé. Réinitialisation ignorée.");
        return;
    }
    cache.set(CACHE_KEY, []);
}

function handleError(error) {
    console.error("Erreur lors de la mise à jour du cache :", error);
    throw error;
}

function getMediaFromCache() {
    if (!isCacheEnabled) {
        console.log("⚠️ Cache désactivé. Aucune donnée lue depuis le cache.");
        return [];
    }
    console.log("📂 Lecture depuis le cache :", cache.keys());
    return cache.get(CACHE_KEY) || [];
}

module.exports = {
    refreshMediaCache,
    getMediaFromCache,
};