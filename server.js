require('dotenv').config();
const express = require("express");
const path = require("path");
const { refreshMediaCache, getMediaFromCache } = require("./cacheService");

const app = express();
app.disable('x-powered-by');
const PORT = 3000;

initializeServer();

async function initializeServer() {
    try {
        console.log(`ℹ️ Cache activé : ${process.env.ENABLE_CACHE === 'true' ? 'Oui' : 'Non'}`);
        if (process.env.ENABLE_CACHE === 'true') {
            console.log("🔄 Mise à jour du cache depuis S3...");
            await refreshMediaCache();
        } else {
            console.log("⚠️ Cache désactivé. Les données seront récupérées directement depuis S3.");
        }
        setupRoutes();
        startServer();
    } catch (error) {
        console.error("❌ Erreur lors de l'initialisation du serveur :", error);
        process.exit(1);
    }
}


function setupRoutes() {
    app.get("/api/media/2025", (req, res) => serveMediaCache(2025, res));
    app.get("/api/media/2026", (req, res) => serveMediaCache(2026, res));
    app.get("/api/media", (req, res) => serveMediaCache(2026, res));
    app.use(express.static(getPublicDirectory()));
    app.get("/", serveHomePage);
}

function serveMediaCache(year, res) {
    getMediaFromCache(year)
        .then(mediaList => res.json(mediaList))
        .catch(error => {
            console.error(`❌ Erreur lors de la récupération des données (${year}) :`, error);
            res.status(500).json({ error: "Erreur lors de la récupération des données" });
        });
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
