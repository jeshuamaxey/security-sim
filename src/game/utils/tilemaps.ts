import { AStarFinder } from "astar-typescript";
import { TaskDestination, TaskDestinationMap } from "../tasks/tasks";

const getTilemapMatrix = (layer: Phaser.Tilemaps.TilemapLayer) => {
  const grid: number[][] = [];
  for (let y = 0; y < layer.layer.height; y++) {
    const row: number[] = [];
    for (let x = 0; x < layer.layer.width; x++) {
      const tile = layer.getTileAt(x, y);
  
      // A* expects 0 for walkable and 1 for blocked
      // https://www.npmjs.com/package/astar-typescript
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
    console.log({grid: this.grid})
    this.aStar = new AStarFinder({
      grid: { matrix: this.grid },
      diagonalAllowed: false
    });
  }

  /**
   * Find a path between two points in the tilemap
   * @param start - The starting point in world coordinates
   * @param end - The ending point in world coordinates
   * @returns The path between the two points in tile coordinates
   */
  findPathInTileCoords(start: TaskDestination, end: TaskDestination) {
    const path = this.aStar.findPath(
      { x: start.tileX, y: start.tileY },
      { x: end.tileX, y: end.tileY }
    );

    return path;
  }

  /**
   * Find a path between two points in the tilemap
   * @param start - The starting point in world coordinates
   * @param end - The ending point in world coordinates
   * @returns The path between the two points in world coordinates
   */
  findPathInWorldCoords(start: TaskDestination, end: TaskDestination) {
    const pathInTileCoords = this.findPathInTileCoords(start, end);
    const pathInWorldCoords = pathInTileCoords.map(([tileX, tileY]) => {
      const worldX = this.tilemap.tileToWorldX(tileX);
      const worldY = this.tilemap.tileToWorldY(tileY);

      if(worldX === null || worldY === null) {
        throw new Error('Invalid tile coordinates');
      }
      return {
        x: worldX + this.tilemap.tileWidth / 2,
        y: worldY + this.tilemap.tileHeight / 2
      };
    });
    return pathInWorldCoords;
  }
}

export const findDestinationsInLayer = (tilemapLayer: Phaser.Tilemaps.TilemapLayer) => {
  const passengerInteractiveTiles = tilemapLayer.getTilesWithin(0, 0, tilemapLayer.width, tilemapLayer.height)
    .filter((tile: any) => tile.properties.passengerInteractive);

  const bagDropoffPassengerBayTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'bag_dropoff_passenger_bay');
  // const bagDropoffTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'bag_dropoff');
  const bodyScannerTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'body_scanner');
  const bagPickupTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'bag_pickup_passenger_bay');
  const gateTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'gate');

  const scaleX = tilemapLayer.scaleX;
  const scaleY = tilemapLayer.scaleY;
  console.log({bagDropoffPassengerBayTiles, bodyScannerTiles, bagPickupTiles, gateTiles, scaleX, scaleY})

  console.warn('NB we pick only the first of each collidables we find. maps with multiple drop offs etc wont work as intended')

  const destinations: TaskDestinationMap = {
    bag_dropoff_passenger_bay: {
      tileX: bagDropoffPassengerBayTiles[0].x,
      tileY: bagDropoffPassengerBayTiles[0].y,
      x: bagDropoffPassengerBayTiles[0].pixelX*scaleX + bagDropoffPassengerBayTiles[0].width / 2,
      y: bagDropoffPassengerBayTiles[0].pixelY*scaleY + bagDropoffPassengerBayTiles[0].height / 2
    },
    // bag_dropoff: {
    //   tileX: bagDropoffTiles[0].x,
    //   tileY: bagDropoffTiles[0].y,
    //   x: bagDropoffTiles[0].pixelX*scaleX + bagDropoffTiles[0].width / 2,
    //   y: bagDropoffTiles[0].pixelY*scaleY + bagDropoffTiles[0].height / 2
    // },
    body_scanner: {
      tileX: bodyScannerTiles[0].x,
      tileY: bodyScannerTiles[0].y,
      x: bodyScannerTiles[0].pixelX*scaleX + bodyScannerTiles[0].width / 2,
      y: bodyScannerTiles[0].pixelY*scaleY + bodyScannerTiles[0].height / 2
    },
    bag_pickup_passenger_bay: {
      tileX: bagPickupTiles[0].x,
      tileY: bagPickupTiles[0].y,
      x: bagPickupTiles[0].pixelX*scaleX + bagPickupTiles[0].width / 2,
      y: bagPickupTiles[0].pixelY*scaleY + bagPickupTiles[0].height / 2
    },
    gate: {
      tileX: gateTiles[0].x,
      tileY: gateTiles[0].y,
      x: gateTiles[0].pixelX*scaleX + gateTiles[0].width / 2,
      y: gateTiles[0].pixelY*scaleY + gateTiles[0].height / 2
    }
  };

  return destinations;
}