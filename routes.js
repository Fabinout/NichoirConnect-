const express = require("express");
const path = require("path");
const { getMediaFiles } = require("./mediaHelper");
const { getMediaFromCache } = require("./cacheService");

const router = express.Router();

router.get("/", serveHomePage);
router.get("/api/media", listLocalMediaFiles);
router.get("/api/media/cache", getCachedMedia);

function serveHomePage(req, res) {
    const filePath = path.join(__dirname, "public", "index.html");
    res.sendFile(filePath);
}

async function listLocalMediaFiles(req, res) {
    try {
        const mediaFiles = await getMediaFiles();
        res.json(mediaFiles);
    } catch {
        sendServerError(res, "Impossible de lire le dossier media");
    }
}

function getCachedMedia(req, res) {
    const cachedMedia = getMediaFromCache();
    res.json(cachedMedia);
}

function sendServerError(res, message) {
    res.status(500).json({ error: message });
}

module.exports = router;