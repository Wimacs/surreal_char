import { GameStore } from '../state/store';

const STYLE_ID = 'dialog-overlay-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .dialog-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 26%;
      padding: 12px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.75) 100%);
      color: #e8ecf3;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      pointer-events: none;
      backdrop-filter: blur(8px);
    }
    .dialog-overlay__speaker {
      font-size: 14px;
      letter-spacing: 0.04em;
      color: #9abaff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    .dialog-overlay__text {
      font-size: 18px;
      line-height: 1.5;
      text-shadow: 0 1px 2px rgba(0,0,0,0.45);
    }
    .dialog-overlay__history {
      opacity: 0.7;
      font-size: 12px;
      line-height: 1.4;
      max-height: 48px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  document.head.appendChild(style);
}

export class DialogOverlay {
  private root: HTMLDivElement;
  private speakerEl: HTMLDivElement;
  private textEl: HTMLDivElement;
  private historyEl: HTMLDivElement;

  constructor(store: GameStore) {
    ensureStyle();
    this.root = document.createElement('div');
    this.root.className = 'dialog-overlay';

    this.speakerEl = document.createElement('div');
    this.speakerEl.className = 'dialog-overlay__speaker';

    this.textEl = document.createElement('div');
    this.textEl.className = 'dialog-overlay__text';

    this.historyEl = document.createElement('div');
    this.historyEl.className = 'dialog-overlay__history';

    this.root.appendChild(this.speakerEl);
    this.root.appendChild(this.textEl);
    this.root.appendChild(this.historyEl);

    document.body.appendChild(this.root);

    store.subscribe((state) => {
      const current = state.dialogue.current;
      this.speakerEl.textContent = current?.speaker ?? 'Narrator';
      this.textEl.textContent = current?.text ?? '...';
      const historyText = state.dialogue.history
        .slice(-3)
        .map((h) => `${h.speaker ?? 'Narrator'}：${h.text}`)
        .join('  /  ');
      this.historyEl.textContent = historyText;
    });
  }
}


