import { GameStore } from '../state/store';

const STYLE_ID = 'environment-panel-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .env-panel {
      position: absolute;
      bottom: 20px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      pointer-events: none;
      z-index: 100;
      color: white;
    }

    /* Clock Module */
    .env-clock {
      height: auto;
      background: none;
    }
    
    .env-clock__time {
      font-size: 48px;
      font-weight: 200;
      letter-spacing: -1px;
      line-height: 1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    .env-clock__date {
      font-size: 13px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
      font-weight: 300;
    }
  `;
  document.head.appendChild(style);
}


export class EnvironmentPanel {
  private root: HTMLDivElement;

  constructor(store: GameStore) {
    ensureStyle();
    this.root = document.createElement('div');
    this.root.className = 'env-panel';

    // Empty panel - time/date UI removed
    document.body.appendChild(this.root);
  }
}
