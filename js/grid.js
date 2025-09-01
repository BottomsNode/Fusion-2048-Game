class Grid {
  constructor(size, previousState = null) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
  }

  // Build a grid of the specified size
  empty() {
    return Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => null)
    );
  }

  fromState(state) {
    return state.map((row, x) =>
      row.map((tile, y) =>
        tile ? new Tile(tile.position, tile.value) : null
      )
    );
  }

  // Find the first available random position
  randomAvailableCell() {
    const cells = this.availableCells();
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
    return null;
  }

  availableCells() {
    const cells = [];
    this.eachCell((x, y, tile) => {
      if (!tile) cells.push({ x, y });
    });
    return cells;
  }

  // Call callback for every cell
  eachCell(callback) {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  }

  // Check if there are any cells available
  cellsAvailable() {
    return this.availableCells().length > 0;
  }

  cellAvailable(cell) {
    return !this.cellOccupied(cell);
  }

  cellOccupied(cell) {
    return !!this.cellContent(cell);
  }

  cellContent(cell) {
    return this.withinBounds(cell) ? this.cells[cell.x][cell.y] : null;
  }

  // Inserts a tile at its position
  insertTile(tile) {
    this.cells[tile.x][tile.y] = tile;
  }

  removeTile(tile) {
    this.cells[tile.x][tile.y] = null;
  }

  withinBounds(position) {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }

  serialize() {
    return {
      size: this.size,
      cells: this.cells.map(row =>
        row.map(tile => (tile ? tile.serialize() : null))
      ),
    };
  }
}
