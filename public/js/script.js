document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("journal-container");
    const navContainer = document.getElementById("days-nav");

    if (!container || !navContainer) {
        console.error("Erreur : Les éléments journal-container ou days-nav n'existent pas.");
        return;
    }

    try {
        const response = await fetch("data/journal.json");
        const journalData = await response.json();

        const responseMedia = await fetch("/api/media");
        const mediaFiles = await responseMedia.json();

        let groupedMedia = {};

        mediaFiles.forEach(file => {
            let dateKey = "";
            let timeValue = 0;

            if (file.match(/^\d{13}\.(jpg|mp4)$/)) {
                const timestamp = parseInt(file.split(".")[0], 10);
                const date = new Date(timestamp);
                dateKey = date.toISOString().split("T")[0];
                timeValue = timestamp;
            } else if (file.match(/^\d{8}[_-]\d{6,9}\.(jpg|mp4)$/)) {
                const datePart = file.substring(0, 8);
                const timePart = file.substring(9, 15);
                dateKey = `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;
                timeValue = parseInt(timePart, 10);
            } else if (file.match(/^\d{8}\d{6}\.(jpg|mp4)$/)) {
                const datePart = file.substring(0, 8);
                const timePart = file.substring(8, 14);
                dateKey = `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;
                timeValue = parseInt(timePart, 10);
            } else {
                console.log("Unknown file name :", file)
            }

            if (!groupedMedia[dateKey]) {
                groupedMedia[dateKey] = [];
            }

            groupedMedia[dateKey].push({file, timeValue});
        });

        Object.keys(groupedMedia).forEach(date => {
            groupedMedia[date].sort((a, b) => b.timeValue - a.timeValue);
            groupedMedia[date] = groupedMedia[date].map(item => item.file);
        });

        Object.keys(groupedMedia).sort().reverse().forEach(date => {
            const div = document.createElement("div");
            div.classList.add("journal-entry");

            const description = journalData[date] || "Aucune description disponible.";

            div.innerHTML = `
                <h3>${date}</h3>
                <p>${description}</p>
                <div class="media-container"></div>
            `;

            const mediaContainer = div.querySelector(".media-container");
            groupedMedia[date].forEach(media => {
                if (media.endsWith(".jpg")) {
                    mediaContainer.innerHTML += `<img src="/media/journal/${media}" alt="Observation du ${date}" loading="lazy">`;
                } else if (media.endsWith(".mp4")) {
                    mediaContainer.innerHTML += `
                        <video controls width="100%">
                            <source src="/media/journal/${media}" type="video/mp4">
                            Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                    `;
                }
            });

            container.appendChild(div);

            const navItem = document.createElement("li");
            const frenchDate = date.split('-').reverse().splice(0, 2).join('-');
            const shortDescription = journalData[date] !== undefined? journalData[date] .split('.')[0]:"Aucune description disponible.";
            navItem.innerHTML = `<a href="#${date}">${frenchDate} ${shortDescription}</a>`;
            navContainer.appendChild(navItem);
        });

    } catch (error) {
        console.error("Erreur de chargement des données :", error);
    }
});