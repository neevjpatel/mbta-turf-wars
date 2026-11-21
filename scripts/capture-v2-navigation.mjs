import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9225";
const preview = process.env.PREVIEW_URL ?? "http://localhost:3001";
const output = path.resolve("artifacts/v2-navigation-review");
await mkdir(output, { recursive: true });

const page = await fetch(`${endpoint}/json/new?${encodeURIComponent(preview)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const callback = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) callback.reject(new Error(message.error.message));
  else callback.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const commandId = ++id; pending.set(commandId, { resolve, reject }); socket.send(JSON.stringify({ id: commandId, method, params })); });
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

async function navigate(url) { await send("Page.navigate", { url: `${preview}${url}` }); await wait(1100); }
async function viewport(width, height) { await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }); await wait(160); }
async function capture(name) { const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true }); await writeFile(path.join(output, name), Buffer.from(result.data, "base64")); }
async function waitFor(check, timeout = 6500) { const started = Date.now(); while (Date.now() - started < timeout) { if (await evaluate(check)) return; await wait(25); } throw new Error(`Timed out: ${check}`); }
async function report(label) { return evaluate(`(() => { const visible=(selector)=>{const element=document.querySelector(selector); return Boolean(element && element.getClientRects().length && getComputedStyle(element).display!=='none')}; return { label:${JSON.stringify(label)}, path:location.pathname+location.search, width:innerWidth, height:innerHeight, scrollWidth:document.documentElement.scrollWidth, scrollHeight:document.documentElement.scrollHeight, selectedGame:document.querySelector('.experience')?.dataset.selectedGame, phase:document.querySelector('.experience')?.dataset.journeyPhase, doors:document.querySelector('.train-doors')?.dataset.doorState, destination:document.querySelector('.authentic-destination strong')?.textContent, gamePanels:[...document.querySelectorAll('.game-stop-panel')].filter((element)=>element.getClientRects().length).length, gameVisible:visible('.turf-game'), trainVisible:visible('.subway-train'), operatorVisible:visible('.operator-head'), soundOn:document.querySelector('.audio-toggle')?.getAttribute('aria-pressed') } })()`); }

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await viewport(1920, 1080);
await navigate("/");
const reports = [];
reports.push(await report("turf-stop"));
await capture("stop-turf-1920x1080.png");

for (const [difficulty, destination] of [["Easy", "BOSTON COLLEGE"], ["Medium", "BOWDOIN"], ["Hard", "FOREST HILLS"], ["Extreme", "BRAINTREE"]]) {
  await evaluate(`[...document.querySelectorAll('.roof-difficulty button')].find((button)=>button.textContent.includes(${JSON.stringify(difficulty)}))?.click()`);
  await wait(120);
  const actual = await evaluate(`document.querySelector('.authentic-destination strong')?.textContent`);
  if (actual !== destination) throw new Error(`${difficulty} destination mismatch: ${actual}`);
  await capture(`difficulty-${difficulty.toLowerCase()}-${destination.toLowerCase().replaceAll(" ", "-")}.png`);
}

if (await evaluate(`document.querySelector('.audio-toggle')?.getAttribute('aria-pressed')`) !== "true") {
  await evaluate(`document.querySelector('.audio-toggle')?.click()`);
  await wait(120);
}
await evaluate(`(() => {
  window.__oscillatorCount = 0;
  window.__journeyPhases = [];
  const train = document.querySelector('.experience');
  new MutationObserver(() => window.__journeyPhases.push(train.dataset.journeyPhase)).observe(train, { attributes:true, attributeFilter:['data-journey-phase'] });
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const original = AudioContextClass?.prototype.createOscillator;
  if (original) AudioContextClass.prototype.createOscillator = function (...args) { window.__oscillatorCount += 1; return original.apply(this, args); };
})()`);
await evaluate(`document.querySelector('.right-side .train-nav-button')?.click(); document.querySelector('.right-side .train-nav-button')?.click()`);
await waitFor(`document.querySelector('.experience')?.dataset.journeyPhase === 'doors_closing'`);
await capture("doors-closing-1920x1080.png");
await waitFor(`document.querySelector('.experience')?.dataset.journeyPhase === 'in_transit'`);
await capture("in-transit-1920x1080.png");
await waitFor(`document.querySelector('.experience')?.dataset.journeyPhase === 'idle' && document.querySelector('.experience')?.dataset.selectedGame === 'signal'`);
reports.push({ ...(await report("signal-stop")), oscillatorCount: await evaluate(`window.__oscillatorCount`), observedPhases: await evaluate(`window.__journeyPhases`) });
await capture("stop-signal-1920x1080.png");

await evaluate(`document.querySelector('.right-side .train-nav-button')?.click()`);
await waitFor(`document.querySelector('.experience')?.dataset.journeyPhase === 'idle' && document.querySelector('.experience')?.dataset.selectedGame === 'charlie'`);
reports.push(await report("charlie-stop"));
await capture("stop-charlie-1920x1080.png");

await navigate("/?station=turf");
await evaluate(`document.querySelector('.play-game-button')?.click()`);
await waitFor(`location.pathname === '/play/turf' && Boolean(document.querySelector('.turf-game'))`);
await waitFor(`Boolean(document.querySelector('.leaflet-container'))`, 10000);
await wait(1000);
reports.push(await report("full-window-game"));
await capture("full-window-turf-capture-1920x1080.png");
await evaluate(`window.confirm=()=>true; document.querySelector('.exit-game-button')?.click()`);
await waitFor(`location.pathname === '/' && document.querySelector('.experience')?.dataset.selectedGame === 'turf'`);
reports.push(await report("returned-to-station"));

await navigate("/history");
reports.push(await report("history"));
await capture("history-1920x1080.png");

await navigate("/?station=turf");
for (const [width, height] of [[1440, 900], [1366, 768]]) {
  await viewport(width, height);
  reports.push(await report(`home-${width}x${height}`));
  await capture(`stop-turf-${width}x${height}.png`);
}

await writeFile(path.join(output, "navigation-report.json"), `${JSON.stringify(reports, null, 2)}\n`);
console.log(JSON.stringify(reports, null, 2));
socket.close();
