const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");
const toast = document.getElementById("toast");
const STORAGE_KEY = "fortniteCompanionPirateTrackerV1";

const defaultState = { totalChests: 0, totalTokens: 0, rounds: [], groupSize: 2, players: 2, chestsPerPlayer: 25 };
let trackerState = loadState();

function loadState(){
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return { ...defaultState }; }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerState)); }
function showToast(message){
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}
function updateDate(){
  const el = document.getElementById("currentDate");
  if(el) el.textContent = new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
}
function setActivePage(page){
  document.querySelectorAll(".nav-item[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  pageTitle.textContent = page;
  sidebar.classList.remove("open");
}
function selectPage(page){
  setActivePage(page);
  if(page === "Dashboard"){ renderDashboard(); return; }
  if(page === "Pirate Tracker"){ renderPirateTracker(); return; }
  if(page === "Item Shop"){ renderItemShop(); return; }
  renderPlaceholder(page);
}
function renderDashboard(){
  content.innerHTML = `
    <div class="welcome"><div><div class="eyebrow">YOUR FORTNITE HUB</div><h1>Welcome to <span>Companion.</span></h1><p>Everything Fortnite. All in one place.</p></div><div class="date-card"><span>HEUTE</span><strong id="currentDate">--.--.----</strong></div></div>
    <div class="hero"><div class="hero-content"><div class="hero-tag">YOUR ULTIMATE FORTNITE HUB</div><h2>Level up your<br>Fortnite experience.</h2><p>Stats, tools, loot and everything you need<br class="desktop-only"> to stay ahead of the game.</p><button class="primary-button" id="exploreButton">Explore Companion <span>→</span></button></div><div class="hero-decoration">FC</div></div>
    <div class="section-heading"><div><h2>Quick Access</h2><p>Jump straight into your favorite tools.</p></div></div>
    <div class="quick-grid">
      <button class="quick-card" data-page="Pirate Tracker"><div class="quick-icon pirate">♜</div><div><h3>Pirate Tracker</h3><p>Track chests and treasures</p></div><span class="arrow">↗</span></button>
      <button class="quick-card" data-page="Item Shop"><div class="quick-icon shop">◇</div><div><h3>Item Shop</h3><p>Explore cosmetics</p></div><span class="arrow">↗</span></button>
      <button class="quick-card" data-page="Player Stats"><div class="quick-icon stats">▥</div><div><h3>Player Stats</h3><p>Analyze your performance</p></div><span class="arrow">↗</span></button>
      <button class="quick-card" data-page="Interactive Map"><div class="quick-icon map">◎</div><div><h3>Interactive Map</h3><p>Discover locations</p></div><span class="arrow">↗</span></button>
    </div>
    <div class="section-heading"><div><h2>Platform Overview</h2><p>Your companion at a glance.</p></div></div>
    <div class="stats-grid"><div class="stat-card"><span class="stat-label">TOOLS</span><strong>06</strong><span class="stat-note">Planned modules</span></div><div class="stat-card"><span class="stat-label">GAME MODE</span><strong>ZERO BUILD</strong><span class="stat-note">Focus mode</span></div><div class="stat-card"><span class="stat-label">VERSION</span><strong>1.1.0</strong><span class="stat-note">Companion update</span></div></div>
    <footer><span>FORTNITE COMPANION</span><span>NOT AFFILIATED WITH EPIC GAMES</span></footer>`;
  updateDate();
}

// Public third-party API. Availability and browser CORS are controlled by the provider.
const SHOP_URL = "https://fortnite-api.com/v2/shop?language=de";
let shopEntries = [];
let shopTimer = null;
let shopRequestId = 0;
function renderItemShop(){
  clearInterval(shopTimer);
  content.innerHTML = `<div class="page-header shop-heading"><div><div class="eyebrow">LIVE SHOP</div><h1>Fortnite Item Shop</h1><p>Aktuelle Angebote, Bilder und V-Bucks-Preise. Automatische Prüfung alle 5 Minuten, solange diese Seite geöffnet ist.</p></div><button class="btn primary" id="refreshShop">↻ Aktualisieren</button></div>
  <div class="panel-card shop-info"><div><strong id="shopStatus">Shop wird geladen …</strong><p id="shopDate">Daten werden abgerufen.</p></div><strong id="shopCount">–</strong></div>
  <div class="shop-filters"><input id="shopSearch" type="search" placeholder="Cosmetics suchen …" aria-label="Cosmetics suchen"><select id="shopSort" aria-label="Sortierung"><option value="default">Shop-Reihenfolge</option><option value="az">Name A–Z</option><option value="low">Preis aufsteigend</option><option value="high">Preis absteigend</option></select></div>
  <div id="shopResults" class="shop-results"><div class="panel-card">Lade Angebote …</div></div>
  <p class="shop-source">Quelle: Fortnite-API.com (Drittanbieter). Keine Verbindung zu Epic Games.</p><footer><span>FORTNITE COMPANION</span><span>NOT AFFILIATED WITH EPIC GAMES</span></footer>`;
  document.getElementById('refreshShop').addEventListener('click',()=>loadShop(true));
  document.getElementById('shopSearch').addEventListener('input',displayShop);
  document.getElementById('shopSort').addEventListener('change',displayShop);
  loadShop(false);
  shopTimer=setInterval(()=>{if(document.getElementById('shopResults'))loadShop(false);else clearInterval(shopTimer);},300000);
}
async function loadShop(manual){
  const id=++shopRequestId;
  const button=document.getElementById('refreshShop');
  if(!button)return;
  button.disabled=true;
  document.getElementById('shopStatus').textContent='Shop wird aktualisiert …';
  try{
    const response=await fetch(SHOP_URL,{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const payload=await response.json();
    if(!Array.isArray(payload?.data?.entries))throw new Error('Unbekanntes Datenformat');
    if(id!==shopRequestId||!document.getElementById('shopResults'))return;
    shopEntries=payload.data.entries;
    document.getElementById('shopStatus').textContent='Shop-Daten geladen';
    const shopDate=payload.data.date;
    const validDate=shopDate&&!Number.isNaN(Date.parse(shopDate));
    document.getElementById('shopDate').textContent=(validDate?'Shop-Stand: '+new Date(shopDate).toLocaleString('de-DE')+' · ':'')+'Abgerufen: '+new Date().toLocaleString('de-DE');
    document.getElementById('shopCount').textContent=shopEntries.length+' Angebote';
    displayShop();
    if(manual)showToast('Shop aktualisiert.');
  }catch(error){
    if(id!==shopRequestId||!document.getElementById('shopResults'))return;
    document.getElementById('shopStatus').textContent='Shop aktuell nicht erreichbar';
    document.getElementById('shopDate').textContent='Die externe API ist nicht erreichbar oder blockiert Browser-Anfragen ('+error.message+').';
    if(!shopEntries.length)document.getElementById('shopResults').innerHTML='<div class="panel-card"><h2>Keine Shop-Daten</h2><p>Bitte später erneut versuchen. Bei einer lokal geöffneten HTML-Datei kann der Browser API-Anfragen einschränken. Ein lokaler Entwicklungsserver oder GitHub Pages kann helfen.</p></div>';
    if(manual)showToast('Shop-Aktualisierung fehlgeschlagen.');
  }finally{if(id===shopRequestId&&document.getElementById('refreshShop'))document.getElementById('refreshShop').disabled=false;}
}
function shopName(entry){return entry.bundle?.name||entry.items?.map(x=>x.name).filter(Boolean).join(' + ')||'Unbekanntes Angebot';}
function shopPrice(entry){return Number(entry.finalPrice??entry.regularPrice??entry.items?.[0]?.price?.final??0);}
function displayShop(){
  const target=document.getElementById('shopResults');if(!target)return;
  const search=(document.getElementById('shopSearch')?.value||'').toLocaleLowerCase('de');
  const sort=document.getElementById('shopSort')?.value||'default';
  let entries=shopEntries.filter(e=>(shopName(e)+' '+(e.section?.name||'')).toLocaleLowerCase('de').includes(search));
  if(sort==='az')entries.sort((a,b)=>shopName(a).localeCompare(shopName(b),'de'));
  if(sort==='low')entries.sort((a,b)=>shopPrice(a)-shopPrice(b));
  if(sort==='high')entries.sort((a,b)=>shopPrice(b)-shopPrice(a));
  if(!entries.length){target.innerHTML='<div class="panel-card">Keine passenden Angebote gefunden.</div>';return;}
  const groups=new Map();
  for(const entry of entries){const section=entry.section?.name||'Weitere Angebote';if(!groups.has(section))groups.set(section,[]);groups.get(section).push(entry);}
  target.innerHTML=[...groups].map(([section,offers])=>`<section class="shop-section"><div class="shop-section-heading"><h2>${escapeHTML(section)}</h2><span>${offers.length} Angebote</span></div><div class="shop-grid">${offers.map(entry=>{
    const item=entry.items?.[0]||{};
    const img=entry.bundle?.image||item.images?.featured||item.images?.icon||item.images?.smallIcon||'';
    const safeImg=typeof img==='string'&&/^https:\/\//.test(img)?escapeHTML(img):'';
    const rarity=item.series?.name||item.rarity?.name||'Cosmetic';
    const price=entry.finalPrice??entry.regularPrice;
    return `<article class="shop-card"><div class="shop-art">${safeImg?`<img loading="lazy" src="${safeImg}" alt="${escapeHTML(shopName(entry))}">`:'<span>FC</span>'}</div><div class="shop-card-body"><small>${escapeHTML(rarity)}</small><h3>${escapeHTML(shopName(entry))}</h3><strong>${price==null?'Preis nicht verfügbar':Number(price).toLocaleString('de-DE')+' V-Bucks'}</strong></div></article>`;
  }).join('')}</div></section>`).join('');
}

function renderPlaceholder(page){
  const descriptions = {
    "Item Shop":"Hier entsteht eine Übersicht des aktuellen Fortnite Item Shops.",
    "Player Stats":"Bereite deine Spielerstatistiken und Performance-Auswertung vor.",
    "Interactive Map":"Hier entsteht eine interaktive Karte mit wichtigen Fundorten.",
    "Weapon Database":"Waffenwerte, Seltenheiten und Vergleiche an einem Ort.",
    "News & Updates":"Aktuelle Fortnite-News und Update-Informationen.",
    "Settings":"Einstellungen für deinen Fortnite Companion."
  };
  content.innerHTML = `<div class="page-header"><div class="eyebrow">FORTNITE COMPANION</div><h1>${escapeHTML(page)}</h1><p>${descriptions[page] || "Dieser Bereich wird vorbereitet."}</p></div><div class="placeholder-grid"><div class="panel-card"><h2>Coming soon</h2><p class="muted">Dieser Bereich wird in einem kommenden Update mit Funktionen gefüllt.</p></div><div class="panel-card"><h2>Dein Companion</h2><p class="muted">Die Navigation ist bereits aktiv. Deine Pirate-Tracker-Daten bleiben lokal auf diesem Gerät gespeichert.</p></div></div><footer><span>FORTNITE COMPANION</span><span>NOT AFFILIATED WITH EPIC GAMES</span></footer>`;
}
function escapeHTML(value){ return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }

function renderPirateTracker(){
  content.innerHTML = `
    <div class="page-header"><div class="eyebrow">ZERO BUILD • LOOT TRACKING</div><h1>Pirate Tracker</h1><p>Erfasse deine geöffneten Truhen und gefundenen Schätze und behalte deine Farm-Runden im Blick.</p></div>
    <div class="tracker-grid">
      <div class="metric-card"><span class="metric-label">GESAMT GEÖFFNETE TRUHEN</span><strong id="totalChests">0</strong><small>Über alle gespeicherten Runden</small></div>
      <div class="metric-card"><span class="metric-label">GEFUNDENE SCHÄTZE</span><strong id="totalTokens">0</strong><small>Manuell erfasste Schätze</small></div>
      <div class="metric-card"><span class="metric-label">GESPEICHERTE RUNDEN</span><strong id="roundCount">0</strong><small>Dein persönlicher Verlauf</small></div>
    </div>
    <div class="panel-card">
      <h2>Runde erfassen</h2><p>Trage ein, wie viele Truhen und Schätze ihr in dieser Runde gefunden habt.</p>
      <div class="form-grid">
        <div class="field"><label for="roundChests">Geöffnete Truhen</label><input id="roundChests" type="number" min="0" max="999" value="0"></div>
        <div class="field"><label for="roundTokens">Gefundene Schätze</label><input id="roundTokens" type="number" min="0" max="99" value="0"></div>
        <div class="field"><label for="roundPlayers">Aktive Spieler</label><select id="roundPlayers"><option value="1" selected>1 Spieler</option><option value="2">2 Spieler (Duo)</option><option value="3">3 Spieler</option><option value="4">4 Spieler</option></select></div>
      </div>
      <div class="action-row"><button class="btn primary" id="saveRound">Runde speichern</button><button class="btn" id="addChest">+1 Truhe</button><button class="btn" id="addFiveChests">+5 Truhen</button></div>
      <div class="result-line" id="roundFeedback">Deine Einträge werden lokal in diesem Browser gespeichert.</div>
    </div>
    <div class="panel-card">
      <h2>Group Farm Calculator</h2><p>Berechne die erwartete Truhenmenge einer Gruppe anhand eurer durchschnittlichen Funde pro Spieler.</p>
      <div class="form-grid">
        <div class="field"><label for="groupPlayers">Spieler in der Gruppe</label><input id="groupPlayers" type="number" min="1" max="4" value="${trackerState.groupSize}"></div>
        <div class="field"><label for="chestsPerPlayer">Truhen pro Spieler</label><input id="chestsPerPlayer" type="number" min="0" max="200" value="25"></div>
        <div class="field"><label for="groupRuns">Anzahl der Runden</label><input id="groupRuns" type="number" min="1" max="100" value="1"></div>
      </div>
      <div class="result-line" id="groupResult"></div>
    </div>
    <div class="panel-card">
      <div class="section-heading" style="margin-top:0"><div><h2>Rundenverlauf</h2><p>Deine zuletzt gespeicherten Farm-Runden.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>DATUM</th><th>TRUHEN</th><th>SCHÄTZE</th><th>SPIELER</th><th>AKTION</th></tr></thead><tbody id="roundHistory"></tbody></table></div>
      <div class="action-row"><button class="btn danger" id="clearHistory">Verlauf löschen</button></div>
    </div>
    <footer><span>FORTNITE COMPANION</span><span>TRACKER-DATEN BLEIBEN AUF DIESEM GERÄT</span></footer>`;
  updatePirateTracker();
  updateGroupCalculator();
  document.getElementById("saveRound").addEventListener("click", saveRound);
  document.getElementById("addChest").addEventListener("click", () => adjustChest(1));
  document.getElementById("addFiveChests").addEventListener("click", () => adjustChest(5));
  ["groupPlayers","chestsPerPlayer","groupRuns"].forEach(id => document.getElementById(id).addEventListener("input", updateGroupCalculator));
  document.getElementById("clearHistory").addEventListener("click", clearHistory);
}
function updatePirateTracker(){
  const totalChests = trackerState.rounds.reduce((sum,r)=>sum+r.chests,0);
  const totalTokens = trackerState.rounds.reduce((sum,r)=>sum+r.tokens,0);
  document.getElementById("totalChests").textContent = totalChests.toLocaleString("de-DE");
  document.getElementById("totalTokens").textContent = totalTokens.toLocaleString("de-DE");
  document.getElementById("roundCount").textContent = trackerState.rounds.length;
  const tbody = document.getElementById("roundHistory");
  if(!trackerState.rounds.length){tbody.innerHTML='<tr><td colspan="5" class="empty-state">Noch keine Runden gespeichert.</td></tr>';return;}
  tbody.innerHTML = [...trackerState.rounds].reverse().map(round=>`<tr><td>${escapeHTML(round.date)}</td><td>${round.chests}</td><td>${round.tokens}</td><td>${round.players}</td><td><button class="btn danger delete-round" data-id="${round.id}">Löschen</button></td></tr>`).join("");
  tbody.querySelectorAll(".delete-round").forEach(btn=>btn.addEventListener("click",()=>deleteRound(btn.dataset.id)));
}
function saveRound(){
  const chests = Math.max(0,Math.min(999,Number(document.getElementById("roundChests").value)||0));
  const tokens = Math.max(0,Math.min(99,Number(document.getElementById("roundTokens").value)||0));
  const players = Number(document.getElementById("roundPlayers").value)||2;
  trackerState.rounds.push({id:Date.now().toString(),date:new Intl.DateTimeFormat("de-DE",{dateStyle:"short",timeStyle:"short"}).format(new Date()),chests,tokens,players});
  saveState(); updatePirateTracker();
  document.getElementById("roundFeedback").innerHTML = `Gespeichert: <strong>${chests} Truhen</strong>, <strong>${tokens} Schätze</strong> bei ${players} Spieler(n).`;
  showToast("Runde wurde gespeichert.");
}
function adjustChest(amount){
  const field=document.getElementById("roundChests");
  field.value=Math.max(0,Number(field.value||0)+amount);
}
function updateGroupCalculator(){
  const players=Math.max(1,Math.min(4,Number(document.getElementById("groupPlayers").value)||1));
  const perPlayer=Math.max(0,Number(document.getElementById("chestsPerPlayer").value)||0);
  const runs=Math.max(1,Number(document.getElementById("groupRuns").value)||1);
  trackerState.groupSize=players; saveState();
  document.getElementById("groupResult").innerHTML=`Erwartete Truhen: <strong>${(players*perPlayer*runs).toLocaleString("de-DE")}</strong> insgesamt (${players} Spieler × ${perPlayer} Truhen × ${runs} Runde${runs===1?"":"n"}).`;
}
function deleteRound(id){trackerState.rounds=trackerState.rounds.filter(r=>r.id!==id);saveState();updatePirateTracker();showToast("Runde gelöscht.");}
function clearHistory(){
  if(!trackerState.rounds.length){showToast("Der Verlauf ist bereits leer.");return;}
  if(!confirm("Möchtest du wirklich alle gespeicherten Runden löschen?")) return;
  trackerState.rounds=[];saveState();updatePirateTracker();showToast("Verlauf wurde gelöscht.");
}

document.addEventListener("click", event=>{
  const pageButton=event.target.closest("[data-page]");
  if(pageButton){selectPage(pageButton.dataset.page);return;}
  if(event.target.closest("#exploreButton")) selectPage("Pirate Tracker");
});
document.getElementById("menuToggle").addEventListener("click",()=>sidebar.classList.toggle("open"));
document.getElementById("profileButton").addEventListener("click",()=>showToast("Profilbereich – weitere Funktionen folgen."));
document.querySelector(".brand").addEventListener("click",event=>{event.preventDefault();selectPage("Dashboard");});
updateDate();
