import { CharacterController } from '../character/CharacterController';
import { EnvironmentManager } from '../env/EnvironmentManager';
import { GameStore, DialogueEntry, Vitals } from '../state/store';

export type AgentAPI = ReturnType<AgentBridge['getApi']>;

export class AgentBridge {
  constructor(
    private store: GameStore,
    private character: CharacterController,
    private environment: EnvironmentManager,
  ) {}

  getApi() {
    return {
      speak: (entry: Omit<DialogueEntry, 'timestamp'>) =>
        this.speak({ ...entry, timestamp: Date.now() }),
      setMood: (mood: string) => this.setMood(mood),
      updateVitals: (vitals: Partial<Vitals>) => this.updateVitals(vitals),
      playMotion: (url: string, motionName?: string) => this.character.loadMixamoAnimation(url, motionName),
      setExpression: (name: string, value?: number) => this.character.setExpression(name, value ?? 1),
      loadVRM: (url: string) => this.character.loadVRM(url),
      setEnvironment: (description?: string, bgUrl?: string) => this.environment.setEnvironment(description, bgUrl),
    };
  }

  private speak(entry: DialogueEntry) {
    this.store.updateDialogue(entry);
  }

  private setMood(mood: string) {
    this.store.setState({ emotion: { mood } });
  }

  private updateVitals(vitals: Partial<Vitals>) {
    this.store.setState({ emotion: { vitals } });
  }
}



