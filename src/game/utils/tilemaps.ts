import { AStarFinder } from "astar-typescript";

const getTilemapMatrix = (layer: Phaser.Tilemaps.TilemapLayer) => {
  const grid: number[][] = [];
  for (let y = 0; y < layer.layer.height; y++) {
    const row: number[] = [];
    for (let x = 0; x < layer.layer.width; x++) {
      const tile = layer.getTileAt(x, y);
  
      // Example: block if tile has 'collides' property, otherwise walkable
      const isBlocked = tile && tile.properties.collides;
      row.push(isBlocked ? 1 : 0);
    }
    grid.push(row);
  }

  return grid;
}

export class PathFinder {
  public tilemap: Phaser.Tilemaps.Tilemap;
  private aStar: AStarFinder;
  private grid: number[][];

  constructor(tilemap: Phaser.Tilemaps.Tilemap, layer: Phaser.Tilemaps.TilemapLayer) {
    this.tilemap = tilemap;
    this.grid = getTilemapMatrix(layer);
    this.aStar = new AStarFinder({
      grid: { matrix: this.grid },
      diagonalAllowed: false
    });
  }

  findPath(start: Phaser.Types.Math.Vector2Like, end: Phaser.Types.Math.Vector2Like) {
    const startTileX = this.tilemap.worldToTileX(start.x);
    const startTileY = this.tilemap.worldToTileY(start.y);
    const endTileX = this.tilemap.worldToTileX(end.x);
    const endTileY = this.tilemap.worldToTileY(end.y);

    if(startTileX === null || startTileY === null || endTileX === null || endTileY === null) {
      throw new Error('Invalid start or end tile coordinates');
    }

    return this.aStar.findPath(
      { x: startTileX, y: startTileY },
      { x: endTileX, y: endTileY }
    );
  }
}