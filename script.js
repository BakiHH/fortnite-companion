const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const pageTitle = document.getElementById("pageTitle");
const toast = document.getElementById("toast");
const content = document.querySelector(".content");

// Dashboard als Ausgangszustand speichern
const dashboardHTML = content.innerHTML;

// Datum
function updateDate() {
  const date = new Date();

  document.getElementById("currentDate").textContent =
    new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
}

updateDate();

// Toast-Nachricht
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Seiteninhalte
const pages = {
  "Pirate Tracker": {
    icon: "♜",
    description: "Track your chests, tokens and farming progress.",
    title: "Pirate Tracker",
    cards: [
      ["Chest Counter", "Track opened chests per match."],
      ["Token Progress", "Keep track of your Pirate Token progress."],
      ["Group Farm Calculator", "Analyze your farming efficiency."]
    ]
  },

  "Item Shop": {
    icon: "◇",
    description: "Explore Fortnite cosmetics and shop information.",
    title: "Item Shop",
    cards: [
      ["Current Shop", "View the latest cosmetic offers."],
      ["Skin Database", "Explore Fortnite outfits."],
      ["Favorites", "Keep your favorite cosmetics in one place."]
    ]
  },

  "Player Stats": {
    icon: "▥",
    description: "Analyze your Fortnite performance.",
    title: "Player Statistics",
    cards: [
      ["Player Overview", "Your overall performance."],
      ["K/D Ratio", "Analyze your eliminations and deaths."],
      ["Match History", "Review your previous matches."]
    ]
  },

  "Interactive Map": {
    icon: "◎",
    description: "Discover locations, landing spots and loot routes.",
    title: "Interactive Map",
    cards: [
      ["Battle Royale Map", "Explore the current island."],
      ["Loot Locations", "Discover useful loot locations."],
      ["Landing Spots", "Find your next landing destination."]
    ]
  },

  "Weapon Database": {
    icon: "⚔",
    description: "Explore weapons, damage values and statistics.",
    title: "Weapon Database",
    cards: [
      ["Weapon Overview", "Browse available weapons."],
      ["Damage Comparison", "Compare weapon damage."],
      ["Weapon Rankings", "Discover the strongest weapons."]
    ]
  },

  "News & Updates": {
    icon: "▤",
    description: "Stay up to date with Fortnite news and updates.",
    title: "News & Updates",
    cards: [
      ["Latest News", "Discover the latest announcements."],
      ["Patch Notes", "Explore Fortnite updates."],
      ["Events", "Keep track of upcoming events."]
    ]
  },

  "Settings": {
    icon: "⚙",
    description: "Customize your Fortnite Companion experience.",
    title: "Settings",
    cards: [
      ["Appearance", "Customize your interface."],
      ["Language", "Manage your language preferences."],
      ["About", "Information about Fortnite Companion."]
    ]
  }
};
// Seite anzeigen
function selectPage(page) {
  pageTitle.textContent = page;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  sidebar.classList.remove("open");

  if (page === "Pirate Tracker") {
    renderPirateTracker();
    return;
  }

  if (page === "Dashboard") {
    content.innerHTML = dashboardHTML;
    updateDate();
    showToast("Dashboard opened");
    return;
  }

  const data = pages[page];

  if (!data) return;

  content.innerHTML = `
    <div class="eyebrow">FORTNITE COMPANION / MODULE</div>

    <div class="module-heading">
      <div class="module-icon">${data.icon}</div>
      <div>
        <h1>${data.title}</h1>
        <p>${data.description}</p>
      </div>
    </div>

    <div class="section-heading">
      <div>
        <h2>Overview</h2>
        <p>Explore your ${page} tools.</p>
      </div>
    </div>

    <div class="module-grid">
      ${data.cards.map(card => `
        <div class="module-card">
          <h3>${card[0]}</h3>
          <p>${card[1]}</p>
          <span class="module-coming">COMING SOON</span>
        </div>
      `).join("")}
    </div>

    <footer>
      <span>FORTNITE COMPANION</span>
      <span>NOT AFFILIATED WITH EPIC GAMES</span>
    </footer>
  `;

  showToast(page + " opened");
}

// Navigation
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    selectPage(button.dataset.page);
  });
});

// Quick Access und Explore Button
content.addEventListener("click", event => {
  const quickCard = event.target.closest(".quick-card");

  if (quickCard) {
    selectPage(quickCard.dataset.page);
  }

  if (event.target.closest("#exploreButton")) {
    selectPage("Pirate Tracker");
  }
});

// Mobiles Menü
menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// Profil
document.getElementById("profileButton").addEventListener("click", () => {
  showToast("Profile settings – coming soon!");
});
// ========================================
// PIRATE TRACKER
// ========================================

const PIRATE_STORAGE = "fortnite-companion-pirate-v1";

function loadPirateData() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(PIRATE_STORAGE)
    );

    if (
      saved &&
      Number.isInteger(saved.chests) &&
      saved.chests >= 0 &&
      Array.isArray(saved.history)
    ) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not load Pirate Tracker data", error);
  }

  return {
    chests: 0,
    history: []
  };
}

let pirateData = loadPirateData();

function savePirateData() {
  localStorage.setItem(
    PIRATE_STORAGE,
    JSON.stringify(pirateData)
  );
}

function renderPirateTracker(){
updatePirateTracker();
updateGroupCalculator(); 
  content.innerHTML = `
    <div class="eyebrow">FORTNITE COMPANION / TRACKER</div>

    <div class="module-heading">
      <div class="module-icon">♜</div>
      <div>
        <h1>Pirate Tracker</h1>
        <p>Track your chest farming progress.</p>
      </div>
    </div>

    <div class="pirate-stats">
      <div class="pirate-stat">
        <span>TOTAL CHESTS</span>
        <strong id="totalChests">0</strong>
        <small>Saved rounds</small>
      </div>
      <div class="pirate-stat">
        <span>CURRENT ROUND</span>
        <strong id="roundChests">0</strong>
        <small>Chests this round</small>
      </div>

      <div class="pirate-stat">
        <span>AVERAGE</span>
        <strong id="averageChests">0</strong>
        <small>Chests per round</small>
      </div>
    </div>

    <div class="pirate-layout">

      <section class="pirate-panel">
        <div class="panel-heading">
          <h2>Chest Counter</h2>
          <span class="live-label">LIVE TRACKING</span>
        </div>

        <div class="counter-display">
          <strong id="counterValue">0</strong>
          <span>CHESTS OPENED</span>
        </div>

        <div class="counter-buttons">
          <button class="counter-button" id="addOne">+1 CHEST</button>
          <button class="counter-button" id="addFive">+5 CHESTS</button>
        </div>

        <div class="counter-actions">
          <button id="saveRound" class="save-round">
            Save Round
          </button>
          <button id="resetRound" class="reset-round">
            Reset
          </button>
        </div>

        <p class="tracker-hint">
          Save your round to add it to your statistics.
        </p>
      </section>

      <section class="pirate-panel">
        <div class="panel-heading">
          <h2>Group Farm Calculator</h2>
          <span class="live-label">CALCULATOR</span>
        </div>

        <label class="tracker-label" for="groupSize">
          Number of players
        </label>

        <select id="groupSize" class="tracker-input">
          <option value="1">1 Player</option>
          <option value="2">2 Players</option>
          <option value="3">3 Players</option>
          <option value="4">4 Players</option>
        </select>

        <label class="tracker-label" for="chestsPerPlayer">
          Expected chests per player
        </label>

        <input
          id="chestsPerPlayer"
          class="tracker-input"
          type="number"
          min="0"
          max="10000"
          value="40"
        >

        <div class="calculator-result">
          <span>Estimated group total</span>
          <strong id="groupResult">80</strong>
          <small>Expected chests per round</small>
        </div>
      </section>

    </div>

    <section class="pirate-panel history-panel">
      <div class="panel-heading">
        <div>
          <h2>Round History</h2>
          <p>Your previously saved farming rounds.</p>
        </div>
        <button id="clearHistory" class="reset-round">
          Clear History
        </button>
      </div>

      <div id="roundHistory"></div>
    </section>

    <footer>
      <span>FORTNITE COMPANION</span>
      <span>NOT AFFILIATED WITH EPIC GAMES</span>
    </footer>
  `;

  updatePirateTracker();
}

function updatePirateTracker() {
  const total = pirateData.history.reduce(
    (sum, round) => sum + round.chests,
    0
  );

  const count = pirateData.history.length;

  document.getElementById("totalChests").textContent = total;
  document.getElementById("roundChests").textContent =
    pirateData.chests;

  document.getElementById("counterValue").textContent =
    pirateData.chests;

  document.getElementById("averageChests").textContent =
    count ? Math.round(total / count) : "0";

  const history = document.getElementById("roundHistory");
  if (!count) {
    history.innerHTML = `
      <div class="empty-history">
        No saved rounds yet. Start counting your chests!
      </div>
    `;
  } else {
    history.innerHTML = [...pirateData.history]
      .reverse()
      .map((round, index) => `
        <div class="history-row">
          <span>Round ${count - index}</span>
          <strong>${round.chests} Chests</strong>
          <small>${round.date}</small>
        </div>
      `)
      .join("");
  }
}

function updateGroupCalculator() {
  const players = Number(
    document.getElementById("groupSize").value
  );

  const perPlayer = Number(
    document.getElementById("chestsPerPlayer").value
  );

  const result =
    Number.isFinite(perPlayer) && perPlayer >= 0
      ? players * perPlayer
      : 0;

  document.getElementById("groupResult").textContent =
    Math.round(result).toLocaleString("de-DE");
}

// Tracker interactions
content.addEventListener("click", event => {
  if (!event.target.closest("#addOne") &&
      !event.target.closest("#addFive") &&
      !event.target.closest("#saveRound") &&
      !event.target.closest("#resetRound") &&
      !event.target.closest("#clearHistory")) {
    return;
  }

  if (event.target.closest("#addOne")) {
    pirateData.chests += 1;
  }

  if (event.target.closest("#addFive")) {
    pirateData.chests += 5;
  }

  if (event.target.closest("#saveRound")) {
    if (pirateData.chests === 0) {
      showToast("Add chests before saving!");
      return;
    }

    pirateData.history.push({
      chests: pirateData.chests,
      date: new Date().toLocaleString("de-DE")
    });

    pirateData.chests = 0;
    showToast("Round saved successfully!");
  }

  if (event.target.closest("#resetRound")) {
    pirateData.chests = 0;
    showToast("Current round reset");
  }

  if (event.target.closest("#clearHistory")) {
    if (!confirm("Delete all saved rounds?")) return;

    pirateData.history = [];
    showToast("History cleared");
  }

  savePirateData();
  updatePirateTracker();
});

// Calculator interactions
content.addEventListener("input", event => {
  if (
    event.target.id === "groupSize" ||
    event.target.id === "chestsPerPlayer"
  ) {
    updateGroupCalculator();
  }
});

content.addEventListener("change", event => {
  if (event.target.id === "groupSize") {
    updateGroupCalculator();
  }
});