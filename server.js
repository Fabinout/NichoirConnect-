const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const MEDIA_DIR = path.join(__dirname, "media/journal");

app.use(express.static(path.join(__dirname, "public")));  // Supposons que ton index.html se trouve dans /public
app.use("/media", express.static("media")); // Sert les fichiers médias depuis /media

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/media", (req, res) => {
    fs.readdir(MEDIA_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Impossible de lire le dossier" });
        }
        res.json(files);
    });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
