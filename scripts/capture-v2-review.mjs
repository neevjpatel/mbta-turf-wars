import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9224";
const previewUrl = process.env.PREVIEW_URL ?? "http://localhost:3001";
const outputDirectory = path.resolve("artifacts/v2-review");
await mkdir(outputDirectory, { recursive: true });

const page = await fetch(`${endpoint}/json/new?${encodeURIComponent(previewUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

async function waitForPhase(expected, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(`document.querySelector('.experience')?.dataset.journeyPhase` ) === expected) return;
    await wait(20);
  }
  throw new Error(`Timed out waiting for journey phase: ${expected}`);
}

async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await wait(180);
}

async function capture(name) {
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  await writeFile(path.join(outputDirectory, name), Buffer.from(result.data, "base64"));
}

async function layoutReport(label) {
  return evaluate(`(() => ({
    label: ${JSON.stringify(label)},
    width: innerWidth,
    height: innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    phase: document.querySelector('.experience')?.dataset.journeyPhase,
    doors: document.querySelector('.train-doors')?.dataset.doorState,
    destination: document.querySelector('.destination-display strong')?.textContent
  }))()`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await send("Page.navigate", { url: previewUrl });
await wait(1800);

const reports = [];
await setViewport(1920, 1080);
await capture("homepage-open-1920x1080.png");
reports.push(await layoutReport("homepage-1920x1080"));

for (const difficulty of ["Easy", "Medium", "Hard", "Extreme"]) {
  await evaluate(`[...document.querySelectorAll('.difficulty-selector button')].find((button) => button.textContent.includes(${JSON.stringify(difficulty)}))?.click()`);
  await wait(160);
  await capture(`difficulty-${difficulty.toLowerCase()}-1920x1080.png`);
}

async function captureJourneyPhase(phase, filename, label) {
  await send("Page.navigate", { url: previewUrl });
  await wait(900);
  await setViewport(1920, 1080);
  await evaluate(`document.querySelector('.board-button')?.click()`);
  await waitForPhase(phase);
  reports.push(await layoutReport(label));
  await capture(filename);
}

await captureJourneyPhase("doors_closing", "doors-closing-1920x1080.png", "doors-closing");
await captureJourneyPhase("accelerating", "doors-closed-1920x1080.png", "doors-closed");
await captureJourneyPhase("in_transit", "traveling-boston-1920x1080.png", "traveling");
await captureJourneyPhase("decelerating", "arriving-1920x1080.png", "arriving");

await send("Page.navigate", { url: previewUrl });
await wait(900);
await evaluate(`(() => {
  window.__oscillatorCount = 0;
  window.__journeyPhases = [];
  const experience = document.querySelector('.experience');
  new MutationObserver(() => window.__journeyPhases.push(experience.dataset.journeyPhase)).observe(experience, { attributes: true, attributeFilter: ['data-journey-phase'] });
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const original = AudioContextClass?.prototype.createOscillator;
  if (original) AudioContextClass.prototype.createOscillator = function (...args) {
    window.__oscillatorCount += 1;
    return original.apply(this, args);
  };
})()`);
await evaluate(`document.querySelector('.audio-toggle')?.click()`);
await wait(150);
await evaluate(`document.querySelector('.board-button')?.click(); document.querySelector('.board-button')?.click()`);
await waitForPhase("doors_closing");
await waitForPhase("idle");
reports.push({ ...(await layoutReport("arrived")), oscillatorCount: await evaluate(`window.__oscillatorCount`), observedPhases: await evaluate(`window.__journeyPhases`) });
await capture("turf-capture-arrived-1920x1080.png");

await send("Page.navigate", { url: previewUrl });
await wait(1200);
for (const [width, height] of [[1440, 900], [1366, 768]]) {
  await setViewport(width, height);
  await capture(`homepage-open-${width}x${height}.png`);
  reports.push(await layoutReport(`homepage-${width}x${height}`));
}

await writeFile(path.join(outputDirectory, "layout-report.json"), `${JSON.stringify(reports, null, 2)}\n`);
socket.close();
console.log(JSON.stringify(reports, null, 2));
