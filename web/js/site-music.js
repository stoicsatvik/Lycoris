const audio = document.querySelector("#lycoris-bgm");
const button = document.querySelector("#lycoris-music");
const text = button.querySelector("span");
const status = document.querySelector("#lycoris-music-status");
const view = document.querySelector("#view");
const setting = "lycoris-background-music";
const tracks = { main: "/audio/lycoris-bgm.mp3", claire: "/audio/claire-dread.mp3", noGo: "/audio/mahabre-streets.mp3" };
const loopStart = { claire: 2.1, noGo: 1.44 };
let track = "main";
let mainTime = 0;
let alternatePlaying = false;
let enabled = true;
try { enabled = localStorage.getItem(setting) !== "off"; } catch {}

function sync() {
  button.setAttribute("aria-pressed", String(enabled));
  text.textContent = enabled ? "Music on" : "Music off";
}

async function startMusic() {
  status.textContent = "";
  if (!enabled || alternatePlaying) return;
  try {
    audio.volume = view.dataset.warning === "caution" ? .18 : track === "main" ? .32 : .42;
    await audio.play();
  } catch (error) {
    if (!enabled || !audio.paused || error.name === "AbortError") return;
    if (error.name !== "NotAllowedError") status.textContent = "Couldn’t play the music. Try again.";
  }
}

function stopMusic() {
  enabled = false;
  audio.pause();
  status.textContent = "";
  sync();
}

function switchTrack() {
  const warning = view.dataset.warning;
  const nextTrack = warning === "no-go" ? "noGo" : view.dataset.screen === "claire" || warning ? "claire" : "main";
  if (nextTrack === track) return;
  if (track === "main") mainTime = audio.currentTime;
  track = nextTrack;
  alternatePlaying = false;
  audio.src = tracks[track];
  audio.loop = track === "main";
  if (track === "main") audio.currentTime = mainTime;
  startMusic();
}

button.addEventListener("click", () => {
  if (enabled) stopMusic();
  else {
    enabled = true;
    alternatePlaying = false;
    sync();
    startMusic();
  }
  try { localStorage.setItem(setting, enabled ? "on" : "off"); } catch {}
});

function startOnInteraction(event) {
  if (!event.isTrusted || !enabled || alternatePlaying || !audio.paused || event.target.closest?.("#lycoris-music, claire-soundtrack")) return;
  if (event.type === "keydown" && (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.key === "Escape")) return;
  startMusic();
}
document.addEventListener("click", startOnInteraction, true);
document.addEventListener("keydown", startOnInteraction, true);
function pauseForAlternate() {
  alternatePlaying = true;
  audio.pause();
}
document.addEventListener("claire-soundtrack-start", pauseForAlternate);
document.addEventListener("play", event => {
  if (event.target !== audio && event.target.closest?.("claire-soundtrack")) pauseForAlternate();
}, true);
audio.addEventListener("ended", () => {
  if (loopStart[track] === undefined) return;
  audio.currentTime = loopStart[track];
  startMusic();
});
new MutationObserver(switchTrack).observe(view, { attributes: true, attributeFilter: ["data-screen", "data-warning"] });
sync();
if (view.dataset.screen === "claire" || view.dataset.warning) switchTrack();
else startMusic();
