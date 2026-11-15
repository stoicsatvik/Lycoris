import { startMarsGlobe } from "./mars-globe.js?v=mission-1";

export function homeView() {
  return `<div class="mission-home">
    <section class="mission-hero" aria-labelledby="mission-title">
      <div class="mission-intro">
        <p class="mission-kicker">Jezero Crater / Mars <span>Active</span></p>
        <h1 id="mission-title">Now you go among the stars, <em>and I guide your journey.</em></h1>
        <p class="mission-lede">Explore the terrain. Compare your route.<br>Inspect every estimate.</p>
        <div class="mission-actions">
          <a class="mission-primary" href="#/map">Open mission map <span aria-hidden="true">↗</span></a>
          <a class="mission-secondary" href="#/journey">Preview helmet HUD <span aria-hidden="true">↗</span></a>
        </div>
        <dl class="mission-readouts" aria-label="Illustrative mission status">
          <div><dt>Landing site</dt><dd>Jezero</dd></div>
          <div><dt>Mission sol</dt><dd>0412</dd></div>
          <div><dt>Signal delay</dt><dd>08:42</dd></div>
        </dl>
      </div>
      <section class="mission-scan" aria-label="Mars orbital scan">
        <div class="scan-viewport">
          <div class="scan-orbits" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="scan-planet">
            <canvas tabindex="0" aria-label="Mars globe. Drag or use the arrow keys to rotate." aria-describedby="scan-instructions" hidden></canvas>
            <div class="scan-marker" aria-hidden="true" hidden><span>Jezero Crater<small>18.38°N / 77.58°E</small></span></div>
          </div>
        </div>
        <div class="scan-readout" aria-hidden="true">Orbital scan <strong>97.4%</strong></div>
        <div class="scan-scale" aria-hidden="true">0 ─── 500 ─── 1,000 km</div>
        <p class="scan-instructions" id="scan-instructions" hidden>Drag to rotate · Arrow keys</p>
        <div class="scan-controls" role="group" aria-label="Mars scan controls">
          <button type="button" data-scan="in" aria-label="Zoom in">+</button>
          <button type="button" data-scan="out" aria-label="Zoom out" disabled>−</button>
          <button type="button" data-scan="tilt" aria-label="Tilt orbital view" aria-pressed="false">3D</button>
        </div>
      </section>
    </section>
    <footer class="mission-footer">
      <span>Space Apps 2026 · Interface concept</span>
      <button type="button" data-scan="motion" aria-pressed="true">Motion on <span aria-hidden="true">Ⅱ</span></button>
    </footer>
  </div>`;
}

export function startHome(root) {
  const home = root.querySelector(".mission-home");
  const scan = home.querySelector(".mission-scan");
  const motion = home.querySelector('[data-scan="motion"]');
  const zoomIn = scan.querySelector('[data-scan="in"]');
  const zoomOut = scan.querySelector('[data-scan="out"]');
  const tilt = scan.querySelector('[data-scan="tilt"]');
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const stopGlobe = startMarsGlobe(scan);
  let zoom = 1;
  function setMotion(enabled) {
    scan.classList.toggle("scan-animated", enabled);
    motion.setAttribute("aria-pressed", String(enabled));
    motion.innerHTML = enabled ? 'Motion on <span aria-hidden="true">Ⅱ</span>' : 'Motion off <span aria-hidden="true">▶</span>';
  }
  const onPreference = () => setMotion(!preference.matches);
  onPreference();
  preference.addEventListener("change", onPreference);
  function onClick(event) {
    const button = event.target.closest("[data-scan]");
    if (!button) return;
    switch (button.dataset.scan) {
      case "motion": setMotion(!scan.classList.contains("scan-animated")); break;
      case "tilt": button.setAttribute("aria-pressed", String(scan.classList.toggle("scan-tilted"))); break;
      default:
        zoom += button === zoomIn ? 1 : -1;
        scan.style.setProperty("--scan-zoom", 1 + (zoom - 1) * .15);
        zoomIn.disabled = zoom === 3;
        zoomOut.disabled = zoom === 1;
    }
  }
  home.addEventListener("click", onClick);
  return () => {
    stopGlobe();
    preference.removeEventListener("change", onPreference);
    home.removeEventListener("click", onClick);
  };
}
