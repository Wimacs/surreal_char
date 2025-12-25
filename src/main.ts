import { GameApp } from './game/App';

const app = new GameApp();

const init = async () => {
  try {
    await app.start();
    console.log('Game layer ready');
  } catch (error) {
    console.error('Failed to initialize game', error);
  }
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose agent-facing API to Electron/LLM bridge
(window as any).agentApi = app.getAgentApi();

