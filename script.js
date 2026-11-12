const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const pageTitle = document.getElementById("pageTitle");
const toast = document.getElementById("toast");

// Datum anzeigen
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

// Navigation
function selectPage(page) {
  pageTitle.textContent = page;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  sidebar.classList.remove("open");

  if (page === "Dashboard") {
    showToast("Dashboard geöffnet");
  } else {
    showToast(page + " – Modul kommt als Nächstes!");
  }
}

// Sidebar-Navigation
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    selectPage(button.dataset.page);
  });
});

// Quick Access
document.querySelectorAll(".quick-card").forEach(button => {
  button.addEventListener("click", () => {
    selectPage(button.dataset.page);
  });
});

// Mobiles Menü
menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// Hero-Button
document.getElementById("exploreButton").addEventListener("click", () => {
  selectPage("Pirate Tracker");
});