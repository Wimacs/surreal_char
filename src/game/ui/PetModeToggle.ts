import type { GameStore, GameState } from '../state/store';
import { RendererEngine } from '../renderer/Renderer';

const STYLE_ID = 'pet-mode-toggle-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    body.pet-mode {
      background: transparent;
    }

    body.pet-mode #canvas-container {
      background: transparent;
    }

    body.pet-mode .phone-shell,
    body.pet-mode .dialog-overlay,
    body.pet-mode .env-panel,
    body.pet-mode .hud-vitals,
    body.pet-mode #drop-hint {
      opacity: 0;
      pointer-events: none;
    }

    .pet-mode-toggle {
      position: absolute;
      top: 16px;
      right: 200px;
      padding: 8px 12px;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 12px;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      cursor: pointer;
      z-index: 400;
      pointer-events: auto;
      transition: background 0.2s ease, transform 0.2s ease;
      -webkit-app-region: no-drag;
    }

    .pet-mode-toggle:hover {
      background: rgba(0, 0, 0, 0.65);
      transform: translateY(-1px);
    }

    .pet-mode-toggle.active {
      background: rgba(76, 175, 80, 0.8);
      border-color: rgba(255, 255, 255, 0.24);
    }

    .pet-mode-drag {
      position: absolute;
      top: 8px;
      left: 12px;
      width: 160px;
      height: 32px;
      -webkit-app-region: drag;
      pointer-events: none;
      border-radius: 12px;
      background: transparent;
      z-index: 350;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    body.pet-mode .pet-mode-drag {
      opacity: 0.2;
      pointer-events: auto;
    }

    .desktop-titlebar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 32px;
      background: #101014;
      color: #fff;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      -webkit-app-region: drag;
      z-index: 390;
      pointer-events: auto;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
      transition: opacity 0.2s ease;
    }

    body.pet-mode .desktop-titlebar {
      opacity: 0;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

export class PetModeToggle {
  private root: HTMLButtonElement;
  private dragArea: HTMLDivElement;
  private desktopTitleBar: HTMLDivElement;
  private enabled = false;

  constructor(private store: GameStore, private renderer: RendererEngine) {
    ensureStyle();

    this.root = document.createElement('button');
    this.root.className = 'pet-mode-toggle';
    this.root.textContent = '桌宠模式';
    this.root.addEventListener('click', () => this.toggle());

    this.dragArea = document.createElement('div');
    this.dragArea.className = 'pet-mode-drag';

    this.desktopTitleBar = document.createElement('div');
    this.desktopTitleBar.className = 'desktop-titlebar';
    this.desktopTitleBar.textContent = 'Surreal';

    document.body.appendChild(this.desktopTitleBar);
    document.body.appendChild(this.dragArea);
    document.body.appendChild(this.root);

    this.store.subscribe((state: GameState) => {
      const next = state.ui.petMode;
      if (next !== this.enabled) {
        this.enabled = next;
        this.renderer.setPetMode(next);
        this.sync();
      } else {
        this.sync();
      }
    });
  }

  private toggle() {
    const next = !this.enabled;
    this.store.setState({ ui: { petMode: next } });
    const api = (window as any).electronAPI;
    if (api?.setPetMode) {
      api.setPetMode(next);
    }
  }

  private sync() {
    this.root.classList.toggle('active', this.enabled);
    this.root.textContent = this.enabled ? '退出桌宠' : '桌宠模式';
    document.body.classList.toggle('pet-mode', this.enabled);
  }
}

