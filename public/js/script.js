document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("journal-container");
    const navContainer = document.getElementById("days-nav");

    if (!container || !navContainer) return;

    try {
        const journalData = await fetchJson("data/journal.json");
        const mediaFiles = await fetchJson("/api/media");

        const groupedMedia = groupMediaByDate(mediaFiles);

        renderJournalEntries(groupedMedia, journalData, container);
        renderNavigation(groupedMedia, journalData, navContainer);

    } catch (error) {
        console.error("Erreur de chargement des données :", error);
    }
});

async function fetchJson(url) {
    const response = await fetch(url);
    return await response.json();
}

function groupMediaByDate(mediaFiles) {
    const groupedMedia = {};

    mediaFiles.forEach(file => {
        const dateMatch = extractDate(file.key);

        if (dateMatch) {
            const date = formatDate(dateMatch);
            if (!groupedMedia[date]) groupedMedia[date] = [];
            groupedMedia[date].push({ url: file.url, key: file.key });
        }
    });

    return groupedMedia;
}

function extractDate(fileKey) {
    const match = fileKey.match(/^(\d{4})(\d{2})(\d{2})/);
    return match ? { year: match[1], month: match[2], day: match[3] } : null;
}

function formatDate({ year, month, day }) {
    return `${year}-${month}-${day}`;
}

function renderJournalEntries(groupedMedia, journalData, container) {
    Object.keys(groupedMedia).sort().reverse().forEach(date => {
        const journalEntry = createJournalEntry(date, groupedMedia[date], journalData[date]);
        container.appendChild(journalEntry);
    });
}

function createJournalEntry(date, mediaList, description = "Aucune description disponible.") {
        const entry = document.createElement("div");
        entry.classList.add("journal-entry");
        entry.id = date;

        // Créer le conteneur sticky pour le titre et la description
        const stickyContainer = document.createElement("div");
        stickyContainer.classList.add("sticky-container");

        // Ajouter le titre (h3) et la description (p) dans le conteneur sticky
        const title = document.createElement("h3");
        title.textContent = date;

        const desc = document.createElement("p");
        desc.textContent = description;

        stickyContainer.appendChild(title);
        stickyContainer.appendChild(desc);

        // Ajouter le conteneur sticky à l'entrée de journal
        entry.appendChild(stickyContainer);

        // Créer et remplir le conteneur des médias
        const mediaContainer = document.createElement("div");
        mediaContainer.classList.add("media-container");

        mediaList.forEach(media => {
            const mediaElement = createMediaElement(media, date);
            if (mediaElement) mediaContainer.innerHTML += mediaElement;
        });

        // Ajouter le conteneur des médias à l'entrée de journal
        entry.appendChild(mediaContainer);

        return entry;

    }

function createMediaElement(media, date) {
    if (media.key.endsWith(".jpg") || media.key.endsWith(".png")) {
        return `<img src="${media.url}" alt="Observation du ${date}" loading="lazy">`;
    }
    if (media.key.endsWith(".mp4")) {
        return `
           <video controls width="100%"  preload="none">
                <source src="${media.url}" type="video/mp4">
                Votre navigateur ne supporte pas la lecture de vidéos.
            </video>`;
    }
    return null;
}

function renderNavigation(groupedMedia, journalData, navContainer) {
    Object.keys(groupedMedia).sort().reverse().forEach(date => {
        const navItem = createNavigationItem(date, journalData[date]);
        navContainer.appendChild(navItem);
    });
}

function createNavigationItem(date, description = "Aucune description disponible.") {
    const navItem = document.createElement("li");
    const frenchDate = date.split('-').reverse().splice(0, 2).join('-');
    const shortDescription = description.split('.')[0] || "Aucune description disponible.";

    navItem.innerHTML = `<a href="#${date}">${frenchDate} ${shortDescription}</a>`;
    return navItem;
}
