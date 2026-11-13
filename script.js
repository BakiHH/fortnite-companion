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
  if(page === "Player Stats"){ renderPlayerStats(); return; }
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

// Der Endpoint liefert die aktuelle Shop-Rotation, keine historische Cosmetic-Datenbank.
const SHOP_URL = "https://fortnite-api.com/v2/shop?language=de";
let shopEntries = [];
let shopTimer = null;
let shopRequestId = 0;
let shopHiddenCount = 0;
function renderItemShop(){
  clearInterval(shopTimer);
  content.innerHTML = `<div class="page-header shop-heading"><div><div class="eyebrow">LIVE SHOP</div><h1>Fortnite Item Shop</h1><p>Alle Einträge der aktuellen Shop-Rotation – auch Angebote ohne Bild oder mit unvollständigen Metadaten.</p></div><button class="btn primary" id="refreshShop">↻ Aktualisieren</button></div>
  <div class="panel-card shop-info"><div><strong id="shopStatus">Shop wird geladen …</strong><p id="shopDate">Daten werden abgerufen.</p></div><strong id="shopCount">–</strong></div>
  <div class="shop-filters"><input id="shopSearch" type="search" placeholder="Cosmetics suchen …" aria-label="Cosmetics suchen"><select id="shopSort" aria-label="Sortierung"><option value="default">Shop-Reihenfolge</option><option value="az">Name A–Z</option><option value="low">Preis aufsteigend</option><option value="high">Preis absteigend</option></select></div>
  <div id="shopResults" class="shop-results"><div class="panel-card">Lade aktuelle Angebote …</div></div>
  <p class="shop-source">Quelle: <a href="https://fortnite-api.com/" target="_blank" rel="noopener noreferrer">Fortnite-API.com</a> (Drittanbieter). Keine Verbindung zu Epic Games.</p><footer><span>FORTNITE COMPANION</span><span>NOT AFFILIATED WITH EPIC GAMES</span></footer>`;
  document.getElementById("refreshShop").addEventListener("click",()=>loadShop(true));
  document.getElementById("shopSearch").addEventListener("input",displayShop);
  document.getElementById("shopSort").addEventListener("change",displayShop);
  loadShop(false);
  shopTimer=setInterval(()=>{if(document.getElementById("shopResults"))loadShop(false);else clearInterval(shopTimer);},300000);
}
function shopItems(entry){
  return ["br","tracks","cars","instruments","legoKits","lego_kits","items","brItems","banner","decor","festival","sparks","instruments","vehicleCosmetics"]
    .flatMap(key=>Array.isArray(entry[key])?entry[key]:[]).filter(item=>item&&typeof item==="object");
}
function cleanShopName(value){
  if(typeof value!=="string")return "";
  const name=value.trim();
  if(!name||/^(unbekanntes angebot|angebot ohne namen|unknown offer)$/i.test(name))return "";
  if(/^\[VIRTUAL\]/i.test(name)||/MtxCurrency/i.test(name)||/^Shop-Angebot/i.test(name))return "";
  if(/^v2:[a-f0-9]{16,}$/i.test(name)||/^[a-f0-9]{32,}$/i.test(name))return "";
  return name;
}
function shopName(entry){
  if(entry._resolvedName)return entry._resolvedName;
  const items=shopItems(entry);
  const candidates=[
    entry.bundle?.name,entry.bundle?.displayName,entry.bundle?.title,
    entry.displayName,entry.name,entry.title,
    entry.newDisplayAsset?.displayName,entry.newDisplayAsset?.name,
    ...(entry.displayAssets||[]).flatMap(asset=>[asset.displayName,asset.name,asset.title]),
    entry.displayAsset?.displayName,entry.displayAsset?.name,
    ...items.flatMap(item=>[item.name,item.displayName,item.title,item.track?.name,item.cosmetic?.name])
  ];
  const names=[...new Set(candidates.map(cleanShopName).filter(Boolean))];
  if(names.length)return names[0];
  const devName=String(entry.devName||"");
  const extracted=devName.match(/(?:\d+x\s+)?(.+?)\s+for\s+\d+\s*(?:MtxCurrency|V-Bucks)/i);
  if(extracted){const cleaned=cleanShopName(extracted[1]);if(cleaned)return cleaned;}
  return "Name nicht verfügbar";
}
function shopImage(entry){
  const items=shopItems(entry);
  const sources=[
    entry.newDisplayAsset?.renderImages?.[0]?.image,
    entry.newDisplayAsset?.renderImages?.[0]?.url,
    entry.newDisplayAsset?.materialInstances?.[0]?.images?.OfferImage,
    entry.bundle?.image,entry.bundle?.images?.icon,
    entry.displayAssets?.[0]?.url,entry.displayAssets?.[0]?.background,
    entry.newDisplayAsset?.renderImages?.[0]?.productTag,
    entry.newDisplayAsset?.renderImages?.[0]?.imageUrl,
    ...items.flatMap(item=>[
      item.images?.featured,item.images?.icon,item.images?.smallIcon,
      item.images?.cover,item.images?.large,item.albumArt,item.image,
      item.coverArt,item.icon
    ]),
    entry.newDisplayAsset?.images?.icon
  ];
  return sources.find(value=>typeof value==="string"&&/^https:\/\//i.test(value))||"";
}
function shopPrice(entry){return Number(entry.finalPrice??entry.regularPrice??0);}
function isCurrentShopEntry(entry){
  // The current /v2/shop response is the authoritative current rotation.
  // Do not exclude entries merely because images, names, or dates are absent.
  return entry !== null && typeof entry === "object";
}
async function resolveMissingShopNames(entries, requestId){
  const missing=entries.filter(entry=>shopName(entry)==="Name nicht verfügbar" && entry.mainId);
  const unique=[...new Set(missing.map(entry=>entry.mainId))].slice(0,60);
  const resolved=new Map();
  // Limit requests; this optional lookup may fail without affecting shop availability.
  for(let i=0;i<unique.length;i+=5){
    if(requestId!==shopRequestId)return;
    await Promise.all(unique.slice(i,i+5).map(async id=>{
      try{
        const response=await fetch(`https://fortnite-api.com/v2/cosmetics/br/${encodeURIComponent(id)}?language=de`);
        if(!response.ok)return;
        const json=await response.json();
        const name=cleanShopName(json?.data?.name);
        if(name)resolved.set(id,name);
      }catch(_error){}
    }));
  }
  for(const entry of missing){
    if(resolved.has(entry.mainId))entry._resolvedName=resolved.get(entry.mainId);
  }
}
async function loadShop(manual){
  const id=++shopRequestId;
  const button=document.getElementById("refreshShop");
  if(!button)return;
  button.disabled=true;
  document.getElementById("shopStatus").textContent="Shop wird aktualisiert …";
  try{
    const response=await fetch(SHOP_URL,{cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const payload=await response.json();
    if(!Array.isArray(payload?.data?.entries))throw new Error("Unbekanntes Datenformat");
    if(id!==shopRequestId||!document.getElementById("shopResults"))return;
    const all=payload.data.entries;
    shopEntries=all.filter(isCurrentShopEntry);
    shopHiddenCount=0;
    // Resolve missing names using the cosmetic database, without hiding any current offers.
    await resolveMissingShopNames(shopEntries, id);
    document.getElementById("shopStatus").textContent="Aktuelle Shop-Rotation";
    const date=payload.data.date;
    const validDate=date&&!Number.isNaN(Date.parse(date));
    document.getElementById("shopDate").textContent=
      (validDate?"Shop-Stand: "+new Date(date).toLocaleString("de-DE")+" · ":"")+
      "Abgerufen: "+new Date().toLocaleString("de-DE")+
      " · alle von der API gelieferten aktuellen Angebote";
    document.getElementById("shopCount").textContent=shopEntries.length+" Angebote";
    displayShop();
    if(manual)showToast("Aktueller Shop geladen.");
  }catch(error){
    if(id!==shopRequestId||!document.getElementById("shopResults"))return;
    document.getElementById("shopStatus").textContent="Shop nicht erreichbar";
    document.getElementById("shopDate").textContent="API-Anfrage fehlgeschlagen: "+error.message;
    shopEntries=[];
    document.getElementById("shopCount").textContent="–";
    document.getElementById("shopResults").innerHTML=
      '<div class="panel-card"><h2>Keine aktuellen Shop-Daten</h2><p>Bitte erneut versuchen. Es werden bewusst keine alten Angebote aus einem Zwischenspeicher angezeigt.</p></div>';
    if(manual)showToast("Shop-Aktualisierung fehlgeschlagen.");
  }finally{
    if(id===shopRequestId&&document.getElementById("refreshShop"))
      document.getElementById("refreshShop").disabled=false;
  }
}
function displayShop(){
  const target=document.getElementById("shopResults");if(!target)return;
  const search=(document.getElementById("shopSearch")?.value||"").toLocaleLowerCase("de");
  const sort=document.getElementById("shopSort")?.value||"default";
  let entries=shopEntries.filter(entry=>
    (shopName(entry)+" "+(entry.layout?.name||entry.section?.name||"")).toLocaleLowerCase("de").includes(search));
  if(sort==="az")entries.sort((a,b)=>shopName(a).localeCompare(shopName(b),"de"));
  if(sort==="low")entries.sort((a,b)=>shopPrice(a)-shopPrice(b));
  if(sort==="high")entries.sort((a,b)=>shopPrice(b)-shopPrice(a));
  if(!entries.length){
    target.innerHTML='<div class="panel-card">Keine passenden aktuellen Angebote gefunden.</div>';return;
  }
  const groups=new Map();
  for(const entry of entries){
    const section=entry.layout?.name||entry.section?.name||"Weitere Angebote";
    if(!groups.has(section))groups.set(section,[]);
    groups.get(section).push(entry);
  }
  target.innerHTML=[...groups].map(([section,offers])=>`<section class="shop-section">
    <div class="shop-section-heading"><h2>${escapeHTML(section)}</h2><span>${offers.length} Angebote</span></div>
    <div class="shop-grid">${offers.map(entry=>{
      const item=shopItems(entry)[0]||{};
      const rarity=item.series?.name||item.rarity?.name||item.type?.displayValue||"Cosmetic";
      const price=entry.finalPrice??entry.regularPrice;
      const picture=shopImage(entry);
      const pictureHTML=picture
        ? `<img loading="lazy" src="${escapeHTML(picture)}" alt="${escapeHTML(shopName(entry))}" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span class="shop-image-fallback" hidden>Kein Bild verfügbar</span>`
        : `<span class="shop-image-fallback">Kein Bild verfügbar</span>`;
      return `<article class="shop-card"><div class="shop-art">
        ${pictureHTML}
        </div><div class="shop-card-body"><small>${escapeHTML(rarity)}</small>
        <h3>${escapeHTML(shopName(entry))}</h3>
        <strong>${price==null?"Preis nicht verfügbar":Number(price).toLocaleString("de-DE")+" V-Bucks"}</strong>
        </div></article>`;
    }).join("")}</div></section>`).join("");
}


// Public Cloudflare Worker URL. Replace this placeholder after deployment.
const STATS_WORKER_URL = "https://fortnite-companion-stats.fortnite-companion-hub.workers.dev";
let statsLastName = "";
let statsLastPlatform = "epic";
let statsLastPeriod = "lifetime";
let statsRequestCounter = 0;

function renderPlayerStats(){
  content.innerHTML = `
  <div class="page-header"><div class="eyebrow">PLAYER PERFORMANCE</div><h1>Player Stats</h1>
    <p>Suche nach einem Epic-, PlayStation- oder Xbox-Namen und analysiere deine Fortnite-Battle-Royale-Statistiken.</p></div>
  <div class="panel-card">
    <h2>Spieler suchen</h2><p>Gib deinen Anzeigenamen exakt so ein, wie er im Spiel angezeigt wird.</p>
    <form id="statsForm" class="stats-search-form">
      <div class="field stats-name-field"><label for="statsName">Spielername</label>
        <input id="statsName" type="text" maxlength="64" autocomplete="off" placeholder="Epic-Anzeigename" required></div>
      <div class="field"><label for="statsPlatform">Konto</label>
        <select id="statsPlatform"><option value="epic">Epic Games</option><option value="psn">PlayStation</option><option value="xbl">Xbox</option></select></div>
      <div class="field"><label for="statsPeriod">Zeitraum</label>
        <select id="statsPeriod"><option value="lifetime">Gesamte Laufzeit</option><option value="season">Aktuelle Season</option></select></div>
      <button class="btn primary" id="statsSubmit" type="submit">Spieler suchen</button>
    </form>
  </div>
  <div class="panel-card stats-help"><p>Öffentliche Spielerstatistiken werden direkt auf dieser Website angezeigt. Es ist keine Anmeldung und kein API-Schlüssel für Besucher erforderlich.</p></div>
  <div id="statsResult" aria-live="polite"><div class="panel-card stats-placeholder">Gib einen Namen ein und starte die Suche, um Wins, K/D, Kills, Winrate und weitere Werte anzuzeigen.</div></div>
  <footer><span>FORTNITE COMPANION</span><span>NOT AFFILIATED WITH EPIC GAMES</span></footer>`;
  document.getElementById("statsName").value=statsLastName;
  document.getElementById("statsPlatform").value=statsLastPlatform;
  document.getElementById("statsPeriod").value=statsLastPeriod;
  document.getElementById("statsForm").addEventListener("submit",searchPlayerStats);
}
function statsNumber(value,decimal=0){
  const number=Number(value);
  return value==null||!Number.isFinite(number)?"–":number.toLocaleString("de-DE",{minimumFractionDigits:decimal,maximumFractionDigits:decimal});
}
function statsMetric(label,value,description=""){
  return `<div class="metric-card"><span class="metric-label">${escapeHTML(label)}</span>
    <strong>${escapeHTML(value)}</strong><small>${escapeHTML(description)}</small></div>`;
}
function statsRow(label,data){
  if(!data||typeof data!=="object")return "";
  return `<tr><td>${escapeHTML(label)}</td><td>${statsNumber(data.matches)}</td>
    <td>${statsNumber(data.wins)}</td><td>${statsNumber(data.kills)}</td>
    <td>${statsNumber(data.kd,2)}</td><td>${statsNumber(data.winRate,1)} %</td></tr>`;
}
async function searchPlayerStats(event){
  event.preventDefault();
  const name=document.getElementById("statsName").value.trim();
  const platform=document.getElementById("statsPlatform").value;
  const period=document.getElementById("statsPeriod").value;
  const result=document.getElementById("statsResult");
  if(!name){result.innerHTML='<div class="panel-card">Bitte einen Spielernamen eingeben.</div>';return;}
  if(STATS_WORKER_URL.includes("DEIN-WORKER")){
    result.innerHTML='<div class="panel-card stats-error"><h2>Einrichtung erforderlich</h2><p>Der Betreiber muss einmalig die Cloudflare-Worker-Adresse in script.js hinterlegen. Besucher benötigen keinen API-Schlüssel.</p></div>';
    return;
  }
  statsLastName=name;statsLastPlatform=platform;statsLastPeriod=period;
  const requestId=++statsRequestCounter;
  const submit=document.getElementById("statsSubmit");
  submit.disabled=true;
  result.innerHTML='<div class="panel-card stats-placeholder">Spielerstatistiken werden geladen …</div>';
  try{
    const url=new URL(STATS_WORKER_URL);
    url.searchParams.set("name",name);
    url.searchParams.set("accountType",platform);
    url.searchParams.set("timeWindow",period);
    const response=await fetch(url.toString(),{headers:{"Accept":"application/json"},cache:"no-store"});
    const body=await response.json().catch(()=>({}));
    if(!response.ok){
      const detail=body.error||body.message||"";
      if(response.status===403)throw new Error("Statistiken sind nicht öffentlich oder der Dienst hat keinen Zugriff.");
      if(response.status===404)throw new Error("Spieler nicht gefunden. Prüfe Namen, Plattform und Privatsphäre-Einstellungen.");
      if(response.status===429)throw new Error("Zu viele Anfragen. Bitte später erneut versuchen.");
      throw new Error(`API-Fehler ${response.status}${detail?": "+String(detail):""}`);
    }
    if(requestId!==statsRequestCounter||!document.getElementById("statsResult"))return;
    const player=body.data||{};
    const stats=player.stats||{};
    const overall=stats.all?.overall||stats.all||stats.overall||{};
    const breakdown=[
      ["Solo",stats.all?.solo||stats.solo],
      ["Duo",stats.all?.duo||stats.duo],
      ["Squad",stats.all?.squad||stats.squad],
      ["LTM",stats.all?.ltm||stats.ltm]
    ].filter(([,data])=>data&&typeof data==="object");
    const displayName=player.account?.name||name;
    const periodName=period==="season"?"Aktuelle Season":"Gesamte Laufzeit";
    const hasStats=Object.keys(overall).length>0||breakdown.length>0;
    if(!hasStats){
      result.innerHTML='<div class="panel-card stats-error"><h2>Keine öffentlichen Statistikdaten</h2><p>Für diesen Spieler wurden keine auswertbaren Werte geliefert. Prüfe, ob die öffentlichen Spielstatistiken im Fortnite-Konto aktiviert sind.</p></div>';
      return;
    }
    result.innerHTML=`
      <div class="stats-profile panel-card">
        <div><div class="eyebrow">SPIELERPROFIL</div><h2>${escapeHTML(displayName)}</h2>
          <p>${escapeHTML(periodName)} · ${escapeHTML(platform.toUpperCase())}</p></div>
        <span class="stats-live-indicator"><span class="status-dot"></span> API-DATEN</span>
      </div>
      <div class="tracker-grid stats-metrics">
        ${statsMetric("SIEGE",statsNumber(overall.wins),"Victory Royales")}
        ${statsMetric("K/D",statsNumber(overall.kd,2),"Kills pro Tod")}
        ${statsMetric("ELIMINIERUNGEN",statsNumber(overall.kills),"Gesamt-Kills")}
        ${statsMetric("SIEGQUOTE",statsNumber(overall.winRate,1)+" %","Winrate")}
        ${statsMetric("MATCHES",statsNumber(overall.matches),"Gespielte Matches")}
        ${statsMetric("SPIELZEIT",statsNumber(overall.minutesPlayed),"Minuten")}
      </div>
      <div class="panel-card"><h2>Statistiken nach Modus</h2>
        ${breakdown.length?`<div class="table-wrap"><table><thead><tr><th>MODUS</th><th>MATCHES</th><th>SIEGE</th><th>KILLS</th><th>K/D</th><th>WINRATE</th></tr></thead>
          <tbody>${breakdown.map(([label,data])=>statsRow(label,data)).join("")}</tbody></table></div>`:
          '<p class="muted">Keine Modus-Aufschlüsselung von der API geliefert.</p>'}
      </div>
      <div class="panel-card"><p class="muted">Quelle: Fortnite-API.com. Werte können verzögert sein; die API bietet nicht für jeden Spielmodus getrennte Zero-Build-Werte.</p></div>`;
  }catch(error){
    if(requestId!==statsRequestCounter||!document.getElementById("statsResult"))return;
    const message=error instanceof TypeError
      ?"Der Statistikdienst ist momentan nicht erreichbar. Bitte später erneut versuchen."
      :error.message;
    result.innerHTML=`<div class="panel-card stats-error"><h2>Statistiken nicht verfügbar</h2><p>${escapeHTML(message)}</p></div>`;
  }finally{
    if(document.getElementById("statsSubmit"))document.getElementById("statsSubmit").disabled=false;
  }
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
      <h2>Gruppen-Farm-Rechner</h2><p>Berechne die erwartete Truhenmenge einer Gruppe anhand eurer durchschnittlichen Funde pro Spieler.</p>
      <div class="form-grid">
        <div class="field"><label for="groupPlayers">Spieler in der Gruppe</label><input id="groupPlayers" type="number" min="1" max="4" value="2"></div>
        <div class="field"><label for="chestsPerPlayer">Truhen pro Spieler</label><input id="chestsPerPlayer" type="number" min="0" max="200" value="0"></div>
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
