const NodeCache = require("node-cache");
const { listS3Objects, getSignedUrl } = require("./s3Service");

const CACHE_KEY = 'mediaList';
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

async function refreshMediaCache() {
    try {
        const files = await fetchS3Files();
        if (!files.length) {
            resetCache();
            return;
        }

        const mediaUrls = mapFilesToSignedUrls(files);
        updateCache(mediaUrls);
    } catch (error) {
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
    cache.set(CACHE_KEY, mediaUrls);
}

function resetCache() {
    cache.set(CACHE_KEY, []);
}

function handleError(error) {
    console.error("Erreur lors de la mise à jour du cache :", error);
    throw error;
}

function getMediaFromCache() {
    return cache.get(CACHE_KEY) || [];
}

module.exports = {
    refreshMediaCache,
    getMediaFromCache,
};