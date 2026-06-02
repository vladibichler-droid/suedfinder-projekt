const savedTourId = localStorage.getItem("suedfinderSelectedTourId");

let currentTour =
    tourData.tours.find(tour => tour.id === Number(savedTourId)) ||
    tourData.tours[0];

let deliveryPoints = currentTour.points;

let currentFilter = "all";
let priorityFilter = "all";
let searchTerm = "";

const deliveryList = document.getElementById("deliveryList");
const todayDate = document.getElementById("todayDate");
const doneCount = document.getElementById("doneCount");
const totalCount = document.getElementById("totalCount");
const progressFill = document.getElementById("progressFill");
const tourArea = document.getElementById("tourArea");
const searchInput = document.getElementById("searchInput");
const tourSelect = document.getElementById("tourSelect");

const openCount = document.getElementById("openCount");
const statsDoneCount = document.getElementById("statsDoneCount");
const successRate = document.getElementById("successRate");
const tourStatusText = document.getElementById("tourStatusText");

const showAllButton = document.getElementById("showAllButton");
const showOpenButton = document.getElementById("showOpenButton");
const showDoneButton = document.getElementById("showDoneButton");
const showNormalButton = document.getElementById("showNormalButton");
const showImportantButton = document.getElementById("showImportantButton");
const showCriticalButton = document.getElementById("showCriticalButton");
const resetButton = document.getElementById("resetButton");

function getDoneStorageKey() {
    return `suedfinderDoneItemsTour${currentTour.id}`;
}

function getNotesStorageKey() {
    return `suedfinderNotesTour${currentTour.id}`;
}

function loadDoneItems() {
    const savedItems = localStorage.getItem(getDoneStorageKey());

    if (!savedItems) {
        return [];
    }

    return JSON.parse(savedItems);
}

function saveDoneItems(doneItems) {
    localStorage.setItem(getDoneStorageKey(), JSON.stringify(doneItems));
}

function loadSavedNotes() {
    const savedNotes = localStorage.getItem(getNotesStorageKey());

    if (!savedNotes) {
        return {};
    }

    return JSON.parse(savedNotes);
}

function saveNote(pointId, noteText) {
    const savedNotes = loadSavedNotes();

    savedNotes[pointId] = noteText;

    localStorage.setItem(getNotesStorageKey(), JSON.stringify(savedNotes));
}

function getPointNote(point) {
    const savedNotes = loadSavedNotes();

    if (savedNotes[point.id] !== undefined) {
        return savedNotes[point.id];
    }

    return point.note;
}

function saveSelectedTour() {
    localStorage.setItem("suedfinderSelectedTourId", String(currentTour.id));
}

function isDone(id) {
    const doneItems = loadDoneItems();
    return doneItems.includes(id);
}

function setTourArea() {
    tourArea.textContent = `${currentTour.area} – ${currentTour.name}`;
}

function setTodayDate() {
    const date = new Date();

    todayDate.textContent = date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function updateProgress() {
    const doneItems = loadDoneItems();
    const total = deliveryPoints.length;
    const done = doneItems.length;
    const open = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    doneCount.textContent = done;
    totalCount.textContent = total;
    progressFill.style.width = `${percent}%`;

    openCount.textContent = open;
    statsDoneCount.textContent = done;
    successRate.textContent = `${percent} %`;

    if (total > 0 && done === total) {
        tourStatusText.textContent = "✅ Tour abgeschlossen. Alle Zustellpunkte sind erledigt.";
        tourStatusText.classList.add("finished");
    } else if (total === 0) {
        tourStatusText.textContent = "Diese Tour hat noch keine Zustellpunkte.";
        tourStatusText.classList.remove("finished");
    } else {
        tourStatusText.textContent = "Tour ist noch nicht abgeschlossen.";
        tourStatusText.classList.remove("finished");
    }
}

function getFilteredPoints() {
    let points = [...deliveryPoints];

    if (currentFilter === "open") {
        points = points.filter(point => !isDone(point.id));
    }

    if (currentFilter === "done") {
        points = points.filter(point => isDone(point.id));
    }

    if (priorityFilter !== "all") {
        points = points.filter(point => point.priority === priorityFilter);
    }

    if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();

        points = points.filter(point =>
            point.street.toLowerCase().includes(term) ||
            point.houseNumber.toLowerCase().includes(term) ||
            point.deliveryType.toLowerCase().includes(term) ||
            getPointNote(point).toLowerCase().includes(term) ||
            point.info.toLowerCase().includes(term)
        );
    }

    return points;
}

function groupPointsByStreet(points) {
    const groups = {};

    points.forEach(point => {
        if (!groups[point.street]) {
            groups[point.street] = [];
        }

        groups[point.street].push(point);
    });

    return groups;
}

function getPriorityText(priority) {
    if (priority === "critical") {
        return "🔴 Sehr wichtig";
    }

    if (priority === "important") {
        return "🟡 Wichtig";
    }

    return "🟢 Normal";
}

function renderDeliveryItem(point) {
    const done = isDone(point.id);
    const currentNote = getPointNote(point);

    const item = document.createElement("article");
    item.className = done ? "delivery-item done" : "delivery-item";

    item.innerHTML = `
        <div class="delivery-top">
            <div>
                <p class="delivery-address">${point.street} ${point.houseNumber}</p>
                <p class="delivery-details">${point.info}</p>
                <p class="delivery-details">Zustellart: ${point.deliveryType}</p>
                <p class="delivery-details">${getPriorityText(point.priority)}</p>
            </div>

            <span class="status-badge">
                ${done ? "Erledigt" : "Offen"}
            </span>
        </div>

        <div class="note-editor-box">
            <label class="note-label" for="note-${point.id}">
                Notiz bearbeiten
            </label>

            <textarea
                id="note-${point.id}"
                class="note-input"
                data-note-id="${point.id}"
                placeholder="Notiz eintragen..."
            >${currentNote}</textarea>

            <p class="note-save-info">
                Wird automatisch gespeichert.
            </p>
        </div>

        <div class="item-actions">
            <button class="${done ? "open-button" : "done-button"}" data-id="${point.id}">
                ${done ? "Wieder offen" : "Erledigt"}
            </button>
        </div>
    `;

    return item;
}

function renderList() {
    deliveryList.innerHTML = "";

    const points = getFilteredPoints();

    if (points.length === 0) {
        deliveryList.innerHTML = `
            <div class="delivery-item">
                <p>Keine Zustellpunkte für diese Ansicht gefunden.</p>
            </div>
        `;
        return;
    }

    const groupedPoints = groupPointsByStreet(points);

    Object.keys(groupedPoints).forEach(street => {
        const streetGroup = document.createElement("div");
        streetGroup.className = "street-group";

        const streetTitle = document.createElement("div");
        streetTitle.className = "street-title";

        streetTitle.innerHTML = `
            <h3>${street}</h3>
            <span class="street-count">${groupedPoints[street].length} Zustellpunkte</span>
        `;

        streetGroup.appendChild(streetTitle);

        groupedPoints[street].forEach(point => {
            streetGroup.appendChild(renderDeliveryItem(point));
        });

        deliveryList.appendChild(streetGroup);
    });
}

function toggleDone(id) {
    const doneItems = loadDoneItems();

    if (doneItems.includes(id)) {
        const newDoneItems = doneItems.filter(itemId => itemId !== id);
        saveDoneItems(newDoneItems);
    } else {
        doneItems.push(id);
        saveDoneItems(doneItems);
    }

    updateProgress();
    renderList();
}

function renderTourOptions() {
    tourSelect.innerHTML = "";

    tourData.tours.forEach(tour => {
        const option = document.createElement("option");
        option.value = tour.id;
        option.textContent = tour.name;

        tourSelect.appendChild(option);
    });

    tourSelect.value = currentTour.id;
}

function changeTour(tourId) {
    const selectedTour = tourData.tours.find(tour => tour.id === Number(tourId));

    if (!selectedTour) {
        return;
    }

    currentTour = selectedTour;
    deliveryPoints = currentTour.points;

    currentFilter = "all";
    priorityFilter = "all";
    searchTerm = "";
    searchInput.value = "";

    saveSelectedTour();
    setTourArea();
    updateProgress();
    renderList();
}

deliveryList.addEventListener("click", function(event) {
    if (event.target.tagName !== "BUTTON") {
        return;
    }

    const id = Number(event.target.dataset.id);
    toggleDone(id);
});

deliveryList.addEventListener("input", function(event) {
    if (!event.target.classList.contains("note-input")) {
        return;
    }

    const pointId = event.target.dataset.noteId;
    const noteText = event.target.value;

    saveNote(pointId, noteText);
});

tourSelect.addEventListener("change", function() {
    changeTour(tourSelect.value);
});

searchInput.addEventListener("input", function() {
    searchTerm = searchInput.value;
    renderList();
});

showAllButton.addEventListener("click", function() {
    currentFilter = "all";
    priorityFilter = "all";
    renderList();
});

showOpenButton.addEventListener("click", function() {
    currentFilter = "open";
    priorityFilter = "all";
    renderList();
});

showDoneButton.addEventListener("click", function() {
    currentFilter = "done";
    priorityFilter = "all";
    renderList();
});

showNormalButton.addEventListener("click", function() {
    currentFilter = "all";
    priorityFilter = "normal";
    renderList();
});

showImportantButton.addEventListener("click", function() {
    currentFilter = "all";
    priorityFilter = "important";
    renderList();
});

showCriticalButton.addEventListener("click", function() {
    currentFilter = "all";
    priorityFilter = "critical";
    renderList();
});

resetButton.addEventListener("click", function() {
    localStorage.removeItem(getDoneStorageKey());
    updateProgress();
    renderList();
});

renderTourOptions();
setTourArea();
setTodayDate();
updateProgress();
renderList();