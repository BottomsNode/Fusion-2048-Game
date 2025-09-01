class KeyboardInputManager {
  constructor() {
    this.events = {};
    this.touchStartEvent = "touchstart";
    this.touchMoveEvent = "touchmove";
    this.touchEndEvent = "touchend";

    this.listen();
  }

  // Register an event listener
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  // Emit a registered event
  emit(eventName, data) {
    const handlers = this.events[eventName];
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  listen() {
    const self = this;

    // Key code to direction mapping
    const keyToDirection = {
      38: 0, // Arrow Up
      39: 1, // Arrow Right
      40: 2, // Arrow Down
      37: 3, // Arrow Left
      87: 0, // W
      68: 1, // D
      83: 2, // S
      65: 3  // A
    };

    // Handle keyboard input
    document.addEventListener("keydown", (event) => {
      const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      const direction = keyToDirection[event.which];

      if (!hasModifier && direction !== undefined) {
        event.preventDefault();
        self.emit("move", direction);
      }

      // R = restart game
      if (!hasModifier && event.which === 82) {
        self.restart(event);
      }
    });

    // Handle UI button actions
    this.bindButtonPress(".retry-button", this.restart);
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".keep-playing-button", this.keepPlaying);

    // Handle swipe gestures
    let startX, startY;
    const gameBoard = document.querySelector(".game-container");

    gameBoard.addEventListener(this.touchStartEvent, (event) => {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches.length > 1) {
        return; // Ignore multi-finger touches
      }

      if (window.navigator.msPointerEnabled) {
        startX = event.pageX;
        startY = event.pageY;
      } else {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
      }

      event.preventDefault();
    });

    gameBoard.addEventListener(this.touchMoveEvent, (event) => {
      event.preventDefault();
    });

    gameBoard.addEventListener(this.touchEndEvent, (event) => {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches.length > 0) {
        return; // Ignore if still touching
      }

      let endX, endY;
      if (window.navigator.msPointerEnabled) {
        endX = event.pageX;
        endY = event.pageY;
      } else {
        endX = event.changedTouches[0].clientX;
        endY = event.changedTouches[0].clientY;
      }

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) > 10) {
        // Horizontal swipe vs Vertical swipe
        self.emit("move", absX > absY
          ? (deltaX > 0 ? 1 : 3) // Right or Left
          : (deltaY > 0 ? 2 : 0) // Down or Up
        );
      }
    });
  }

  restart(event) {
    event.preventDefault();
    this.emit("restart");
  }

  keepPlaying(event) {
    event.preventDefault();
    this.emit("keepPlaying");
  }

  bindButtonPress(selector, handler) {
    const button = document.querySelector(selector);
    button.addEventListener("click", handler.bind(this));
    button.addEventListener(this.touchEndEvent, handler.bind(this));
  }
}
