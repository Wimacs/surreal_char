import { RendererEngine } from './renderer/Renderer';
import { CharacterController } from './character/CharacterController';
import { createGameStore } from './state/store';
import { HudVitals } from './ui/HudVitals';
import { EnvironmentPanel } from './ui/EnvironmentPanel';
import { EnvironmentManager } from './env/EnvironmentManager';
import { AgentBridge, AgentAPI } from './api/AgentBridge';
import { WindowDragButton } from './ui/WindowDragButton';

const PET_MODE_STYLE_ID = 'pet-mode-global-style';

function ensurePetModeStyle() {
  if (document.getElementById(PET_MODE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PET_MODE_STYLE_ID;
  style.textContent = `
    body.pet-mode {
      background: transparent;
    }

    body.pet-mode #canvas-container {
      background: transparent;
    }
    
    /* Keep UI visible in pet mode */
    body.pet-mode .env-panel,
    body.pet-mode .hud-vitals {
      opacity: 1;
      pointer-events: none;
    }

    /* Hover background overlay */
    .window-hover-bg {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(16, 16, 20, 0.85);
      border-radius: 16px;
      pointer-events: none;
      opacity: 0.25;
      transition: opacity 0.3s ease;
      z-index: 1;
    }

    body:hover .window-hover-bg {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

function createHoverBackground() {
  const bg = document.createElement('div');
  bg.className = 'window-hover-bg';
  document.body.appendChild(bg);

  const container = document.getElementById('canvas-container');
  if (!container) return;

  container.addEventListener('mouseenter', () => {
    bg.style.opacity = '1';
  });

  container.addEventListener('mouseleave', () => {
    bg.style.opacity = '0.25';
  });
}

export class GameApp {
  private store = createGameStore();
  private renderer = new RendererEngine();
  private character = new CharacterController(this.renderer, this.store);
  private environment = new EnvironmentManager(this.store, this.renderer);
  private agentBridge = new AgentBridge(this.store, this.character, this.environment);

  async start() {
    await this.renderer.init('canvas-container');

    // Don't load background in pet mode (transparent)
    // await this.environment.setEnvironment('默认场景', '/images/default_bg.png');

    // Drag & drop VRM / FBX
    this.renderer.enableDragAndDrop(
      (url) => this.character.loadVRM(url),
      (url) => this.character.loadMixamoAnimation(url),
    );

    // Enable pet mode by default (always on)
    ensurePetModeStyle();
    this.store.setState({ ui: { petMode: true } });
    this.renderer.setPetMode(true);
    document.body.classList.add('pet-mode');
    const api = (window as any).electronAPI;
    if (api?.setPetMode) {
      api.setPetMode(true);
    }

    // Create hover background after container is ready
    createHoverBackground();

    // UI overlays - create drag base first so vitals can be embedded in it
    new WindowDragButton();
    new HudVitals(this.store);
    new EnvironmentPanel(this.store);

  }

  getAgentApi(): AgentAPI {
    return this.agentBridge.getApi();
  }
}

