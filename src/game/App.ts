import { RendererEngine } from './renderer/Renderer';
import { CharacterController } from './character/CharacterController';
import { createGameStore } from './state/store';
import { HudVitals } from './ui/HudVitals';
import { EnvironmentPanel } from './ui/EnvironmentPanel';
import { EnvironmentManager } from './env/EnvironmentManager';
import { AgentBridge, AgentAPI } from './api/AgentBridge';

export class GameApp {
  private store = createGameStore();
  private renderer = new RendererEngine();
  private character = new CharacterController(this.renderer, this.store);
  private environment = new EnvironmentManager(this.store, this.renderer);
  private agentBridge = new AgentBridge(this.store, this.character, this.environment);

  async start() {
    await this.renderer.init('canvas-container');

    // Load default background from public/images/default_bg.png
    // Vite automatically handles public directory in both dev and prod
    await this.environment.setEnvironment('默认场景', '/images/default_bg.png');

    // Drag & drop VRM / FBX
    this.renderer.enableDragAndDrop(
      (url) => this.character.loadVRM(url),
      (url) => this.character.loadMixamoAnimation(url),
    );

    // UI overlays
    new HudVitals(this.store);
    new EnvironmentPanel(this.store);
  }

  getAgentApi(): AgentAPI {
    return this.agentBridge.getApi();
  }
}

