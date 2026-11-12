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
