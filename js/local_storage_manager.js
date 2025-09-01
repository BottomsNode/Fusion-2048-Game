// Fallback storage if localStorage is not available
window.fakeStorage = {
  _data: {},

  setItem(key, value) {
    this._data[key] = String(value);
    return this._data[key];
  },

  getItem(key) {
    return this._data.hasOwnProperty(key) ? this._data[key] : undefined;
  },

  removeItem(key) {
    return delete this._data[key];
  },

  clear() {
    this._data = {};
    return this._data;
  }
};

class LocalStorageManager {
  constructor() {
    this.bestScoreKey = "bestScore";
    this.gameStateKey = "gameState";

    this.storage = this.isLocalStorageSupported()
      ? window.localStorage
      : window.fakeStorage;
  }

  // Check if localStorage is supported by the browser
  isLocalStorageSupported() {
    const testKey = "testKey";
    try {
      const storage = window.localStorage;
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // --- Best Score ---
  getBestScore() {
    return this.storage.getItem(this.bestScoreKey) || 0;
  }

  setBestScore(score) {
    this.storage.setItem(this.bestScoreKey, score);
  }

  // --- Game State ---
  getGameState() {
    const stateJSON = this.storage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
  }

  setGameState(gameState) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
  }

  clearGameState() {
    this.storage.removeItem(this.gameStateKey);
  }
}
