import { GameStore } from '../state/store';

const STYLE_ID = 'hud-vitals-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .hud-vitals {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      pointer-events: none;
      z-index: 100;
      color: white;
    }
    
    .hud-vitals__row {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 40px;
    }

    .hud-vitals__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }

    .hud-vitals__heart-icon {
      color: #ff4d4d;
      filter: drop-shadow(0 0 8px rgba(255, 77, 77, 0.6));
    }

    .hud-vitals__value {
      font-size: 18px;
      font-weight: 600;
      min-width: 40px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .hud-vitals__ecg {
      width: 120px;
      height: 40px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(2px);
    }
    
    @keyframes heartbeat {
      0% { transform: scale(1); }
      15% { transform: scale(1.25); }
      30% { transform: scale(1); }
      45% { transform: scale(1.15); }
      60% { transform: scale(1); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

// Simple SVGs
const HEART_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

export class HudVitals {
  private root: HTMLDivElement;
  
  // Heart elements
  private heartIcon: HTMLDivElement;
  private heartRateValue: HTMLSpanElement;
  private ecgCanvas: HTMLCanvasElement;
  private ecgCtx: CanvasRenderingContext2D | null;
  
  // Animation state
  private ecgData: number[] = [];
  private ecgStartTime = 0; // Use absolute time instead of phase for better sync
  private heartRate = 120; // Default: 120 bpm with ±5 variation
  private heartRateVariation = 0; // For natural fluctuation
  private hasExternalHeartRate = false; // Track if heart rate is set externally
  private lastHeartRate = 120; // Track previous heart rate to detect changes

  constructor(store: GameStore) {
    ensureStyle();
    this.root = document.createElement('div');
    this.root.className = 'hud-vitals';

    // 1. Heart Rate Row
    const hrRow = document.createElement('div');
    hrRow.className = 'hud-vitals__row';
    
    this.heartIcon = document.createElement('div');
    this.heartIcon.className = 'hud-vitals__icon hud-vitals__heart-icon';
    this.heartIcon.innerHTML = HEART_SVG;
    
    this.ecgCanvas = document.createElement('canvas');
    this.ecgCanvas.className = 'hud-vitals__ecg';
    this.ecgCanvas.width = 120;
    this.ecgCanvas.height = 40;
    this.ecgCtx = this.ecgCanvas.getContext('2d');

    this.heartRateValue = document.createElement('span');
    this.heartRateValue.className = 'hud-vitals__value';
    this.heartRateValue.textContent = '120';

    hrRow.append(this.heartIcon, this.ecgCanvas, this.heartRateValue);

    this.root.append(hrRow);
    
    // Try to append to window drag base if it exists, otherwise append to body
    const dragBaseContent = document.querySelector('.window-drag-base__content');
    if (dragBaseContent) {
      dragBaseContent.appendChild(this.root);
    } else {
      document.body.appendChild(this.root);
    }

    // Init ECG data
    this.ecgData = new Array(this.ecgCanvas.width).fill(this.ecgCanvas.height / 2);
    
    // Initialize ECG start time
    this.ecgStartTime = performance.now() / 1000;

    // Start Animation
    requestAnimationFrame(this.animate.bind(this));

    // Subscribe to store
    store.subscribe((state) => {
      const { vitals } = state.emotion;
      
      // Update Heart Rate
      // If no heart rate provided, use 120 with ±5 variation
      if (vitals.heartRate !== undefined) {
        this.heartRate = vitals.heartRate;
        this.hasExternalHeartRate = true;
      } else {
        this.hasExternalHeartRate = false;
        // Will be updated in animate() for smooth continuous variation
      }
      
      this.updateHeartRateDisplay();
    });
  }

  private updateHeartRateDisplay() {
    // If no external heart rate, apply natural fluctuation around 120: 115-125 range
    if (!this.hasExternalHeartRate) {
      // Use sine wave for smooth variation
      const variationTime = Date.now() / 3000; // 3 second cycle
      this.heartRateVariation = Math.sin(variationTime) * 5; // ±5 bpm
      this.heartRate = 120 + this.heartRateVariation;
    }
    
    const displayRate = Math.round(this.heartRate);
    this.heartRateValue.textContent = `${displayRate}`;
    
    // Update Animation Speed
    // Standard beat is approx 60bpm = 1 beat per sec.
    // Animation duration = 60 / bpm
    const duration = 60 / Math.max(this.heartRate, 40); // clamp min 40
    (this.heartIcon.firstElementChild as HTMLElement).style.animation = `heartbeat ${duration}s infinite`;
  }

  private animate(time: number) {
    requestAnimationFrame(this.animate.bind(this));
    
    const currentTime = time / 1000; // Convert to seconds
    
    // Update heart rate display continuously for natural fluctuation
    this.updateHeartRateDisplay();
    
    // Reset ECG phase if heart rate changed significantly
    if (Math.abs(this.heartRate - this.lastHeartRate) > 0.5) {
      // Adjust start time to maintain continuity when heart rate changes
      const currentPhase = (currentTime - this.ecgStartTime) % (60 / Math.max(this.lastHeartRate, 1));
      this.ecgStartTime = currentTime - currentPhase;
      this.lastHeartRate = this.heartRate;
    }

    // Simulate ECG wave based on heart rate
    // One beat logic: P-QRS-T complex
    
    // Generate new data point using absolute time for better sync
    const beatDuration = 60 / Math.max(this.heartRate, 1);
    const elapsed = currentTime - this.ecgStartTime;
    const t = (elapsed % beatDuration) / beatDuration; // 0..1 progress within a beat
    
    // Simple synthetic ECG shape
    let y = 0.5; // baseline center (0..1)
    
    // P wave (0.10 - 0.20) - Small upward hump
    if (t >= 0.1 && t < 0.2) {
      y -= 0.08 * Math.sin((t - 0.1) * 10 * Math.PI);
    }
    // QRS Complex (0.30 - 0.40)
    else if (t >= 0.3 && t < 0.4) {
        if (t < 0.32) { // Q: small down
            y += 0.05 * Math.sin((t - 0.3) / 0.02 * Math.PI); 
        } else if (t < 0.35) { // R: sharp up
            y -= 0.4 * Math.sin((t - 0.32) / 0.03 * Math.PI);
        } else { // S: sharp down
             y += 0.15 * Math.sin((t - 0.35) / 0.05 * Math.PI);
        }
    }
    // T wave (0.50 - 0.70) - Broader upward hump
    else if (t >= 0.5 && t < 0.7) {
      y -= 0.12 * Math.sin((t - 0.5) * 5 * Math.PI);
    }

    // Add noise
    y += (Math.random() - 0.5) * 0.02;

    const canvasH = this.ecgCanvas.height;
    const newVal = y * canvasH;

    // Shift array
    this.ecgData.splice(0, 1);
    this.ecgData.push(newVal);

    // Draw
    if (this.ecgCtx) {
      this.ecgCtx.clearRect(0, 0, this.ecgCanvas.width, this.ecgCanvas.height);
      
      // Draw Grid
      this.ecgCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ecgCtx.lineWidth = 1;
      this.ecgCtx.beginPath();
      // Horizontal lines
      for(let i=0; i<this.ecgCanvas.height; i+=10) {
          this.ecgCtx.moveTo(0, i);
          this.ecgCtx.lineTo(this.ecgCanvas.width, i);
      }
      // Vertical lines
      for(let i=0; i<this.ecgCanvas.width; i+=20) {
          this.ecgCtx.moveTo(i, 0);
          this.ecgCtx.lineTo(i, this.ecgCanvas.height);
      }
      this.ecgCtx.stroke();

      // Draw Wave
      this.ecgCtx.beginPath();
      this.ecgCtx.strokeStyle = '#5ce1e6'; // Cyan color
      this.ecgCtx.lineWidth = 2;
      this.ecgCtx.lineCap = 'round';
      this.ecgCtx.lineJoin = 'round';

      for (let i = 0; i < this.ecgData.length; i++) {
        const x = i;
        const yVal = this.ecgData[i];
        if (i === 0) this.ecgCtx.moveTo(x, yVal);
        else this.ecgCtx.lineTo(x, yVal);
      }
      this.ecgCtx.stroke();
      
      // Draw "head" dot
      const lastX = this.ecgData.length - 1;
      const lastY = this.ecgData[lastX];
      this.ecgCtx.beginPath();
      this.ecgCtx.fillStyle = '#fff';
      this.ecgCtx.arc(lastX, lastY, 2, 0, Math.PI * 2);
      this.ecgCtx.fill();
    }
  }
}
