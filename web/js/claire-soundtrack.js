const videoId = "j8EGy8ivR98";

export function claireSoundtrackView() {
  return `<claire-soundtrack style="display: block; margin: 0 0 16px">
    <details>
      <summary class="btn" style="display: list-item; width: fit-content; cursor: pointer">Claire soundtrack</summary>
      <div style="padding: 12px 0; display: grid; gap: 10px; max-width: 480px">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px">
          <button class="btn" type="button" aria-expanded="false">Load Cosmic Descent</button>
          <a href="https://youtu.be/${videoId}" target="_blank" rel="noopener noreferrer">Open on YouTube</a>
        </div>
        <div data-player hidden></div>
        <label>Play an audio file from your device <input type="file" accept="audio/*,.mp3"></label>
        <audio controls hidden style="width: 100%" aria-label="Local Claire soundtrack"></audio>
      </div>
    </details>
  </claire-soundtrack>`;
}

class ClaireSoundtrack extends HTMLElement {
  fileUrl = null;

  connectedCallback() {
    const details = this.querySelector("details");
    const button = this.querySelector("button");
    const player = this.querySelector("[data-player]");
    const input = this.querySelector("input");
    const audio = this.querySelector("audio");

    const closePlayer = () => {
      player.replaceChildren();
      player.hidden = true;
      button.textContent = "Load Cosmic Descent";
      button.setAttribute("aria-expanded", "false");
    };

    details.ontoggle = () => {
      if (!details.open) {
        closePlayer();
        audio.pause();
      }
    };

    button.onclick = () => {
      if (!player.hidden) {
        closePlayer();
        return;
      }
      audio.pause();
      const frame = document.createElement("iframe");
      frame.title = "Cosmic Descent on YouTube";
      frame.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.style.cssText = "display:block;width:100%;min-height:200px;aspect-ratio:16/9;border:0";
      player.replaceChildren(frame);
      player.hidden = false;
      button.textContent = "Close YouTube player";
      button.setAttribute("aria-expanded", "true");
    };

    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      closePlayer();
      if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
      this.fileUrl = URL.createObjectURL(file);
      audio.src = this.fileUrl;
      audio.loop = true;
      audio.hidden = false;
    };
    audio.onplay = closePlayer;
  }

  disconnectedCallback() {
    this.querySelector("audio").pause();
    if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
    this.fileUrl = null;
  }
}

customElements.define("claire-soundtrack", ClaireSoundtrack);
