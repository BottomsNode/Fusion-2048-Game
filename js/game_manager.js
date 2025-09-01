class GameManager {
  constructor(size, InputManager, Actuator, StorageManager) {
    this.size = size; // Size of the grid (e.g., 4x4)

    // Dependency injection
    this.inputManager = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator = new Actuator();

    this.startTiles = 2; // default number of tiles to add on game start

    // Event bindings
    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

    this.setup();
  }

  // Restart the game
  restart() {
    this.storageManager.clearGameState();
    this.actuator.continueGame();
    this.setup();
  }

  // Continue after winning (lets player go past 2048)
  keepPlaying() {
    this.keepPlaying = true;
    this.actuator.continueGame();
  }

  // True if game ended
  isGameTerminated() {
    return this.over || (this.won && !this.keepPlaying);
  }

  // Initialize a new game
  setup() {
    const previousState = this.storageManager.getGameState();

    if (previousState) {
      // Restore previous game
      this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
      this.score = previousState.score;
      this.over = previousState.over;
      this.won = previousState.won;
      this.keepPlaying = previousState.keepPlaying;
    } else {
      // Start new game
      this.grid = new Grid(this.size);
      this.score = 0;
      this.over = false;
      this.won = false;
      this.keepPlaying = false;

      this.addStartTiles();
    }

    this.actuate();
  }

  // Place initial tiles
  addStartTiles() {
    for (let i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  }

  // Add a random 2 or 4 tile
  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      const value = Math.random() < 0.9 ? 2 : 4;
      const cell = this.grid.randomAvailableCell();
      const tile = new Tile(cell, value);
      this.grid.insertTile(tile);
    }
  }

  // Update visuals + persist state
  actuate() {
    if (this.storageManager.getBestScore() < this.score) {
      this.storageManager.setBestScore(this.score);
    }

    if (this.over) {
      this.storageManager.clearGameState();
    } else {
      this.storageManager.setGameState(this.serialize());
    }

    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won,
      bestScore: this.storageManager.getBestScore(),
      terminated: this.isGameTerminated(),
    });
  }

  // Save game state
  serialize() {
    return {
      grid: this.grid.serialize(),
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying,
    };
  }

  // Reset tile metadata
  prepareTiles() {
    this.grid.eachCell((x, y, tile) => {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  // Move a tile to a cell
  moveTile(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  // Execute a move
  move(direction) {
    if (this.isGameTerminated()) return;

    const vector = this.getVector(direction);
    const traversals = this.buildTraversals(vector);
    let moved = false;

    this.prepareTiles();

    traversals.x.forEach(x => {
      traversals.y.forEach(y => {
        const cell = { x, y };
        const tile = this.grid.cellContent(cell);

        if (tile) {
          const positions = this.findFarthestPosition(cell, vector);
          const next = this.grid.cellContent(positions.next);

          if (next && next.value === tile.value && !next.mergedFrom) {
            // Merge tiles
            const merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            this.grid.insertTile(merged);
            this.grid.removeTile(tile);

            tile.updatePosition(positions.next);

            this.score += merged.value;
            if (merged.value === 2048) this.won = true;
          } else {
            this.moveTile(tile, positions.farthest);
          }

          if (!this.positionsEqual(cell, tile)) {
            moved = true;
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();

      if (!this.movesAvailable()) {
        this.over = true;
      }

      this.actuate();
    }
  }

  // Get movement vector
  getVector(direction) {
    const map = {
      0: { x: 0, y: -1 }, // Up
      1: { x: 1, y: 0 },  // Right
      2: { x: 0, y: 1 },  // Down
      3: { x: -1, y: 0 }, // Left
    };
    return map[direction];
  }

  // Build list of positions to traverse in correct order
  buildTraversals(vector) {
    const traversals = { x: [], y: [] };

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    // Reverse order for right & down
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();

    return traversals;
  }

  // Find farthest empty position along a vector
  findFarthestPosition(cell, vector) {
    let previous;

    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

    return {
      farthest: previous,
      next: cell,
    };
  }

  // Check if moves left
  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }

  // Check if adjacent tiles can merge
  tileMatchesAvailable() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.grid.cellContent({ x, y });

        if (tile) {
          for (let direction = 0; direction < 4; direction++) {
            const vector = this.getVector(direction);
            const cell = { x: x + vector.x, y: y + vector.y };
            const other = this.grid.cellContent(cell);

            if (other && other.value === tile.value) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // Position equality check
  positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y;
  }
}
