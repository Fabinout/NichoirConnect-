require('dotenv').config();
const express = require("express");
const path = require("path");
const { refreshMediaCache, getMediaFromCache } = require("./cacheService");

const app = express();
const PORT = 3000;

initializeServer();

async function initializeServer() {
    try {
        if (process.env.ENABLE_CACHE === 'true') {
            console.log("🔄 Mise à jour du cache depuis S3...");
            await refreshMediaCache();
        } else {
            console.log("⚠️ Cache désactivé. Aucune mise à jour nécessaire.");
        }
        setupRoutes();
        startServer();
    } catch (error) {
        console.error("❌ Erreur lors de l'initialisation du serveur :", error);
        process.exit(1); // Arrête le processus en cas d'échec critique
    }
}

function setupRoutes() {
    app.get("/api/media", serveMediaCache);
    app.use(express.static(getPublicDirectory()));
    app.get("/", serveHomePage);
}

function serveMediaCache(req, res) {
    const mediaList = getMediaFromCache();
    res.json(mediaList);
}

function serveHomePage(req, res) {
    res.sendFile(path.join(getPublicDirectory(), "index.html"));
}

function getPublicDirectory() {
    return path.join(__dirname, "public");
}

function startServer() {
    app.listen(PORT, () => {
        console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    });
}