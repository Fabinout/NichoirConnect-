const fs = require("fs");
const path = require("path");

const MEDIA_DIR = path.join(__dirname, "media/journal");

function getMediaFiles() {
    return new Promise((resolve, reject) => {
        fs.readdir(MEDIA_DIR, (err, files) => {
            if (err) {
                return handleReadError(err, reject);
            }
            resolve(files);
        });
    });
}

function handleReadError(err, reject) {
    console.error("Erreur lors de la lecture des fichiers locaux :", err);
    reject(err);
}

module.exports = {
    getMediaFiles,
};