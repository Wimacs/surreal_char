import { RendererEngine } from '../renderer/Renderer';
import { GameStore } from '../state/store';

export type BackgroundGenerator = (description: string) => Promise<string>;

export class EnvironmentManager {
  constructor(
    private store: GameStore,
    private renderer: RendererEngine,
    private generateBackground?: BackgroundGenerator,
  ) {}

  async setEnvironment(description?: string, bgUrl?: string) {
    let resolvedUrl = bgUrl;
    if (!resolvedUrl && description && this.generateBackground) {
      try {
        resolvedUrl = await this.generateBackground(description);
      } catch (err) {
        console.warn('Background generation failed, keeping previous background', err);
      }
    }
    if (resolvedUrl) {
      this.renderer.setBackground(resolvedUrl);
    } else {
      this.renderer.setBackground(undefined);
    }
    this.store.setState({ environment: { description, bgUrl: resolvedUrl } });
  }
}



