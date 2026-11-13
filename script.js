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
  if(el) el.textContent = new Intl.DateTimeFormat(typeof currentLanguage!=="undefined"&&currentLanguage==="en"?"en-GB":"de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
}
function setActivePage(page){
  document.querySelectorAll(".nav-item[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  pageTitle.textContent = page === "Settings" ? "Language" : page;
  sidebar.classList.remove("open");
}
function selectPage(page){
  setActivePage(page);
  if(page === "Dashboard"){ renderDashboard(); return; }
  if(page === "Pirate Tracker"){ renderPirateTracker(); return; }
  if(page === "Item Shop"){ renderItemShop(); return; }
  if(page === "Player Stats"){ renderPlayerStats(); return; }
  if(page === "Interactive Map"){ renderInteractiveMap(); return; }
  if(page === "Settings"){ renderSettings(); return; }
  renderPlaceholder(page);
}
function renderDashboard(){
  content.innerHTML = `
    <div class="welcome"><div><div class="eyebrow">YOUR FORTNITE HUB</div><h1>Welcome to <span>Companion.</span></h1><p>Everything Fortnite. All in one place.</p></div><div class="date-card"><span>HEUTE</span><strong id="currentDate">--.--.----</strong></div></div>
    <div class="dashboard-profile-notice" role="note"><div class="dashboard-profile-notice-icon"><svg class="profile-person-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></svg></div><div class="dashboard-profile-notice-copy"><strong>Dein Fortschritt bleibt bei dir!</strong><p>Klicke oben rechts neben <b>ONLINE</b> auf das <b>Menschen-Symbol</b>, um dein kostenloses lokales Profil einzurichten, deine Daten zu speichern und ein Backup zu erstellen. Deine Daten bleiben in diesem Browser – für andere Geräte kannst du dein Backup importieren.</p></div><button type="button" class="dashboard-profile-notice-button" id="dashboardProfileOpen">Profil öffnen →</button></div>
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
  document.getElementById('dashboardProfileOpen')?.addEventListener('click',openLocalProfile);
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


// Interaktive Inselkarte: öffentliche Live-Daten von Fortnite-API.com.
// Die API gibt Kartenbild und POI-Positionen zurück. Bei fehlenden Koordinaten
// werden keine Marker erfunden.
const CUSTOM_MAP_KEY='fortniteCompanionCustomMapMarkersV1';
const MAP_CATEGORIES={chest:{label:'Truhe',icon:'📦'},ammo:{label:'Munitionskiste',icon:'🎯'},vehicle:{label:'Fahrzeug',icon:'🚗'},routeA:{label:'Duo Route A',icon:'🟣'},routeB:{label:'Duo Route B',icon:'🔵'},other:{label:'Sonstiges',icon:'📍'}};
let islandMapState={zoom:1,offsetX:0,offsetY:0,pois:[],selected:null,showPois:true,custom:loadCustomMapMarkers(),showCustom:true,placing:false,category:'chest'};
function loadCustomMapMarkers(){try{const data=JSON.parse(localStorage.getItem(CUSTOM_MAP_KEY)||'[]');return Array.isArray(data)?data.filter(m=>m&&typeof m.id==='string'&&MAP_CATEGORIES[m.category]&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&m.x>=0&&m.x<=100&&m.y>=0&&m.y<=100).slice(0,1000):[];}catch{return [];}}
function saveCustomMapMarkers(){try{localStorage.setItem(CUSTOM_MAP_KEY,JSON.stringify(islandMapState.custom));return true;}catch{showToast('Speichern im Browser nicht möglich.');return false;}}
function mapEscape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function renderInteractiveMap(){
  content.innerHTML=`<div class="page-header"><div class="eyebrow">LIVE ISLAND MAP</div><h1>Interactive Map</h1><p>Die aktuelle Fortnite Battle-Royale-Insel – auch für Zero Build. Zoome, verschiebe die Karte und entdecke benannte Orte.</p></div>
  <div class="panel-card map-tools"><div><strong id="islandMapStatus">Aktuelle Inselkarte wird geladen …</strong><p id="islandMapUpdated">Quelle: Fortnite-API.com</p></div><button class="btn primary" id="mapReload">↻ Aktualisieren</button></div>
  <div class="map-layout"><div class="panel-card map-main"><div class="map-toolbar"><button class="btn" id="mapZoomIn" aria-label="Vergrößern">＋</button><button class="btn" id="mapZoomOut" aria-label="Verkleinern">－</button><button class="btn" id="mapReset">⤢ Zentrieren</button><label class="map-check"><input type="checkbox" id="mapShowPois" checked> POIs anzeigen</label></div>
  <div class="map-viewport" id="mapViewport"><div class="map-stage" id="mapStage"><img id="mapIslandImage" alt="Aktuelle Fortnite Inselkarte" draggable="false"><div id="mapMarkers" class="map-markers"></div><div id="mapCustomMarkers" class="map-custom-markers"></div></div><div id="mapLoading" class="map-loading">Lade Kartenbild …</div></div><p class="map-caption">Ziehen zum Verschieben · Mausrad oder +/− zum Zoomen · Auf dem Handy mit zwei Fingern zoomen</p></div>
  <aside class="panel-card map-sidebar"><section class="map-custom-panel"><h2>Eigene Fundorte</h2><p class="map-help">Kostenlos · Nur in diesem Browser gespeichert · Keine offiziellen Spawn-Daten</p>
  <label class="map-field-label" for="mapCustomCategory">Marker-Typ</label><select id="mapCustomCategory" class="map-custom-select"><option value="chest">📦 Truhe</option><option value="ammo">🎯 Munitionskiste</option><option value="vehicle">🚗 Fahrzeug</option><option value="routeA">🟣 Duo Route A</option><option value="routeB">🔵 Duo Route B</option><option value="other">📍 Sonstiges</option></select>
  <label class="map-field-label" for="mapCustomNote">Notiz (optional)</label><input id="mapCustomNote" maxlength="100" placeholder="z. B. Dachboden / Haus" />
  <button id="mapPlaceMarker" class="btn primary map-place-button" type="button">＋ Marker auf Karte setzen</button>
  <label class="map-custom-toggle"><input type="checkbox" id="mapShowCustom" checked> Eigene Marker anzeigen</label>
  <div class="map-custom-count" id="mapCustomCount"></div><div id="mapCustomList" class="map-custom-list"></div>
  <div class="map-custom-actions"><button class="btn" id="mapExportMarkers" type="button">Exportieren</button><label class="btn map-import-label" for="mapImportMarkers">Importieren</label><input type="file" id="mapImportMarkers" accept="application/json,.json" hidden></div>
  <button class="btn map-delete-all" id="mapDeleteMarkers" type="button">Alle eigenen Marker löschen</button></section><div class="map-poi-divider"></div><h2>Orte auf der Insel <span id="mapPoiCount"></span></h2><input id="mapPoiSearch" type="search" placeholder="Ort suchen …" aria-label="Orte suchen"><div id="mapPoiList" class="map-poi-list"><p>Lade Orte …</p></div></aside></div>
  <p class="shop-source">Karte und Ortsdaten: <a href="https://fortnite-api.com/" target="_blank" rel="noopener noreferrer">Fortnite-API.com</a>. Eigene Marker sind persönliche Notizen, keine garantierten Truhen- oder Loot-Spawns. Keine Verbindung zu Epic Games.</p>
  <footer><span>FORTNITE COMPANION</span><span>NOT AFFILIATED WITH EPIC GAMES</span></footer>`;
  const viewport=document.getElementById('mapViewport');
  document.getElementById('mapCustomCategory').onchange=e=>islandMapState.category=e.target.value;
  document.getElementById('mapPlaceMarker').onclick=()=>{islandMapState.placing=!islandMapState.placing;mapUpdatePlacing();};
  document.getElementById('mapShowCustom').onchange=e=>{islandMapState.showCustom=e.target.checked;mapDrawCustomMarkers();};
  document.getElementById('mapExportMarkers').onclick=mapExportCustom;
  document.getElementById('mapImportMarkers').onchange=mapImportCustom;
  document.getElementById('mapDeleteMarkers').onclick=()=>{if(!islandMapState.custom.length)return;if(confirm('Alle selbst gesetzten Kartenmarker in diesem Browser löschen?')){islandMapState.custom=[];saveCustomMapMarkers();mapDrawCustomMarkers();}};
  viewport.addEventListener('click',mapPlaceAtClick);
  mapDrawCustomMarkers();
  document.getElementById('mapZoomIn').onclick=()=>mapZoom(1.3);
  document.getElementById('mapZoomOut').onclick=()=>mapZoom(1/1.3);
  document.getElementById('mapReset').onclick=()=>{islandMapState.zoom=1;islandMapState.offsetX=0;islandMapState.offsetY=0;mapTransform();};
  document.getElementById('mapShowPois').onchange=e=>{islandMapState.showPois=e.target.checked;mapDrawMarkers();};
  document.getElementById('mapPoiSearch').oninput=mapDrawList;
  document.getElementById('mapReload').onclick=()=>loadIslandMap();
  viewport.addEventListener('wheel',e=>{e.preventDefault();mapZoom(e.deltaY<0?1.15:1/1.15);},{passive:false});
  let drag=null, pinchDistance=null;
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;drag={x:e.clientX,y:e.clientY,ox:islandMapState.offsetX,oy:islandMapState.offsetY,startX:e.clientX,startY:e.clientY};viewport.setPointerCapture(e.pointerId);});
  viewport.addEventListener('pointermove',e=>{if(!drag)return;islandMapState.offsetX=drag.ox+e.clientX-drag.x;islandMapState.offsetY=drag.oy+e.clientY-drag.y;mapTransform();});
  viewport.addEventListener('pointerup',()=>{if(drag&&Math.hypot((drag.x||0)-(drag.startX||0),(drag.y||0)-(drag.startY||0))>5)viewport.dataset.wasDragged='1';drag=null;});
  viewport.addEventListener('pointercancel',()=>drag=null);
  viewport.addEventListener('touchstart',e=>{if(e.touches.length===1){drag={x:e.touches[0].clientX,y:e.touches[0].clientY,ox:islandMapState.offsetX,oy:islandMapState.offsetY};pinchDistance=null;}else if(e.touches.length===2){drag=null;pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}},{passive:true});
  viewport.addEventListener('touchmove',e=>{if(e.touches.length===2){e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(pinchDistance)mapZoom(d/pinchDistance);pinchDistance=d;}else if(e.touches.length===1&&drag){e.preventDefault();islandMapState.offsetX=drag.ox+e.touches[0].clientX-drag.x;islandMapState.offsetY=drag.oy+e.touches[0].clientY-drag.y;mapTransform();}},{passive:false});
  viewport.addEventListener('touchend',()=>{drag=null;pinchDistance=null;});
  loadIslandMap();
}
function mapZoom(factor){islandMapState.zoom=Math.max(1,Math.min(5,islandMapState.zoom*factor));mapTransform();}
function mapTransform(){const stage=document.getElementById('mapStage');if(stage)stage.style.transform=`translate(${islandMapState.offsetX}px,${islandMapState.offsetY}px) scale(${islandMapState.zoom})`;}
function mapCoordinate(poi){
  const loc=poi.location||poi.coordinates||{};
  const x=Number(loc.x),y=Number(loc.y);
  if(!Number.isFinite(x)||!Number.isFinite(y)||loc.x==null||loc.y==null)return null;
  // Fortnite-API /v1/map liefert Kartenpixel-Koordinaten (typisch 0–2048).
  const img=document.getElementById('mapIslandImage');
  const w=img?.naturalWidth||2048,h=img?.naturalHeight||2048;
  if(x<0||y<0||x>w||y>h)return null;
  return {x:x/w*100,y:y/h*100};
}
function mapDrawMarkers(){
  const container=document.getElementById('mapMarkers');if(!container)return;
  container.innerHTML='';if(!islandMapState.showPois)return;
  islandMapState.pois.forEach((poi,i)=>{const pt=mapCoordinate(poi);if(!pt)return;
    const button=document.createElement('button');button.className='map-pin'+(islandMapState.selected===i?' selected':'');button.type='button';button.title=poi.name||'Ort';button.setAttribute('aria-label',poi.name||'Ort');button.style.left=pt.x+'%';button.style.top=pt.y+'%';button.textContent='●';button.onclick=()=>mapFocus(i);container.appendChild(button);
  });
}
function mapDrawList(){const list=document.getElementById('mapPoiList');if(!list)return;
  const q=(document.getElementById('mapPoiSearch')?.value||'').trim().toLocaleLowerCase('de');list.innerHTML='';
  let count=0;islandMapState.pois.forEach((poi,i)=>{const name=String(poi.name||'');if(!name.toLocaleLowerCase('de').includes(q))return;count++;
    const b=document.createElement('button');b.className='map-poi-item'+(islandMapState.selected===i?' active':'');b.type='button';b.textContent=name;b.onclick=()=>mapFocus(i);list.appendChild(b);
  });if(!count)list.textContent='Keine Orte gefunden.';
  const el=document.getElementById('mapPoiCount');if(el)el.textContent=`(${islandMapState.pois.length})`;
}
function mapFocus(index){islandMapState.selected=index;const pt=mapCoordinate(islandMapState.pois[index]);
  if(pt){const vp=document.getElementById('mapViewport');const rect=vp.getBoundingClientRect();const side=Math.min(rect.width,rect.height);islandMapState.zoom=Math.max(1.6,islandMapState.zoom);islandMapState.offsetX=(.5-pt.x/100)*side*islandMapState.zoom;islandMapState.offsetY=(.5-pt.y/100)*side*islandMapState.zoom;mapTransform();}
  mapDrawMarkers();mapDrawList();
}
async function loadIslandMap(){
  const status=document.getElementById('islandMapStatus'),loading=document.getElementById('mapLoading'),img=document.getElementById('mapIslandImage');if(!status)return;
  status.textContent='Aktuelle Inselkarte wird geladen …';loading.hidden=false;
  try{
    const res=await fetch('https://fortnite-api.com/v1/map?language=de',{cache:'no-store'});
    if(!res.ok)throw new Error('Karten-API: HTTP '+res.status);
    const json=await res.json();if(!json.data)throw new Error('Keine Kartendaten erhalten');
    if(!document.getElementById('mapIslandImage'))return;
    const data=json.data;
    const imageUrl=data.images?.pois||data.images?.blank||'https://fortnite-api.com/images/map_de.png';
    const safeUrl=new URL(imageUrl,location.href);if(safeUrl.protocol!=='https:')throw new Error('Ungültige Kartenbild-Adresse');
    img.onload=()=>{if(document.getElementById('mapLoading'))loading.hidden=true;mapDrawMarkers();};
    img.onerror=()=>{if(document.getElementById('mapLoading'))loading.textContent='Kartenbild konnte nicht geladen werden.';};
    img.src=safeUrl.href;
    islandMapState.pois=Array.isArray(data.pois)?data.pois.filter(p=>p&&p.name):[];
    islandMapState.selected=null;islandMapState.zoom=1;islandMapState.offsetX=0;islandMapState.offsetY=0;mapTransform();
    status.textContent='Aktuelle Fortnite-Inselkarte';
    document.getElementById('mapIslandImage').alt='Aktuelle Fortnite-Inselkarte';
    const updated=document.getElementById('islandMapUpdated');if(updated)updated.textContent='Live-Kartendaten · '+islandMapState.pois.length+' Orte · Quelle: Fortnite-API.com';
    mapDrawList();mapDrawMarkers();mapDrawCustomMarkers();
  }catch(err){if(document.getElementById('islandMapStatus')){status.textContent='Karte derzeit nicht verfügbar';loading.textContent='Die aktuelle Karte konnte nicht geladen werden. Bitte später erneut versuchen.';}}
}


// Custom markers use percentages of the rendered square map. They are user observations,
// not verified or guaranteed chest spawns. No paid API or backend is required.
function mapUpdatePlacing(){const btn=document.getElementById('mapPlaceMarker'),vp=document.getElementById('mapViewport');if(!btn||!vp)return;btn.textContent=islandMapState.placing?'Abbrechen – Karte antippen':'＋ Marker auf Karte setzen';btn.classList.toggle('map-placing',islandMapState.placing);vp.classList.toggle('map-placing',islandMapState.placing);}
function mapPlaceAtClick(event){
  if(!islandMapState.placing||event.target.closest('button'))return;
  const viewport=document.getElementById('mapViewport');
  if(viewport.dataset.wasDragged){delete viewport.dataset.wasDragged;return;}
  const stage=document.getElementById('mapStage');const rect=stage.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const x=(event.clientX-rect.left)/rect.width*100,y=(event.clientY-rect.top)/rect.height*100;
  if(x<0||x>100||y<0||y>100)return;
  const category=islandMapState.category;
  if(!MAP_CATEGORIES[category])return;
  const note=document.getElementById('mapCustomNote').value.trim().slice(0,100);
  islandMapState.custom.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,9),category,x:+x.toFixed(3),y:+y.toFixed(3),note});
  if(islandMapState.custom.length>1000)islandMapState.custom.shift();
  saveCustomMapMarkers();islandMapState.placing=false;mapUpdatePlacing();mapDrawCustomMarkers();showToast('Marker gespeichert');
}
function mapDrawCustomMarkers(){
  const layer=document.getElementById('mapCustomMarkers');if(!layer)return;layer.replaceChildren();
  if(islandMapState.showCustom){islandMapState.custom.forEach(m=>{
    const b=document.createElement('button');b.type='button';b.className='map-custom-pin map-custom-'+m.category;
    b.style.left=m.x+'%';b.style.top=m.y+'%';b.textContent=MAP_CATEGORIES[m.category].icon;
    b.title=MAP_CATEGORIES[m.category].label+(m.note?' – '+m.note:'');
    b.setAttribute('aria-label',b.title);b.onclick=()=>{const index=islandMapState.custom.findIndex(v=>v.id===m.id);if(index>=0){document.querySelectorAll('.map-custom-item').forEach(el=>el.classList.toggle('active',el.dataset.id===m.id));}};
    layer.appendChild(b);
  });}
  const list=document.getElementById('mapCustomList'),count=document.getElementById('mapCustomCount');
  if(count)count.textContent=islandMapState.custom.length+' eigene Marker';if(!list)return;
  list.replaceChildren();if(!islandMapState.custom.length){const p=document.createElement('p');p.className='map-help';p.textContent='Noch keine Marker. Wähle einen Typ und tippe auf die Karte.';list.appendChild(p);return;}
  islandMapState.custom.forEach(m=>{const item=document.createElement('div');item.className='map-custom-item';item.dataset.id=m.id;
    const title=document.createElement('button');title.type='button';title.className='map-custom-focus';title.textContent=MAP_CATEGORIES[m.category].icon+' '+(m.note||MAP_CATEGORIES[m.category].label);
    title.onclick=()=>{const vp=document.getElementById('mapViewport');const rect=vp.getBoundingClientRect();const side=Math.min(rect.width,rect.height);islandMapState.zoom=Math.max(1.6,islandMapState.zoom);islandMapState.offsetX=(.5-m.x/100)*side*islandMapState.zoom;islandMapState.offsetY=(.5-m.y/100)*side*islandMapState.zoom;mapTransform();};
    const del=document.createElement('button');del.type='button';del.className='map-custom-remove';del.textContent='×';del.title='Marker löschen';del.setAttribute('aria-label','Marker löschen');del.onclick=()=>{islandMapState.custom=islandMapState.custom.filter(v=>v.id!==m.id);saveCustomMapMarkers();mapDrawCustomMarkers();};
    item.append(title,del);list.appendChild(item);
  });
}
function mapExportCustom(){const blob=new Blob([JSON.stringify({version:1,markers:islandMapState.custom},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='fortnite-companion-kartenmarker.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function mapImportCustom(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>250000){showToast('Datei ist zu groß');return;}
  try{const obj=JSON.parse(await file.text());if(obj.version!==1||!Array.isArray(obj.markers))throw Error('Ungültiges Format');
    const valid=obj.markers.filter(m=>m&&MAP_CATEGORIES[m.category]&&typeof m.id==='string'&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&m.x>=0&&m.x<=100&&m.y>=0&&m.y<=100&&typeof m.note==='string'&&m.note.length<=100).slice(0,1000);
    if(valid.length!==obj.markers.length)throw Error('Ungültige Marker-Daten');
    if(!confirm(valid.length+' Marker importieren? Vorhandene Marker werden ersetzt.'))return;
    islandMapState.custom=valid;saveCustomMapMarkers();mapDrawCustomMarkers();showToast('Marker importiert');
  }catch{showToast('Ungültige Marker-Datei');}
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
document.getElementById("profileButton").addEventListener("click",openLocalProfile);
refreshProfileAvatar();
document.querySelector(".brand").addEventListener("click",event=>{event.preventDefault();selectPage("Dashboard");});
updateDate();


// Lokales Spielerprofil: kein Server, keine Anmeldung, kein Passwort.
const LOCAL_PROFILE_KEY='fortniteCompanionLocalProfileV1';
const PROFILE_ICONS=['🎮','🐧','🏴‍☠️','⭐','🦊','🚀','💜','🏆'];
function readLocalProfile(){
  try{const p=JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY)||'{}');return {name:typeof p.name==='string'?p.name.slice(0,32):'',icon:PROFILE_ICONS.includes(p.icon)?p.icon:'🎮'};}
  catch{return {name:'',icon:'🎮'};}
}
const PROFILE_PERSON_SVG = '<svg class="profile-person-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></svg>';
function refreshProfileAvatar(){
  const p=readLocalProfile();const el=document.getElementById('profileInitials');
  // Das Profil-Symbol bleibt bewusst ein Mensch; der gewählte Avatar bleibt im Profil gespeichert.
  if(el)el.innerHTML=PROFILE_PERSON_SVG;
  const btn=document.getElementById('profileButton');
  if(btn)btn.title=p.name?`Lokales Profil: ${p.name}`:'Lokales Profil erstellen';
}
function profileClose(){const el=document.getElementById('profileModal');if(el){el.hidden=true;el.innerHTML='';}document.removeEventListener('keydown',profileEscape);}
function profileEscape(e){if(e.key==='Escape')profileClose();}
function profileBackupData(){
  return {format:'fortnite-companion-local-backup',version:1,exportedAt:new Date().toISOString(),profile:readLocalProfile(),tracker:trackerState,markers:loadCustomMapMarkers()};
}
function profileDownload(){
  const data=JSON.stringify(profileBackupData(),null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
  a.download='fortnite-companion-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast('Backup wurde heruntergeladen.');
}
function profileValidateBackup(data){
  if(!data||data.format!=='fortnite-companion-local-backup'||data.version!==1)throw Error('Keine gültige Companion-Backup-Datei.');
  if(!data.profile||typeof data.profile.name!=='string'||data.profile.name.length>32||!PROFILE_ICONS.includes(data.profile.icon))throw Error('Ungültige Profildaten.');
  if(!data.tracker||typeof data.tracker!=='object'||Array.isArray(data.tracker)||!Array.isArray(data.tracker.rounds)||data.tracker.rounds.length>10000)throw Error('Ungültige Tracker-Daten.');
  if(!Array.isArray(data.markers)||data.markers.length>1000||data.markers.some(m=>!m||typeof m.id!=='string'||m.id.length>120||!MAP_CATEGORIES[m.category]||!Number.isFinite(m.x)||!Number.isFinite(m.y)||m.x<0||m.x>100||m.y<0||m.y>100))throw Error('Ungültige Kartenmarker.');
  return data;
}
async function profileImport(file){
  if(!file)return;
  try{
    if(file.size>1500000)throw Error('Backup-Datei ist zu groß (maximal 1,5 MB).');
    const data=profileValidateBackup(JSON.parse(await file.text()));
    if(!confirm('Backup importieren? Das ersetzt dein lokales Profil, deinen Pirate Tracker und deine Kartenmarker. Bitte vorher ein Backup deiner aktuellen Daten herunterladen.'))return;
    const snapshot={profile:localStorage.getItem(LOCAL_PROFILE_KEY),tracker:localStorage.getItem(STORAGE_KEY),markers:localStorage.getItem(CUSTOM_MAP_KEY)};
    try{
      localStorage.setItem(LOCAL_PROFILE_KEY,JSON.stringify(data.profile));
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data.tracker));
      localStorage.setItem(CUSTOM_MAP_KEY,JSON.stringify(data.markers));
    }catch(err){for(const [k,key] of [['profile',LOCAL_PROFILE_KEY],['tracker',STORAGE_KEY],['markers',CUSTOM_MAP_KEY]]){try{if(snapshot[k]===null)localStorage.removeItem(key);else localStorage.setItem(key,snapshot[k]);}catch{}}throw err;}
    trackerState=loadState();islandMapState.custom=loadCustomMapMarkers();refreshProfileAvatar();profileClose();selectPage('Dashboard');showToast('Backup erfolgreich importiert.');
  }catch(err){alert('Import fehlgeschlagen: '+err.message);}
}
function openLocalProfile(){
  const p=readLocalProfile();const el=document.getElementById('profileModal');
  el.hidden=false;
  el.innerHTML=`<div class="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profileHeading">
    <div class="profile-dialog-head"><div><div class="eyebrow">LOKALES SPIELERPROFIL</div><h2 id="profileHeading">Mein Companion-Profil</h2></div><button type="button" class="profile-close" id="profileClose" aria-label="Schließen">×</button></div>
    <p class="profile-hint">Kostenlos und ohne Registrierung. Deine Daten bleiben ausschließlich in diesem Browser. Kein Online-Login und keine automatische Synchronisierung.</p>
    <form id="localProfileForm" class="profile-form"><label for="localProfileName">Dein Profilname</label><input id="localProfileName" maxlength="32" required placeholder="Dein Spielername" value="${escapeHTML(p.name)}" autocomplete="nickname" />
    <label>Avatar auswählen</label><div class="profile-icons" id="profileIcons">${PROFILE_ICONS.map(icon=>`<button type="button" class="profile-icon ${icon===p.icon?'chosen':''}" data-icon="${icon}" aria-label="Avatar ${icon}" aria-pressed="${icon===p.icon}">${icon}</button>`).join('')}</div>
    <button type="submit" class="btn primary">Profil speichern</button></form>
    <div class="profile-summary"><div><span>Gespeicherte Runden</span><strong>${Array.isArray(trackerState.rounds)?trackerState.rounds.length:0}</strong></div><div><span>Eigene Kartenmarker</span><strong>${loadCustomMapMarkers().length}</strong></div></div>
    <div class="profile-backup"><h3>Daten sichern und übertragen</h3><p>Exportiere dein Profil, deine Runden und Kartenmarker als JSON-Datei. Auf einem anderen Gerät kannst du die Datei wieder importieren.</p>
    <div class="profile-backup-actions"><button class="btn" type="button" id="profileExport">↓ Backup herunterladen</button><button class="btn" type="button" id="profileImportButton">↑ Backup importieren</button><input id="profileImportFile" type="file" accept=".json,application/json" hidden></div></div>
    <p class="profile-footnote">Achtung: Löschen der Browserdaten kann deine gespeicherten Daten entfernen. Ein Backup ist die einzige Wiederherstellungsmöglichkeit.</p></div>`;
  el.addEventListener('click',e=>{if(e.target===el)profileClose();},{once:true});
  document.getElementById('profileClose').onclick=profileClose;
  let selectedIcon=p.icon;
  document.querySelectorAll('.profile-icon').forEach(btn=>btn.addEventListener('click',()=>{selectedIcon=btn.dataset.icon;document.querySelectorAll('.profile-icon').forEach(b=>{b.classList.toggle('chosen',b===btn);b.setAttribute('aria-pressed',String(b===btn));});}));
  document.getElementById('localProfileForm').onsubmit=e=>{e.preventDefault();const name=document.getElementById('localProfileName').value.trim();if(!name)return;try{localStorage.setItem(LOCAL_PROFILE_KEY,JSON.stringify({name,icon:selectedIcon}));refreshProfileAvatar();profileClose();showToast('Profil gespeichert.');}catch{showToast('Lokales Speichern ist nicht möglich.');}};
  document.getElementById('profileExport').onclick=profileDownload;
  document.getElementById('profileImportButton').onclick=()=>document.getElementById('profileImportFile').click();
  document.getElementById('profileImportFile').onchange=e=>profileImport(e.target.files[0]);
  document.addEventListener('keydown',profileEscape);
  document.getElementById('localProfileName').focus();
}


// Free, offline UI translations. No translation service or paid API.
const LANGUAGE_KEY='fortniteCompanionLanguageV1';
const LANGUAGES={de:'Deutsch',en:'English'};
const UI_TRANSLATIONS={"HEUTE":{"en":"TODAY","de":"HEUTE"},"Welcome to":{"en":"Welcome to","de":"Willkommen bei"},"Everything Fortnite. All in one place.":{"en":"Everything Fortnite. All in one place.","de":"Alles zu Fortnite. An einem Ort."},"Dein Fortschritt bleibt bei dir!":{"de":"Dein Fortschritt bleibt bei dir!","en":"Your progress stays with you!"},"Klicke oben rechts neben":{"en":"Click the person icon next to","de":"Klicke oben rechts neben"},"Profil öffnen →":{"en":"Open profile →","de":"Profil öffnen →"},"YOUR ULTIMATE FORTNITE HUB":{"en":"YOUR ULTIMATE FORTNITE HUB","de":"DEIN ULTIMATIVER FORTNITE-HUB"},"Level up your":{"en":"Level up your","de":"Verbessere dein"},"Fortnite experience.":{"en":"Fortnite experience.","de":"Fortnite-Erlebnis."},"Explore Companion":{"en":"Explore Companion","de":"Companion entdecken"},"Quick Access":{"en":"Quick Access","de":"Schnellzugriff"},"Jump straight into your favorite tools.":{"en":"Jump straight into your favorite tools.","de":"Direkt zu deinen Lieblingstools."},"Track chests and treasures":{"en":"Track chests and treasures","de":"Truhen und Schätze erfassen"},"Explore cosmetics":{"en":"Explore cosmetics","de":"Kosmetische Gegenstände entdecken"},"Analyze your performance":{"en":"Analyze your performance","de":"Deine Leistung analysieren"},"Discover locations":{"en":"Discover locations","de":"Orte entdecken"},"Platform Overview":{"en":"Platform Overview","de":"Plattformüberblick"},"Your companion at a glance.":{"en":"Your companion at a glance.","de":"Dein Companion auf einen Blick."},"Planned modules":{"en":"Planned modules","de":"Geplante Module"},"Focus mode":{"en":"Focus mode","de":"Hauptspielmodus"},"Companion update":{"en":"Companion update","de":"Companion-Update"},"MAIN MENU":{"en":"MAIN MENU","de":"HAUPTMENÜ"},"DISCOVER":{"en":"DISCOVER","de":"ENTDECKEN"},"Settings":{"en":"Language","de":"Sprache"},"Dashboard":{"de":"Übersicht","en":"Dashboard"},"Weapon Database":{"en":"Weapon Database","de":"Waffendatenbank"},"News & Updates":{"de":"Neuigkeiten & Updates","en":"News & Updates"},"Fortnite Item Shop":{"en":"Fortnite Item Shop","de":"Fortnite Item-Shop"},"Alle Einträge der aktuellen Shop-Rotation – auch Angebote ohne Bild oder mit unvollständigen Metadaten.":{"en":"All offers in the current shop rotation, including offers with missing images or metadata.","de":"Alle Einträge der aktuellen Shop-Rotation – auch Angebote ohne Bild oder mit unvollständigen Metadaten."},"↻ Aktualisieren":{"en":"↻ Refresh","de":"↻ Aktualisieren"},"Shop wird geladen …":{"en":"Loading shop …","de":"Shop wird geladen …"},"Daten werden abgerufen.":{"en":"Fetching data.","de":"Daten werden abgerufen."},"Shop-Reihenfolge":{"en":"Shop order","de":"Shop-Reihenfolge"},"Name A–Z":{"en":"Name A–Z","de":"Name A–Z"},"Preis aufsteigend":{"en":"Price: low to high","de":"Preis aufsteigend"},"Preis absteigend":{"en":"Price: high to low","de":"Preis absteigend"},"Lade aktuelle Angebote …":{"en":"Loading current offers …","de":"Lade aktuelle Angebote …"},"Erfasse deine geöffneten Truhen und gefundenen Schätze und behalte deine Farm-Runden im Blick.":{"en":"Track opened chests, discovered treasures and your farming rounds.","de":"Erfasse deine geöffneten Truhen und gefundenen Schätze und behalte deine Farm-Runden im Blick."},"GESAMT GEÖFFNETE TRUHEN":{"en":"TOTAL CHESTS OPENED","de":"GESAMT GEÖFFNETE TRUHEN"},"GEFUNDENE SCHÄTZE":{"en":"TREASURES FOUND","de":"GEFUNDENE SCHÄTZE"},"GESPEICHERTE RUNDEN":{"en":"SAVED ROUNDS","de":"GESPEICHERTE RUNDEN"},"Über alle gespeicherten Runden":{"en":"Across all saved rounds","de":"Über alle gespeicherten Runden"},"Manuell erfasste Schätze":{"en":"Manually recorded treasures","de":"Manuell erfasste Schätze"},"Dein persönlicher Verlauf":{"en":"Your personal history","de":"Dein persönlicher Verlauf"},"Runde erfassen":{"en":"Record round","de":"Runde erfassen"},"Trage ein, wie viele Truhen und Schätze ihr in dieser Runde gefunden habt.":{"en":"Enter the chests and treasures found this round.","de":"Trage ein, wie viele Truhen und Schätze ihr in dieser Runde gefunden habt."},"Geöffnete Truhen":{"en":"Opened chests","de":"Geöffnete Truhen"},"Gefundene Schätze":{"en":"Treasures found","de":"Gefundene Schätze"},"Aktive Spieler":{"en":"Active players","de":"Aktive Spieler"},"1 Spieler":{"en":"1 player","de":"1 Spieler"},"2 Spieler (Duo)":{"en":"2 players (Duo)","de":"2 Spieler (Duo)"},"3 Spieler":{"en":"3 players","de":"3 Spieler"},"4 Spieler":{"en":"4 players","de":"4 Spieler"},"Runde speichern":{"en":"Save round","de":"Runde speichern"},"+1 Truhe":{"en":"+1 chest","de":"+1 Truhe"},"+5 Truhen":{"en":"+5 chests","de":"+5 Truhen"},"Deine Einträge werden lokal in diesem Browser gespeichert.":{"en":"Your entries are stored locally in this browser.","de":"Deine Einträge werden lokal in diesem Browser gespeichert."},"Gruppen-Farm-Rechner":{"en":"Group farming calculator","de":"Gruppen-Farm-Rechner"},"Berechne die erwartete Truhenmenge einer Gruppe anhand eurer durchschnittlichen Funde pro Spieler.":{"en":"Estimate group chest totals using average finds per player.","de":"Berechne die erwartete Truhenmenge einer Gruppe anhand eurer durchschnittlichen Funde pro Spieler."},"Spieler in der Gruppe":{"en":"Players in group","de":"Spieler in der Gruppe"},"Truhen pro Spieler":{"en":"Chests per player","de":"Truhen pro Spieler"},"Anzahl der Runden":{"en":"Number of rounds","de":"Anzahl der Runden"},"Rundenverlauf":{"en":"Round history","de":"Rundenverlauf"},"Deine zuletzt gespeicherten Farm-Runden.":{"en":"Your most recently saved farming rounds.","de":"Deine zuletzt gespeicherten Farm-Runden."},"DATUM":{"en":"DATE","de":"DATUM"},"TRUHEN":{"en":"CHESTS","de":"TRUHEN"},"SCHÄTZE":{"en":"TREASURES","de":"SCHÄTZE"},"SPIELER":{"en":"PLAYERS","de":"SPIELER"},"AKTION":{"en":"ACTION","de":"AKTION"},"Verlauf löschen":{"en":"Clear history","de":"Verlauf löschen"},"Noch keine Runden gespeichert.":{"en":"No rounds saved yet.","de":"Noch keine Runden gespeichert."},"Löschen":{"en":"Delete","de":"Löschen"},"NOT AFFILIATED WITH EPIC GAMES":{"en":"NOT AFFILIATED WITH EPIC GAMES","de":"NICHT MIT EPIC GAMES VERBUNDEN"},"TRACKER-DATEN BLEIBEN AUF DIESEM GERÄT":{"en":"TRACKER DATA STAYS ON THIS DEVICE","de":"TRACKER-DATEN BLEIBEN AUF DIESEM GERÄT"},"Coming soon":{"en":"Coming soon","de":"Demnächst"},"Dieser Bereich wird in einem kommenden Update mit Funktionen gefüllt.":{"en":"More features will arrive in a future update.","de":"Dieser Bereich wird in einem kommenden Update mit Funktionen gefüllt."},"Dein Companion":{"en":"Your Companion","de":"Dein Companion"},"Die Navigation ist bereits aktiv. Deine Pirate-Tracker-Daten bleiben lokal auf diesem Gerät gespeichert.":{"en":"Navigation is active. Your Pirate Tracker data stays on this device.","de":"Die Navigation ist bereits aktiv. Deine Pirate-Tracker-Daten bleiben lokal auf diesem Gerät gespeichert."},"Einstellungen für deinen Fortnite Companion.":{"en":"Customize your Fortnite Companion.","de":"Einstellungen für deinen Fortnite Companion."},"Spieler suchen":{"en":"Search player","de":"Spieler suchen"},"Spielername":{"en":"Player name","de":"Spielername"},"Konto":{"en":"Account","de":"Konto"},"Zeitraum":{"en":"Period","de":"Zeitraum"},"Gesamte Laufzeit":{"en":"Lifetime","de":"Gesamte Laufzeit"},"Aktuelle Season":{"en":"Current season","de":"Aktuelle Season"},"SPIELERPROFIL":{"en":"PLAYER PROFILE","de":"SPIELERPROFIL"},"SIEGE":{"en":"WINS","de":"SIEGE"},"ELIMINIERUNGEN":{"en":"ELIMINATIONS","de":"ELIMINIERUNGEN"},"SIEGQUOTE":{"en":"WIN RATE","de":"SIEGQUOTE"},"SPIELZEIT":{"en":"PLAYTIME","de":"SPIELZEIT"},"Statistiken nach Modus":{"en":"Stats by mode","de":"Statistiken nach Modus"},"Keine Modus-Aufschlüsselung von der API geliefert.":{"en":"No mode breakdown available from the API.","de":"Keine Modus-Aufschlüsselung von der API geliefert."},"LOKALES SPIELERPROFIL":{"en":"LOCAL PLAYER PROFILE","de":"LOKALES SPIELERPROFIL"},"Mein Companion-Profil":{"en":"My Companion profile","de":"Mein Companion-Profil"},"Kostenlos und ohne Registrierung. Deine Daten bleiben ausschließlich in diesem Browser. Kein Online-Login und keine automatische Synchronisierung.":{"en":"Free, no registration. Your data stays in this browser. No online login or automatic sync.","de":"Kostenlos und ohne Registrierung. Deine Daten bleiben ausschließlich in diesem Browser. Kein Online-Login und keine automatische Synchronisierung."},"Dein Profilname":{"en":"Your profile name","de":"Dein Profilname"},"Avatar auswählen":{"en":"Choose avatar","de":"Avatar auswählen"},"Gespeicherte Runden":{"en":"Saved rounds","de":"Gespeicherte Runden"},"Eigene Kartenmarker":{"en":"Custom map markers","de":"Eigene Kartenmarker"},"Daten sichern und übertragen":{"en":"Back up and transfer data","de":"Daten sichern und übertragen"},"Exportiere dein Profil, deine Runden und Kartenmarker als JSON-Datei. Auf einem anderen Gerät kannst du die Datei wieder importieren.":{"en":"Export your profile, rounds and map markers as JSON. Import the file on another device.","de":"Exportiere dein Profil, deine Runden und Kartenmarker als JSON-Datei. Auf einem anderen Gerät kannst du die Datei wieder importieren."},"↓ Backup herunterladen":{"en":"↓ Download backup","de":"↓ Backup herunterladen"},"↑ Backup importieren":{"en":"↑ Import backup","de":"↑ Backup importieren"},"Achtung: Löschen der Browserdaten kann deine gespeicherten Daten entfernen. Ein Backup ist die einzige Wiederherstellungsmöglichkeit.":{"en":"Warning: Clearing browser data can erase saved data. Keep a backup for recovery.","de":"Achtung: Löschen der Browserdaten kann deine gespeicherten Daten entfernen. Ein Backup ist die einzige Wiederherstellungsmöglichkeit."},"Schließen":{"en":"Close","de":"Schließen"},"Sprache & Einstellungen":{"de":"Sprache","en":"Language"},"Wähle deine bevorzugte Sprache für die Benutzeroberfläche.":{"en":"Choose your preferred interface language.","de":"Wähle deine bevorzugte Sprache für die Benutzeroberfläche."},"Sprache auswählen":{"en":"Choose language","de":"Sprache auswählen"},"Die Auswahl wird kostenlos und lokal in deinem Browser gespeichert.":{"en":"Your choice is saved locally in your browser at no cost.","de":"Die Auswahl wird kostenlos und lokal in deinem Browser gespeichert."},"Sprache der Website":{"en":"Website language","de":"Sprache der Website"},"Menüs und unterstützte Oberflächentexte werden übersetzt. Namen und Beschreibungen aus externen Fortnite-APIs sowie eigene Notizen bleiben unverändert. Keine zusätzlichen Kosten.":{"en":"Menus and supported interface text are translated. Names and descriptions from external Fortnite APIs and your notes stay unchanged. No additional cost.","de":"Menüs und unterstützte Oberflächentexte werden übersetzt. Namen und Beschreibungen aus externen Fortnite-APIs sowie eigene Notizen bleiben unverändert. Keine zusätzlichen Kosten."},"YOUR FORTNITE HUB":{"de":"DEIN FORTNITE-HUB","en":"YOUR FORTNITE HUB"},"Stats, tools, loot and everything you need":{"de":"Statistiken, Tools, Beute und alles, was du brauchst","en":"Stats, tools, loot and everything you need"},"to stay ahead of the game.":{"de":"um im Spiel immer einen Schritt voraus zu sein.","en":"to stay ahead of the game."},"TOOLS":{"de":"TOOLS","en":"TOOLS"},"GAME MODE":{"de":"SPIELMODUS","en":"GAME MODE"},"ZERO BUILD":{"de":"NULL BAUEN","en":"ZERO BUILD"},"Pirate Tracker":{"de":"Piraten-Tracker","en":"Pirate Tracker"},"Item Shop":{"de":"Item-Shop","en":"Item Shop"},"Player Stats":{"de":"Spielerstatistiken","en":"Player Stats"},"Interactive Map":{"de":"Interaktive Karte","en":"Interactive Map"},"Language":{"de":"Sprache","en":"Language"},"ONLINE":{"de":"ONLINE","en":"ONLINE"},"LIVE SHOP":{"de":"LIVE-SHOP","en":"LIVE SHOP"},"Cosmetics suchen …":{"de":"Kosmetische Gegenstände suchen …","en":"Search cosmetics …"},"Sortierung":{"de":"Sortierung","en":"Sort order"},"Quelle:":{"de":"Quelle:","en":"Source:"},"(Drittanbieter). Keine Verbindung zu Epic Games.":{"de":"(Drittanbieter). Keine Verbindung zu Epic Games.","en":"(third party). Not affiliated with Epic Games."},"Menschen-Symbol":{"de":"Menschen-Symbol","en":"person icon"},"um dein kostenloses lokales Profil einzurichten, deine Daten zu speichern und ein Backup zu erstellen. Deine Daten bleiben in diesem Browser – für andere Geräte kannst du dein Backup importieren.":{"de":"um dein kostenloses lokales Profil einzurichten, deine Daten zu speichern und ein Backup zu erstellen. Deine Daten bleiben in diesem Browser – für andere Geräte kannst du dein Backup importieren.","en":"to set up your free local profile, save your data and create a backup. Your data stays in this browser; you can import your backup on another device."},"Companion.":{"de":"Companion.","en":"Companion."},"Companion v1.1":{"de":"Companion v1.1","en":"Companion v1.1"},"Statistiken, Tools, Beute und alles, was du brauchst":{"de":"Statistiken, Tools, Beute und alles, was du brauchst","en":"Stats, tools, loot and everything you need"},"Willkommen bei":{"de":"Willkommen bei","en":"Welcome to"},"RUNDEN":{"de":"RUNDEN","en":"ROUNDS"},"Keine Daten":{"de":"Keine Daten","en":"No data"},"Profil speichern":{"de":"Profil speichern","en":"Save profile"},"Profil öffnen":{"de":"Profil öffnen","en":"Open profile"},"Profil gespeichert.":{"de":"Profil gespeichert.","en":"Profile saved."},"Backup wurde heruntergeladen.":{"de":"Backup wurde heruntergeladen.","en":"Backup downloaded."},"Backup erfolgreich importiert.":{"de":"Backup erfolgreich importiert.","en":"Backup imported successfully."},"LOCAL PLAYER PROFILE":{"de":"LOKALES SPIELERPROFIL","en":"LOCAL PLAYER PROFILE"},"Save":{"de":"Speichern","en":"Save"},"Cancel":{"de":"Abbrechen","en":"Cancel"},"Keine Verbindung zu Epic Games.":{"de":"Keine Verbindung zu Epic Games.","en":"Not affiliated with Epic Games."},"Willkommen bei Companion.":{"de":"Willkommen bei Companion.","en":"Welcome to Companion."},"Stats, tools, loot and everything you need to stay ahead of the game.":{"de":"Statistiken, Tools, Beute und alles, was du brauchst, um im Spiel voraus zu sein.","en":"Stats, tools, loot and everything you need to stay ahead of the game."}};
let currentLanguage=(()=>{try{return ['de','en'].includes(localStorage.getItem(LANGUAGE_KEY))?localStorage.getItem(LANGUAGE_KEY):'de';}catch{return 'de';}})();
const originalUiText=new WeakMap();
function translateUi(root=document){
  document.documentElement.lang=currentLanguage;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    const parent=node.parentElement;
    if(!parent||parent.closest('script,style,textarea,code,pre,[data-no-translate]'))continue;
    const initial=originalUiText.has(node)?originalUiText.get(node):node.nodeValue;
    const key=initial.trim();
    if(!Object.prototype.hasOwnProperty.call(UI_TRANSLATIONS,key))continue;
    if(!originalUiText.has(node))originalUiText.set(node,initial);
    const leading=initial.match(/^\s*/)[0],trailing=initial.match(/\s*$/)[0];
    const next=leading+UI_TRANSLATIONS[key][currentLanguage]+trailing;
    if(node.nodeValue!==next)node.nodeValue=next;
  }
  root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el=>{
    for(const attr of ['placeholder','aria-label','title']){
      const raw=el.getAttribute(attr);if(!raw)continue;
      const key='data-original-'+attr;
      const original=el.getAttribute(key)||raw;
      if(UI_TRANSLATIONS[original]){el.setAttribute(key,original);el.setAttribute(attr,UI_TRANSLATIONS[original][currentLanguage]);}
    }
  });
}
let translatingUi=false;
const languageObserver=new MutationObserver(()=>{
  if(translatingUi)return;
  translatingUi=true;
  try{translateUi(document.body);}finally{translatingUi=false;}
});
languageObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
function setSiteLanguage(lang){
  if(!LANGUAGES[lang])return;
  currentLanguage=lang;
  try{localStorage.setItem(LANGUAGE_KEY,lang);}catch{}
  translateUi(document.body);
  const page=document.querySelector('.nav-item.active[data-page]')?.dataset.page||'Dashboard';
  selectPage(page);
  translateUi(document.body);
}
function renderSettings(){
  content.innerHTML=`<div class="page-header"><div class="eyebrow">FORTNITE COMPANION</div><h1>Language</h1><p>Wähle deine bevorzugte Sprache für die Benutzeroberfläche.</p></div>
    <div class="panel-card language-settings"><h2>Sprache auswählen</h2><p>Die Auswahl wird kostenlos und lokal in deinem Browser gespeichert.</p>
    <label for="siteLanguage">Sprache der Website</label>
    <select id="siteLanguage" aria-label="Sprache der Website">${Object.entries(LANGUAGES).map(([code,name])=>`<option value="${code}" ${currentLanguage===code?'selected':''}>${name}</option>`).join('')}</select>
    <p class="language-note">Menüs und unterstützte Oberflächentexte werden übersetzt. Namen und Beschreibungen aus externen Fortnite-APIs sowie eigene Notizen bleiben unverändert. Keine zusätzlichen Kosten.</p></div>
    <footer><span>FORTNITE COMPANION</span><span>NOT AFFILIATED WITH EPIC GAMES</span></footer>`;
  document.getElementById('siteLanguage').addEventListener('change',e=>setSiteLanguage(e.target.value));
  translateUi(content);
}
translateUi(document.body);
