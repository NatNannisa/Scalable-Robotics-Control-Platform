const assets = {
  robot: "public/references/robot-mascot.png",
  mascot: "public/references/asset-mascot-standing.png.png",
  duo: "public/references/robot-duo.png",
  shrimp: "public/references/robot-shrimpy-joy.png",
  space: "public/references/robot-mission-space.png"
};

const API_BASE_URL = "https://cp-robot-control-room.onrender.com";
const USE_BACKEND_API = true;
const state = { current: "control-overview", camera: "POV", route: 0, backendConnected: false };

async function fetchDashboardData(endpoint, fallbackData) {
  if (!USE_BACKEND_API) return fallbackData;
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`API request failed with ${response.status}`);
    state.backendConnected = true;
    return await response.json();
  } catch (error) {
    console.warn(`Using mock fallback for ${endpoint}:`, error.message);
    return fallbackData;
  }
}

const navGroups = [
  ["ศูนย์ควบคุม", "Control Center", "⌂", [["control-overview", "Overview"], ["store-map", "3D Store Map"], ["live-camera", "Live Camera"], ["event-log", "Event Log"], ["alert", "Alert"]]],
  ["Analytics", "ข้อมูลเชิงวิเคราะห์", "⌁", [["kpi-overview", "KPI Overview"], ["engagement-funnel", "Engagement Funnel"], ["trend-report", "Trend & Report"], ["zone-analytics", "Zone Analytics"], ["customer-insight", "Customer Insight"]]],
  ["Management", "จัดการระบบ", "☷", [["campaigns", "Campaigns"], ["scripts", "Scripts"], ["zones-routes", "Zones & Routes"]]],
  ["Data Science Lab", "โมเดลและการเรียนรู้", "✧", [["data-science-lab", "Owner Lab"]]],
  ["ตั้งค่า", "Settings", "⚙", [["settings", "Settings"]]]
];

const meta = {
  "control-overview": ["ศูนย์ควบคุมหุ่นยนต์", "Robot Control Center", "Control Center", "⌂"],
  "store-map": ["แผนที่ร้านค้า 3 มิติ", "3D Store Map", "Control Center", "⌬"],
  "live-camera": ["กล้องมุมมองหุ่นยนต์", "Live Camera", "Control Center", "◉"],
  "event-log": ["บันทึกเหตุการณ์", "Event Log", "Control Center", "☰"],
  alert: ["สรุปการแจ้งเตือน", "Alert Summary", "Control Center", "!"],
  "kpi-overview": ["Analytics", "KPI Overview", "Analytics", "⌁"],
  "engagement-funnel": ["Engagement Funnel", "Sampling Conversion", "Analytics", "▽"],
  "trend-report": ["Trend & Report", "Sales Impact", "Analytics", "⌇"],
  "zone-analytics": ["Zone Analytics", "Best Zone", "Analytics", "◎"],
  "customer-insight": ["Customer Insight", "Peak Time / Best Branch", "Analytics", "◌"],
  campaigns: ["Campaign Management", "Current Campaigns", "Management", "✦"],
  scripts: ["Script Management", "Scripts", "Management", "☷"],
  "zones-routes": ["Zones & Routes", "Route Readiness", "Management", "⌁"],
  "data-science-lab": ["Data Science Lab", "Owner-only R&D Area", "Private Lab", "✧"],
  settings: ["ตั้งค่าระบบ", "Settings", "Settings", "⚙"]
};

let ops = [
  ["ภารกิจวันนี้", "18", "Tasks Today", "blue"],
  ["ระยะทางรวม", "12.4 กม.", "Total Distance", "cyan"],
  ["เวลาทำงาน", "06:42 ชม.", "Total Runtime", "green"],
  ["การโต้ตอบลูกค้า", "243 ครั้ง", "Customer Interactions", "purpleText"]
];
let kpis = [
  ["Customers Approached", "2,845", "+18.7%", "blue"],
  ["Sampling Conversion", "28.6%", "+6.3%", "green"],
  ["Sales Uplift", "฿1,245,600", "+24.4%", "purpleText"],
  ["Product Interest", "1,257", "+14.2%", "yellow"],
  ["ROI Score", "342%", "+19.6%", "red"]
];
let events = [
  ["10:24:31", "CP-BOT-01", "เดินทางถึง Frozen Food", "สำเร็จ", "green"],
  ["10:22:18", "CP-BOT-01", "โต้ตอบลูกค้า 3 ครั้ง", "สำเร็จ", "green"],
  ["10:19:45", "CP-BOT-01", "แบตเตอรี่ 78%", "ข้อมูล", "blue"],
  ["10:15:09", "CP-BOT-02", "ชะลอใกล้ Mini Corner", "เตือน", "yellow"],
  ["10:14:02", "CP-BOT-02", "พบสิ่งกีดขวางชั่วคราว", "เตือน", "yellow"]
];
let alerts = [["!", "แบตเตอรี่ต่ำกว่า 20%", "2", "red"], ["!", "หุ่นยนต์หยุดนิ่งเกิน 5 นาที", "1", "yellow"], ["i", "บำรุงรักษาตามกำหนด", "3", "blue"], ["△", "พื้นที่สัญญาณอ่อน", "1", "purpleText"]];
let zones = [["1", "Frozen Food", "685", "32.1%"], ["2", "Mini Corner", "612", "29.3%"], ["3", "Promotion Zone", "498", "27.8%"], ["4", "Fresh Zone", "421", "26.4%"], ["5", "Beverage Zone", "363", "24.7%"]];
let routes = [["CP Hypermarket Bangna", "Entrance -> Frozen Food -> Promotion Island", "พร้อมใช้งาน", "green", "94%"], ["CP Hypermarket Rangsit", "Entrance -> Beverages -> Household", "พร้อมใช้งาน", "green", "91%"], ["CP Hypermarket Chiang Mai", "Entrance -> Bakery -> Mini Corner", "ปิดปรับปรุง", "yellow", "78%"], ["CP Hypermarket Hat Yai", "Entrance -> Frozen Zone -> Cashier", "Critical", "red", "42%"]];

const $ = id => document.getElementById(id);

function renderNav() {
  $("sidebarNav").innerHTML = navGroups.map(([th, en, icon, items]) => {
    const active = items.some(([id]) => id === state.current);
    return `<section class="nav-card"><button type="button" class="nav-main ${active ? "active" : ""}" data-page="${items[0][0]}"><span class="nav-icon">${icon}</span><span><b>${th}</b><small>${en}</small></span><span>${active ? "⌄" : "›"}</span></button>${active ? `<div class="subnav">${items.map(([id, label]) => `<button type="button" class="${id === state.current ? "active" : ""}" data-page="${id}">${label}</button>`).join("")}</div>` : ""}</section>`;
  }).join("");
}

function metric([label, value, note, tone]) {
  return `<article class="metric ${tone}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}
function row(label, value) {
  return `<div class="row"><span>${label}</span><b>${value}</b></div>`;
}

function mapCard(size = "large") {
  const shelves = Array.from({ length: 18 }, (_, index) => `<i class="market-shelf" style="left:${13 + (index % 6) * 12}%;top:${24 + Math.floor(index / 6) * 17}%"><b></b><em></em></i>`).join("");
  const wireBlocks = Array.from({ length: 42 }, (_, index) => `<i class="wire-block" style="left:${11 + (index % 14) * 6.2}%;top:${30 + Math.floor(index / 14) * 17.5}%"></i>`).join("");
  return `<article class="glass map-card ${size}"><div class="head"><div><h2>3D Store Map <span class="badge green">LIVE</span></h2><p class="muted">แผนที่ร้านค้าแบบ 3 มิติ (Digital Twin)</p></div><div class="map-top-actions"><button type="button" class="chip">ชั้น 1⌄</button><button type="button" class="chip">⛶</button></div></div><div class="map-stage hyper-stage blueprint-map"><div class="hyper-store"><div class="store-base"></div><div class="store-wireframe"></div>${wireBlocks}${shelves}<i class="freezer-case f1"><span>Frozen</span></i><i class="freezer-case f2"><span>Cold</span></i><i class="produce-island p1"><span>Fresh</span></i><i class="produce-island p2"><span>Bakery</span></i><i class="checkout-bank"><span>Checkout</span></i><svg class="route-svg iso-route" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M10 70 C20 55 30 58 38 48 S50 36 60 42 S66 66 77 55 S89 40 95 45" /></svg><span class="wp" style="left:12%;top:70%"></span><span class="wp" style="left:38%;top:48%"></span><span class="wp" style="left:60%;top:42%"></span><span class="wp" style="left:77%;top:55%"></span><span class="wp" style="left:95%;top:45%"></span><span class="bot-pin iso-bot"><img src="${assets.robot}" alt="CP robot marker"></span><span class="zone-label z1">โซนเครื่องดื่ม</span><span class="zone-label z2">โซนของใช้ในบ้าน</span><span class="zone-label z3">โซนอาหารสด</span><span class="zone-label z4">โซนเบเกอรี่</span><span class="charge-label">จุดชาร์จแบต <b>100%</b></span></div><div class="robot-chip"><img src="${assets.robot}" alt=""><b>CP-BOT-01 <em>กำลังทำงาน</em></b><span>กำลังเดินทางไป โซนเครื่องดื่ม</span></div><div class="map-controls"><button type="button">+</button><button type="button">−</button><button type="button">⛶</button></div></div></article>`;
}

function cameraCard(withTabs = true) {
  const tabs = ["POV", "Front", "Left", "Right", "Rear"].map(view => `<button type="button" data-camera="${view}" class="${state.camera === view ? "active" : ""}">${view}</button>`).join("");
  return `<article class="glass live-camera-card">
    <div class="head">
      <div><h2>Live Camera <span class="badge green">LIVE</span></h2><p class="muted">&#x0E01;&#x0E25;&#x0E49;&#x0E2D;&#x0E07;&#x0E21;&#x0E38;&#x0E21;&#x0E21;&#x0E2D;&#x0E07;&#x0E2B;&#x0E38;&#x0E48;&#x0E19;&#x0E22;&#x0E19;&#x0E15;&#x0E4C;</p></div>
      <div class="camera-icons"><span class="signal-bars"><i></i><i></i><i></i><i></i></span><span class="battery-icon"></span></div>
    </div>
    <div class="camera pov-camera">
      <div class="aisle-depth"></div>
      <div class="ceiling-light c1"></div><div class="ceiling-light c2"></div><div class="ceiling-light c3"></div>
      <div class="shelf-wall left"><i></i><i></i><i></i></div>
      <div class="shelf-wall right"><i></i><i></i><i></i></div>
      <div class="aisle-floor"></div>
      <div class="robot-hood"><span>CP</span></div>
      <i class="hud-corner tl"></i><i class="hud-corner tr"></i><i class="hud-corner bl"></i><i class="hud-corner br"></i>
    </div>
    ${withTabs ? `<div class="tabs camera-tabs camera-tabs-ref">${tabs}<button type="button" class="expand-btn">&#x26F6;</button></div>` : ""}
  </article>`;
}

function robotStatus() {
  return `<article class="glass purple robot-status"><div class="head"><div><h2>สถานะหุ่นยนต์</h2><p class="muted">Robot Status</p></div><span class="badge green">Online</span></div><img src="${assets.robot}" alt="CP robot"><div>${row("Robot", "CP-BOT-01")}${row("Battery", "78%")}<div class="bar"><i style="width:78%"></i></div>${row("Speed", "0.6 m/s")}${row("Mode", "เดินอัตโนมัติ")}</div></article>`;
}
function eventLog(full = false) {
  const rows = (full ? events.concat(events) : events).map(e => `<div class="event-row"><span>${e[0]}</span><b>${e[1]}</b><span>${e[2]}</span><b class="${e[4]}">${e[3]}</b></div>`).join("");
  return `<article class="glass"><div class="head"><div><h2>Event Log <span class="badge green">LIVE</span></h2><p class="muted">บันทึกเหตุการณ์</p></div><button class="chip" data-page="event-log">ดูทั้งหมด</button></div>${rows}</article>`;
}
function alertCard(full = false) {
  return `<article class="glass purple"><div class="head"><div><h2>Alert Summary</h2><p class="muted">สรุปการแจ้งเตือน</p></div><button class="chip" data-page="alert">ดูทั้งหมด</button></div>${alerts.map(a => `<div class="alert-row"><b class="${a[3]}">${a[0]}</b><span>${a[1]}</span><b class="${a[3]}">${a[2]}</b></div>`).join("")}${full ? `<p class="note">ทุก alert ต้องมี owner, robot, branch และ next action ก่อนปิดรายการ</p>` : ""}</article>`;
}
function routeReadiness() {
  return `<article class="glass"><div class="head"><div><h2>Route Readiness</h2><p class="muted">ความพร้อมของเส้นทาง</p></div><span class="badge green">92%</span></div><div class="bar"><i style="width:92%"></i></div>${routes.slice(0,3).map(r => row(r[0], r[4])).join("")}</article>`;
}

function controlPage() {
  if (state.current === "store-map") return `<div class="grid hero">${mapCard("focus")}<div class="stack">${robotStatus()}${alertCard()}${routeReadiness()}</div></div>`;
  if (state.current === "live-camera") return `<div class="grid hero">${cameraCard(true)}<div class="stack"><article class="glass"><div class="head"><div><h2>Camera Grid</h2><p class="muted">มุมกล้องสำรอง</p></div></div><div class="camera-grid">${["Front","Left","Right","Rear"].map(x=>`<button class="camera-tile" data-camera="${x}"><span class="badge green">${x}</span></button>`).join("")}</div></article>${robotStatus()}</div></div>`;
  if (state.current === "event-log") return `<div class="grid hero">${eventLog(true)}<div class="stack">${mapCard("small")}${robotStatus()}</div></div>`;
  if (state.current === "alert") return `<div class="grid hero">${alertCard(true)}<div class="stack">${routeReadiness()}${eventLog()}</div></div>`;
  return `<div class="grid hero control-top">${mapCard("large")}${cameraCard()}</div><div class="grid five control-lower">${robotStatus()}${ops.map(metric).join("")}</div><div class="grid two">${eventLog()}${alertCard()}</div>`;
}

function analyticsPage() {
  const funnel = `<article class="glass"><div class="head"><div><h2>Engagement Funnel</h2><p class="muted">Robot Operation → Customer Engagement → Sales Impact</p></div></div>${[["Customers approached","5,420","100%"],["Interactions","2,845","52%"],["Samples accepted","814","28.6%"],["Purchase linked","352","12.9%"]].map((f,i)=>`<div class="funnel"><b>${f[0]}</b><div class="funnel-track"><i style="width:${[100,72,44,28][i]}%"></i></div><span>${f[2]}</span></div>`).join("")}</article>`;
  const trend = `<article class="glass"><div class="head"><div><h2>Trend & Report</h2><p class="muted">Sampling conversion and uplift</p></div><span class="badge cyan">7 days</span></div><div class="trend"><svg viewBox="0 0 700 300"><polyline fill="none" stroke="#43ddff" stroke-width="6" stroke-linecap="round" points="20,240 120,210 220,160 320,180 420,120 520,92 660,54"/><polyline fill="none" stroke="#a564ff" stroke-width="5" stroke-linecap="round" points="20,260 120,230 220,210 320,170 420,150 520,112 660,86"/></svg></div></article>`;
  const zone = `<article class="glass"><div class="head"><div><h2>Zone Analytics</h2><p class="muted">Best engagement zones</p></div></div>${zones.map(z=>`<div class="zone-row"><b class="rank">${z[0]}</b><span>${z[1]}</span><b>${z[2]}</b><b class="green">${z[3]}</b></div>`).join("")}</article>`;
  const insight = `<article class="glass purple"><div class="head"><div><h2>Customer Insight</h2><p class="muted">Executive signal summary</p></div></div>${[["ช่วงเวลาที่ดีที่สุด","17:00 - 19:00"],["สาขาที่ conversion สูงสุด","บางนา"],["สินค้าที่สนใจสูงสุด","CP Shrimp Snack"],["Model confidence","91.4%"]].map(x=>`<div class="insight-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</article>`;
  const highlight = `<article class="glass"><div class="performance"><img src="${assets.shrimp}" alt="campaign robot"><div><div class="head"><div><h2>Performance Highlight</h2><p class="muted">Sampling conversion is above target</p></div></div><div class="rating">★★★★★</div><p class="muted">Recommend extending beverage and snack routes during after-work peak time.</p></div></div></article>`;
  return `<div class="grid five">${kpis.map(metric).join("")}</div><div class="grid two">${state.current === "trend-report" ? trend + funnel : funnel + trend}</div><div class="grid three">${zone}${highlight}${insight}</div>`;
}

function managementPage() {
  const campaigns = `<article class="glass"><div class="head"><div><h2>แคมเปญปัจจุบัน</h2><p class="muted">Current Campaigns</p></div><button class="primary">เพิ่มแคมเปญ</button></div><div class="campaign-grid"><article class="campaign"><span class="badge green">LIVE</span><h2>Shrimpy Joy</h2><p>อร่อยฟิน กุ้งเด้งเต็มคำ</p><button class="primary">รายละเอียด</button><img src="${assets.shrimp}" alt=""></article><article class="campaign space"><span class="badge green">LIVE</span><h2>Mission to Space</h2><p>ภารกิจอร่อยทะลุอวกาศ</p><button class="primary">รายละเอียด</button><img src="${assets.space}" alt=""></article></div></article>`;
  const scripts = `<article class="glass"><div class="head"><div><h2>การจัดการสคริปต์</h2><p class="muted">Script Management</p></div></div>${row("Greeting & Promotion Script","ใช้งานอยู่")}${row("Product Recommendation Script","เวอร์ชัน 1.8")}</article>`;
  const owners = `<article class="glass"><div class="head"><div><h2>เจ้าของเนื้อหา</h2><p class="muted">Content Owners</p></div></div>${row("คุณณัฐสิริ ร.","12 แคมเปญ")}${row("คุณธนพล ช.","8 แคมเปญ")}${row("คุณอรัญญา น.","6 แคมเปญ")}</article>`;
  return `<div class="grid hero">${campaigns}<div class="stack">${routeReadiness()}${owners}</div></div><div class="grid three">${scripts}${owners}${routeReadiness()}</div><div class="grid four">${routes.map((r,i)=>`<article class="glass route-card ${i===state.route?"selected":""}" data-route="${i}"><div class="head"><div><h2>${r[0]}</h2><p class="muted">${r[1]}</p></div><span class="${r[3]}">${r[2]}</span></div><div class="route-preview ${r[3]}"><svg viewBox="0 0 320 120"><path d="M20 86 L70 50 L126 66 L184 34 L246 58 L300 25" /></svg></div>${row("Operating Hours","08:00 - 22:00")}${row("Readiness",r[4])}</article>`).join("")}</div>`;
}

function labPage() {
  return `<div class="grid lab-hero">${[["A/B Test","7","Win Rate 71%"],["Optimization","5","Improvement +18.6%"],["Model Tuning","3","Last update 2h ago"]].map(x=>`<article class="glass purple"><div class="head"><div><h2>${x[0]}</h2><p class="muted">Owner-only R&D</p></div><span class="badge purpleText">Owner</span></div><h1>${x[1]}</h1><p class="green">${x[2]}</p></article>`).join("")}</div><div class="grid four">${[["Detection Accuracy","97.8%","+2.3%","green"],["Engagement Prediction","89.6%","+3.1%","cyan"],["Route Success Rate","94.2%","+1.8%","blue"],["Daily Data Volume","342.7 GB","+27.4%","purpleText"]].map(metric).join("")}</div><div class="grid two"><article class="glass"><div class="head"><div><h2>Simulation / Heatmap</h2><p class="muted">Route and traffic analysis</p></div></div><div class="heatmap"></div></article><article class="glass purple"><h2>Notebook & Insights</h2><p class="muted">เส้นทางใกล้ชั้นแช่เย็นเพิ่ม Engagement 22% และช่วง 18:00-20:00 มีโอกาสรับตัวอย่างสูงสุด</p></article></div>`;
}

function settingsPage() {
  return `<article class="glass" style="min-height:430px;display:grid;place-items:center;text-align:center"><div><h1>Settings</h1><p class="muted">Standalone demo settings for branch, robot, campaign, language, and owner access.</p><button class="primary" style="margin-top:18px">บันทึกการตั้งค่า</button></div></article>`;
}

function render() {
  renderNav();
  const [title, subtitle, group, icon] = meta[state.current] || meta["control-overview"];
  $("pageGroup").textContent = group;
  $("pageTitle").textContent = title;
  $("pageSubtitle").textContent = subtitle;
  const pageIcon = $("pageIcon");
  if (pageIcon) pageIcon.textContent = icon;
  if (state.current.startsWith("control") || ["store-map", "live-camera", "event-log", "alert"].includes(state.current)) $("pageRoot").innerHTML = controlPage();
  else if (["kpi-overview", "engagement-funnel", "trend-report", "zone-analytics", "customer-insight"].includes(state.current)) $("pageRoot").innerHTML = analyticsPage();
  else if (["campaigns", "scripts", "zones-routes"].includes(state.current)) $("pageRoot").innerHTML = managementPage();
  else if (state.current === "data-science-lab") $("pageRoot").innerHTML = labPage();
  else $("pageRoot").innerHTML = settingsPage();
}

function renderPage(pageName) {
  const aliases = { control: "control-overview", analytics: "kpi-overview", management: "campaigns", lab: "data-science-lab", map: "store-map", camera: "live-camera", events: "event-log", alert: "alert", alerts: "alert", routes: "zones-routes" };
  state.current = aliases[pageName] || pageName || "control-overview";
  render();
}

document.addEventListener("click", event => {
  const page = event.target.closest("[data-page]");
  if (page) { renderPage(page.dataset.page); return; }
  const cam = event.target.closest("[data-camera]");
  if (cam) { state.camera = cam.dataset.camera; render(); return; }
  const route = event.target.closest("[data-route]");
  if (route) { state.route = Number(route.dataset.route); render(); }
});

Object.assign(window, { renderPage, renderControlCenter: () => renderPage("control-overview"), renderAnalytics: () => renderPage("kpi-overview"), renderManagement: () => renderPage("campaigns"), renderDataScienceLab: () => renderPage("data-science-lab") });

function robotStatus() {
  return `<article class="glass purple robot-status-card"><div class="head"><div><h2>สถานะหุ่นยนต์</h2><p class="muted">Robot Status</p></div><span class="badge green">Online</span></div><div class="robot-status"><img src="${assets.robot}" alt="CP robot"><div>${row("Robot", "CP-BOT-01")}${row("Battery", "78%")}<div class="bar"><i style="width:78%"></i></div>${row("Speed", "0.6 m/s")}${row("Mode", "เดินอัตโนมัติ")}</div></div><button type="button" class="primary wide-btn">ดูรายละเอียด</button></article>`;
}

function statCard(label, value, sub, tone, icon) {
  return `<article class="metric ${tone} ops-card"><span>${icon} ${label}</span><strong>${value}</strong><small>${sub}</small></article>`;
}

function opsCards() {
  return [
    statCard("Tasks Today", "18", "เสร็จสิ้น 15 งาน", "blue", "▦"),
    statCard("Total Distance", "12.4", "เฉลี่ยต่อวัน 8.7 กม.", "green", "⌁"),
    statCard("Total Runtime", "06:42", "เฉลี่ยต่อวัน 05:11 ชม.", "cyan", "◷"),
    statCard("Customer Interactions", "243", "เฉลี่ยต่อวัน 174 ครั้ง", "purpleText", "✣")
  ].join("");
}

function eventLog(full = false) {
  const rows = (full ? events.concat(events) : events).map(item => `<div class="event-row"><span>${item[0]}</span><b>${item[1]}</b><span>${item[2]}</span><b class="${item[4]}">${item[3]}</b></div>`).join("");
  return `<article class="glass"><div class="head"><div><h2>Event Log <span class="badge green">LIVE</span></h2><p class="muted">บันทึกเหตุการณ์</p></div><button class="chip" data-page="event-log">ดูทั้งหมด ›</button></div>${rows}</article>`;
}

function alertCard(full = false) {
  const note = full ? `<p class="note">ทุก alert ต้องมี owner, robot, branch และ next action ก่อนปิดรายการ</p>` : "";
  return `<article class="glass purple"><div class="head"><div><h2>Alert Summary</h2><p class="muted">สรุปการแจ้งเตือน</p></div><button class="chip" data-page="alert">ดูทั้งหมด ›</button></div>${alerts.map(item => `<div class="alert-row"><b class="${item[3]}">${item[0]}</b><span>${item[1]}</span><b class="${item[3]}">${item[2]}</b></div>`).join("")}${note}</article>`;
}

function routeReadiness() {
  return `<article class="glass"><div class="head"><div><h2>Route Readiness</h2><p class="muted">สถานะเส้นทางบริการ</p></div><span class="badge green">91%</span></div>${routes.map((route, index) => `<button type="button" class="glass route-card ${state.route === index ? "selected" : ""}" data-route="${index}"><b>${route[0]}</b><p class="muted">${route[1]}</p><div class="route-preview ${route[3]}"><svg viewBox="0 0 300 120"><path d="M20 90 C80 30 120 70 165 42 S230 20 280 70"/></svg></div><div class="row"><span class="${route[3]}">${route[2]}</span><b>${route[4]}</b></div></button>`).join("")}</article>`;
}

function controlPage() {
  if (state.current === "store-map") return `<div class="grid hero">${mapCard("focus")}<div class="stack">${robotStatus()}${alertCard()}${routeReadiness()}</div></div>`;
  if (state.current === "live-camera") return `<div class="grid hero">${cameraCard(true)}<div class="stack">${robotStatus()}${eventLog()}</div></div>`;
  if (state.current === "event-log") return `<div class="grid hero">${eventLog(true)}<div class="stack">${mapCard("small")}${robotStatus()}</div></div>`;
  if (state.current === "alert") return `<div class="grid hero">${alertCard(true)}<div class="stack">${routeReadiness()}${eventLog()}</div></div>`;
  return `<div class="grid hero control-top">${mapCard("large")}${cameraCard()}</div><div class="grid five control-lower">${robotStatus()}${opsCards()}</div><div class="grid two">${eventLog()}${alertCard()}</div>`;
}

function analyticsPage() {
  const funnel = `<article class="glass"><div class="head"><div><h2>Engagement Funnel</h2><p class="muted">Robot Operation → Customer Engagement → Sales Impact</p></div></div>${[["เข้าหาลูกค้า","2,845","100%"],["หยุดสนใจ","1,642","57.7%"],["รับฟัง / แนะนำ","1,023","36.0%"],["รับตัวอย่างสินค้า","730","71.3%"],["เกิดการสั่งซื้อ","293","40.1%"]].map((item,index)=>`<div class="funnel"><b>${item[0]}</b><div class="funnel-track"><i style="width:${[100,78,58,42,24][index]}%"></i></div><span>${item[2]}</span></div>`).join("")}</article>`;
  const trend = `<article class="glass"><div class="head"><div><h2>Trend & Report</h2><p class="muted">Sampling conversion and uplift</p></div><span class="badge cyan">7 days</span></div><div class="trend"><svg viewBox="0 0 700 300"><polyline fill="none" stroke="#43ddff" stroke-width="6" stroke-linecap="round" points="20,240 120,210 220,160 320,180 420,120 520,92 660,54"/><polyline fill="none" stroke="#a564ff" stroke-width="5" stroke-linecap="round" points="20,260 120,230 220,210 320,170 420,150 520,112 660,86"/></svg></div></article>`;
  const zone = `<article class="glass"><div class="head"><div><h2>Zone Analytics</h2><p class="muted">Best engagement zones</p></div></div>${zones.map(item=>`<div class="zone-row"><b class="rank">${item[0]}</b><span>${item[1]}</span><b>${item[2]}</b><b class="green">${item[3]}</b></div>`).join("")}</article>`;
  const insight = `<article class="glass purple"><div class="head"><div><h2>Customer Insight</h2><p class="muted">Executive signal summary</p></div></div>${[["ช่วงเวลาที่ดีที่สุด","16:00 - 18:00"],["สาขาที่ผลงานดีที่สุด","CP Hypermarket บางนา"],["สินค้ายอดนิยม","CP Shrimp Snack"],["อัตราการกลับมาสนใจซ้ำ","18.7%"]].map(item=>`<div class="insight-row"><span>${item[0]}</span><b>${item[1]}</b></div>`).join("")}</article>`;
  return `<div class="grid five">${kpis.map(metric).join("")}</div><div class="grid two">${funnel}${trend}</div><div class="grid two">${zone}${insight}</div>`;
}

function managementPage() {
  return `<div class="grid hero"><article class="glass"><div class="head"><div><h2>Current Campaigns</h2><p class="muted">แคมเปญที่กำลังให้บริการ</p></div><span class="badge green">LIVE</span></div><div class="campaign-grid"><section class="campaign"><span class="badge green">Active</span><h2>Shrimpy Joy</h2><p class="muted">Sampling route for frozen food zone.</p><button class="primary">รายละเอียด</button><img src="${assets.shrimp}" alt="campaign robot"></section><section class="campaign space"><span class="badge blue">Live</span><h2>Mission to Space</h2><p class="muted">Promotion route for snack aisles.</p><button class="primary">รายละเอียด</button><img src="${assets.space}" alt="space robot"></section></div></article><div class="stack">${routeReadiness()}${alertCard()}</div></div>`;
}

function labPage() {
  return `<div class="grid lab-hero">${[["A/B Test","7","Win Rate 71%"],["Optimization","5","Improvement +18.6%"],["Model Tuning","3","Last update 2h ago"]].map(item=>`<article class="glass purple"><div class="head"><div><h2>${item[0]}</h2><p class="muted">โมเดลและการเรียนรู้</p></div></div>${row("Active", item[1])}${row("Signal", item[2])}</article>`).join("")}</div><div class="grid two"><article class="glass"><div class="head"><div><h2>Simulation / Analysis</h2><p class="muted">Heatmap</p></div></div><div class="heatmap"></div></article><article class="glass"><div class="head"><div><h2>Feature Distribution</h2><p class="muted">Sensor features</p></div></div><div class="bars">${[42,70,55,88,61,74,48,93,66,80,58,72].map(value=>`<i style="height:${value}%"></i>`).join("")}</div></article></div>`;
}

function settingsPage() {
  const backendStatus = state.backendConnected ? "Connected" : "Fallback active";
  const dataSource = state.backendConnected ? "Supabase API" : "Mock data";
  return `<div class="grid two"><article class="glass"><div class="head"><div><h2>Settings</h2><p class="muted">Standalone demo mode</p></div><span class="badge blue">Demo</span></div>${[["Backend",backendStatus],["Data source",dataSource],["Browser secret keys","None"],["Mode","Static HTML"]].map(item=>row(item[0], item[1])).join("")}</article><article class="glass purple"><div class="head"><div><h2>Brand & Display</h2><p class="muted">CP Control Room OS</p></div></div>${[["Theme","Premium dark"],["Language","Thai + English"],["Navigation","Single-page app"]].map(item=>row(item[0], item[1])).join("")}</article></div>`;
}

function mapCard(size = "large") {
  const shelves = Array.from({ length: 18 }, (_, index) => `<i class="market-shelf" style="left:${13 + (index % 6) * 12}%;top:${24 + Math.floor(index / 6) * 17}%"><b></b><em></em></i>`).join("");
  const wireBlocks = Array.from({ length: 42 }, (_, index) => {
    const wide = index % 9 === 0 ? " wide" : "";
    return `<i class="wire-block${wide}" style="left:${11 + (index % 14) * 6.2}%;top:${30 + Math.floor(index / 14) * 17.5}%"></i>`;
  }).join("");
  return `<article class="glass map-card ${size}"><div class="head"><div><h2>3D Store Map <span class="badge green">LIVE</span></h2><p class="muted">แผนที่ร้านค้าแบบ 3 มิติ (Digital Twin)</p></div><div class="map-top-actions"><button type="button" class="chip">ชั้น 1 ▾</button><button type="button" class="chip">⛶</button></div></div><div class="map-stage hyper-stage blueprint-map"><div class="hyper-store"><div class="store-base"></div><div class="store-wireframe"></div>${wireBlocks}${shelves}<i class="freezer-case f1"><span>Frozen</span></i><i class="freezer-case f2"><span>Cold</span></i><i class="produce-island p1"><span>Fresh</span></i><i class="produce-island p2"><span>Bakery</span></i><i class="checkout-bank"><span>Checkout</span></i><svg class="route-svg iso-route" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M10 70 L20 58 L36 58 L46 47 L59 47 L68 57 L78 57 L86 45 L95 45" /></svg><span class="wp" style="left:10%;top:70%"></span><span class="wp" style="left:20%;top:58%"></span><span class="wp" style="left:46%;top:47%"></span><span class="wp" style="left:68%;top:57%"></span><span class="wp" style="left:86%;top:45%"></span><span class="wp" style="left:95%;top:45%"></span><span class="bot-pin iso-bot"><img src="${assets.robot}" alt="CP robot marker"></span><span class="zone-label z1">โซนเครื่องดื่ม</span><span class="zone-label z2">โซนของใช้ในบ้าน</span><span class="zone-label z3">โซนอาหารสด</span><span class="zone-label z4">โซนเบเกอรี่</span><span class="charge-label">จุดชาร์จแบต <b>100%</b></span></div><div class="robot-chip"><img src="${assets.robot}" alt=""><b>CP-BOT-01 <em>กำลังทำงาน</em></b><span>กำลังเดินทางไป โซนเครื่องดื่ม</span></div><div class="map-controls"><button type="button">+</button><button type="button">−</button><button type="button">⛶</button></div></div></article>`;
}

function cameraCard(withTabs = true) {
  const tabs = ["POV", "Front", "Left", "Right", "Rear"].map(view => `<button type="button" data-camera="${view}" class="${state.camera === view ? "active" : ""}">${view}</button>`).join("");
  return `<article class="glass live-camera-card"><div class="head"><div><h2>Live Camera <span class="badge green">LIVE</span></h2><p class="muted">กล้องมุมมองหุ่นยนต์</p></div><div class="camera-health"><span class="signal-bars"><i></i><i></i><i></i><i></i></span><span class="battery-icon"></span></div></div><div class="camera live-pov reference-pov"><div class="camera-corners"></div><div class="pov-hood"></div><div class="hud"><span class="badge green">${state.camera}</span><span class="badge blue">Battery 78%</span></div></div>${withTabs ? `<div class="tabs camera-tabs">${tabs}<button type="button" class="camera-fullscreen">⛶</button></div>` : ""}</article>`;
}

function render() {
  renderNav();
  const [title, subtitle, group, icon] = meta[state.current] || meta["control-overview"];
  $("pageTitle").textContent = title;
  $("pageSubtitle").textContent = subtitle;
  $("pageGroup").textContent = group;
  $("pageIcon").textContent = icon;
  if (state.current.startsWith("control") || ["store-map", "live-camera", "event-log", "alert"].includes(state.current)) $("pageRoot").innerHTML = controlPage();
  else if (["kpi-overview", "engagement-funnel", "trend-report", "zone-analytics", "customer-insight"].includes(state.current)) $("pageRoot").innerHTML = analyticsPage();
  else if (["campaigns", "scripts", "zones-routes"].includes(state.current)) $("pageRoot").innerHTML = managementPage();
  else if (state.current === "data-science-lab") $("pageRoot").innerHTML = labPage();
  else $("pageRoot").innerHTML = settingsPage();
}

document.addEventListener("click", (event) => {
  const page = event.target.closest("[data-page]");
  if (page) { state.current = page.dataset.page; render(); return; }
  const camera = event.target.closest("[data-camera]");
  if (camera) { state.camera = camera.dataset.camera; render(); return; }
  const route = event.target.closest("[data-route]");
  if (route) { state.route = Number(route.dataset.route); render(); }
});

Object.assign(window, {
  mockData: { kpis, ops, events, alerts, zones, routes },
  API_BASE_URL,
  USE_BACKEND_API,
  fetchDashboardData,
  renderPage: (id) => { state.current = id || "control-overview"; render(); },
  renderControlCenter: () => { state.current = "control-overview"; render(); },
  getEventLogs: () => events,
  getAlerts: () => alerts,
  getRouteReadiness: () => ({ average: 91, routes })
});

render();

function metricTone(metric, index) {
  if (metric.status === "warning") return "yellow";
  return ["blue", "green", "purpleText", "yellow", "red"][index % 5];
}

function metricValue(metric) {
  const value = Number(metric.value);
  const formatted = Number.isFinite(value) ? value.toLocaleString("en-US") : metric.value;
  return metric.unit === "%" ? `${formatted}%` : metric.unit === "x" ? `${formatted}x` : formatted;
}

async function loadDashboardData() {
  const [overview, kpiResponse, eventResponse, alertResponse, zoneResponse, routeResponse] = await Promise.all([
    fetchDashboardData("/api/control-center/overview", null),
    fetchDashboardData("/api/analytics/kpi-overview", null),
    fetchDashboardData("/api/control-center/event-log", null),
    fetchDashboardData("/api/control-center/alerts", null),
    fetchDashboardData("/api/analytics/zone-analytics", null),
    fetchDashboardData("/api/management/zones-routes", null)
  ]);

  if (kpiResponse?.metrics?.length) {
    const preferred = ["customers_detected", "sampling_conversion", "sales_uplift", "product_interest", "roi_score"];
    const selected = preferred
      .map((id) => kpiResponse.metrics.find((metric) => metric.metric_id === id))
      .filter(Boolean);
    kpis = selected.map((metric, index) => [
      metric.label,
      metricValue(metric),
      `${Number(metric.trend_percent || 0) >= 0 ? "+" : ""}${metric.trend_percent || 0}%`,
      metricTone(metric, index)
    ]);
  }

  if (overview?.metrics?.length) {
    const ids = ["robots_online", "route_readiness", "avg_interaction_time", "safety_alerts"];
    ops = ids.map((id, index) => {
      const metric = overview.metrics.find((item) => item.metric_id === id);
      return metric
        ? [metric.label, metricValue(metric), metric.unit || "Live data", metricTone(metric, index)]
        : ops[index];
    });
  }

  if (eventResponse?.events?.length) {
    events = eventResponse.events.slice(0, 10).map((event) => [
      new Date(event.event_timestamp).toLocaleTimeString("th-TH", { hour12: false }),
      event.robot_id || "-",
      event.event_name,
      event.result_status || event.severity,
      event.severity === "warning" || event.severity === "critical" ? "yellow" : "green"
    ]);
  }

  if (alertResponse?.alerts?.length) {
    alerts = alertResponse.alerts.slice(0, 8).map((alert) => [
      alert.severity === "critical" ? "!" : "△",
      alert.message,
      alert.status === "live" ? "1" : "0",
      alert.severity === "critical" ? "red" : alert.severity === "warning" ? "yellow" : "blue"
    ]);
  }

  if (zoneResponse?.zones?.length) {
    zones = zoneResponse.zones.slice(0, 5).map((zone, index) => [
      String(index + 1),
      zone.zone_name,
      String(zone.interactions),
      `${zone.conversionPercent}%`
    ]);
  }

  if (routeResponse?.routes?.length) {
    const branchById = Object.fromEntries((routeResponse.branches || []).map((branch) => [branch.branch_id, branch]));
    routes = routeResponse.routes.map((route) => [
      branchById[route.branch_id]?.branch_name || route.route_name,
      (route.zone_sequence || []).join(" -> "),
      route.status === "ready" ? "พร้อมใช้งาน" : "ปิดปรับปรุง",
      route.status === "ready" ? "green" : "yellow",
      `${route.readiness_percent || 0}%`
    ]);
  }

  window.mockData = { kpis, ops, events, alerts, zones, routes };
  render();
}

loadDashboardData();
