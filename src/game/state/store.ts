export type Vitals = {
  heartRate?: number;
  bloodPressure?: string;
  hrv?: number;
  stress?: number;
};

export type EmotionState = {
  mood?: string;
  vitals: Vitals;
};

export type DialogueEntry = {
  speaker?: string;
  text: string;
  timestamp: number;
};

export type DialogueState = {
  current?: DialogueEntry;
  history: DialogueEntry[];
};

export type EnvironmentState = {
  bgUrl?: string;
  description?: string;
};

export type CharacterState = {
  vrmUrl?: string;
  motionName?: string;
  expression?: { name: string; value?: number };
};

export type UIState = {
  petMode: boolean;
};

export type GameState = {
  character: CharacterState;
  dialogue: DialogueState;
  emotion: EmotionState;
  environment: EnvironmentState;
  ui: UIState;
};

type Listener = (state: GameState) => void;

const initialState: GameState = {
  character: {},
  dialogue: { history: [] },
  emotion: { mood: undefined, vitals: {} },
  environment: {},
  ui: { petMode: false },
};

export function createGameStore() {
  let state: GameState = { ...initialState };
  const listeners = new Set<Listener>();

  const getState = () => state;

  const setState = (partial: Partial<GameState>) => {
    state = {
      ...state,
      ...partial,
      character: { ...state.character, ...partial.character },
      dialogue: {
        ...state.dialogue,
        ...partial.dialogue,
        history: partial.dialogue?.history ?? state.dialogue.history,
      },
      emotion: {
        ...state.emotion,
        ...partial.emotion,
        vitals: { ...state.emotion.vitals, ...(partial.emotion?.vitals ?? {}) },
      },
      environment: { ...state.environment, ...partial.environment },
      ui: { ...state.ui, ...partial.ui },
    };
    listeners.forEach((cb) => cb(state));
  };

  const updateDialogue = (entry: DialogueEntry) => {
    const history = [...state.dialogue.history, entry].slice(-50);
    setState({ dialogue: { current: entry, history } });
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    // Send initial snapshot
    listener(state);
    return () => listeners.delete(listener);
  };

  return {
    getState,
    setState,
    subscribe,
    updateDialogue,
  };
}

export type GameStore = ReturnType<typeof createGameStore>;

export {};

