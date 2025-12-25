const STYLE_ID = 'window-drag-button-style';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .window-drag-base {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
      background: rgba(0, 0, 0, 0.35);
      cursor: grab;
      z-index: 101;
      pointer-events: auto;
      transition: background 0.3s ease, opacity 0.3s ease;
      -webkit-app-region: drag;
      user-select: none;
      display: flex;
      align-items: center;
      padding: 0 20px;
    }

    .window-drag-base:active {
      cursor: grabbing;
    }

    body:hover .window-drag-base {
      background: rgba(0, 0, 0, 0.55);
    }

    .window-drag-base__content {
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: none;
      -webkit-app-region: drag;
      flex: 1;
    }

    .window-drag-base__buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      -webkit-app-region: no-drag;
      pointer-events: auto;
    }

    .window-drag-base__button {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s ease;
      user-select: none;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    }

    .window-drag-base__button:hover {
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 
        0 3px 6px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }

    .window-drag-base__button:active {
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 
        0 1px 2px rgba(0, 0, 0, 0.2),
        inset 0 2px 4px rgba(0, 0, 0, 0.2);
      transform: translateY(0);
    }

    .window-drag-base__button svg {
      width: 20px;
      height: 20px;
      fill: rgba(255, 255, 255, 0.9);
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .window-drag-base__button--power svg {
      fill: rgba(255, 100, 100, 0.9);
    }

    /* Window resize handles for Windows - 边缘可调整大小区域 */
    .window-resize-handle {
      position: fixed;
      background: transparent;
      z-index: 10000;
      pointer-events: auto;
      -webkit-app-region: no-drag;
      /* 不设置 -webkit-app-region，让系统默认处理 resize */
    }

    .window-resize-handle-top {
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      cursor: ns-resize;
    }

    .window-resize-handle-bottom {
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      cursor: ns-resize;
    }

    .window-resize-handle-left {
      top: 0;
      left: 0;
      bottom: 0;
      width: 8px;
      cursor: ew-resize;
    }

    .window-resize-handle-right {
      top: 0;
      right: 0;
      bottom: 0;
      width: 8px;
      cursor: ew-resize;
    }

    .window-resize-handle-top-left {
      top: 0;
      left: 0;
      width: 8px;
      height: 8px;
      cursor: nwse-resize;
    }

    .window-resize-handle-top-right {
      top: 0;
      right: 0;
      width: 8px;
      height: 8px;
      cursor: nesw-resize;
    }

    .window-resize-handle-bottom-left {
      bottom: 0;
      left: 0;
      width: 8px;
      height: 8px;
      cursor: nesw-resize;
    }

    .window-resize-handle-bottom-right {
      bottom: 0;
      right: 0;
      width: 8px;
      height: 8px;
      cursor: nwse-resize;
    }
  `;
  document.head.appendChild(style);
}

// Settings icon SVG
const SETTINGS_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
</svg>`;

// Power icon SVG
const POWER_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M13,3h-2v10h2V3z M17.83,5.17l-1.42,1.42C18.99,7.86,19.5,9.93,19.5,12c0,4.14-3.36,7.5-7.5,7.5S4.5,16.14,4.5,12 c0-2.07,0.51-4.14,1.09-5.41L4.17,5.17C3.24,6.79,2.5,9.14,2.5,12c0,5.24,4.26,9.5,9.5,9.5S21.5,17.24,21.5,12 C21.5,9.14,20.76,6.79,17.83,5.17z"/>
</svg>`;

// Pin icon SVG
const PIN_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
</svg>`;

// Lock icon SVG
const LOCK_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M18,8H17V6A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8,6A3,3 0 0,1 14,6V8H10V6H9V8H8V6M16,18H8V16H16V18Z"/>
</svg>`;

export class WindowDragButton {
  private root: HTMLDivElement;
  private content: HTMLDivElement;
  private buttons: HTMLDivElement;

  constructor() {
    ensureStyle();

    this.root = document.createElement('div');
    this.root.className = 'window-drag-base';

    this.content = document.createElement('div');
    this.content.className = 'window-drag-base__content';

    this.buttons = document.createElement('div');
    this.buttons.className = 'window-drag-base__buttons';

    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'window-drag-base__button';
    settingsButton.innerHTML = SETTINGS_SVG;
    settingsButton.setAttribute('title', '设置');
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // No logic, just visual feedback
    });

    // Power button
    const powerButton = document.createElement('button');
    powerButton.className = 'window-drag-base__button window-drag-base__button--power';
    powerButton.innerHTML = POWER_SVG;
    powerButton.setAttribute('title', '开关机');
    powerButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // No logic, just visual feedback
    });

    // Pin button
    const pinButton = document.createElement('button');
    pinButton.className = 'window-drag-base__button';
    pinButton.innerHTML = PIN_SVG;
    pinButton.setAttribute('title', '置顶');
    pinButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // No logic, just visual feedback
    });

    // Lock button
    const lockButton = document.createElement('button');
    lockButton.className = 'window-drag-base__button';
    lockButton.innerHTML = LOCK_SVG;
    lockButton.setAttribute('title', '锁定');
    lockButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // No logic, just visual feedback
    });

    this.buttons.appendChild(settingsButton);
    this.buttons.appendChild(pinButton);
    this.buttons.appendChild(lockButton);
    this.buttons.appendChild(powerButton);

    this.root.appendChild(this.content);
    this.root.appendChild(this.buttons);
    document.body.appendChild(this.root);

    // 创建窗口边缘的可调整大小区域（Windows 需要）
    this.createResizeHandles();
  }

  private createResizeHandles(): void {
    // 只在 Windows 上创建边缘调整大小区域
    const isWindows = navigator.platform.toLowerCase().includes('win');
    if (!isWindows) return;

    const api = (window as any).electronAPI;
    if (!api || !api.startResize) {
      console.warn('Electron API not available for resize');
      return;
    }

    const handles = [
      { className: 'window-resize-handle window-resize-handle-top', edge: 'top' },
      { className: 'window-resize-handle window-resize-handle-bottom', edge: 'bottom' },
      { className: 'window-resize-handle window-resize-handle-left', edge: 'left' },
      { className: 'window-resize-handle window-resize-handle-right', edge: 'right' },
      { className: 'window-resize-handle window-resize-handle-top-left', edge: 'top-left' },
      { className: 'window-resize-handle window-resize-handle-top-right', edge: 'top-right' },
      { className: 'window-resize-handle window-resize-handle-bottom-left', edge: 'bottom-left' },
      { className: 'window-resize-handle window-resize-handle-bottom-right', edge: 'bottom-right' },
    ];

    let isResizing = false;
    let currentEdge = '';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      api.doResize(currentEdge, e.screenX, e.screenY);
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      isResizing = false;
      api.stopResize();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    handles.forEach(({ className, edge }) => {
      const handle = document.createElement('div');
      handle.className = className;
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        currentEdge = edge;
        api.startResize(edge, e.screenX, e.screenY);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });
      document.body.appendChild(handle);
    });
  }

  getContentContainer(): HTMLDivElement {
    return this.content;
  }
}

