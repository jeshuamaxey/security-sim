import { AStarFinder } from "astar-typescript";
import { TaskDestination, TaskDestinationMap } from "../tasks/tasks";
import { GAME_CONFIG } from "../config";

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
  private gridWidth: number;
  private gridHeight: number;

  constructor(tilemap: Phaser.Tilemaps.Tilemap, layer: Phaser.Tilemaps.TilemapLayer) {
    this.tilemap = tilemap;
    this.grid = getTilemapMatrix(layer);
    this.gridWidth = this.grid[0].length;
    this.gridHeight = this.grid.length;

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
    const isWithinBounds = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < this.gridWidth && y < this.gridHeight;


      if (
        !isWithinBounds(start.tileX, start.tileY) ||
        !isWithinBounds(end.tileX, end.tileY)
      ) {
        console.warn('Pathfinding attempted out of bounds', start, end);
        return [];
      }


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

type TileCacheObject = {
  id: number;
  properties: { name: string, value: string, type: string }[];
}

export type TilePropertiesMap = { [key: number]: { [key: string]: string } };

export class TilemapUtils {
  private scene: Phaser.Scene;
  private gridWidth: number;
  private gridHeight: number;

  private tiles: TileCacheObject[];
  private _tileProperties: TilePropertiesMap;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gridWidth = GAME_CONFIG.MAP_WIDTH;
    this.gridHeight = GAME_CONFIG.MAP_HEIGHT;
  }

  loadTileProperties() {
    const t = this.scene.cache.tilemap.get(GAME_CONFIG.TILEMAP_KEY);
    this.tiles = t.data.tilesets[0].tiles
    this._tileProperties = this.tiles.reduce((acc: TilePropertiesMap, tile: TileCacheObject) => {
      const props = tile.properties.reduce((acc: { [key: string]: string }, prop: { name: string, value: string, type: string }) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {});

      acc[tile.id] = props;
      return acc;
    }, {});
  }

  public get tileProperties() {
    if(!this._tileProperties) {
      this.loadTileProperties();
    }
    return this._tileProperties;
  }

  createNewTilemap() {
    const tilemap = this.scene.make.tilemap({
      width: this.gridWidth,
      height: this.gridHeight,
      tileWidth: GAME_CONFIG.TILE_SIZE,
      tileHeight: GAME_CONFIG.TILE_SIZE
    });

    return tilemap;
  }

  createNewTilemapLayer(tilemap: Phaser.Tilemaps.Tilemap, name: string, tileset: Phaser.Tilemaps.Tileset) {
    const layer = tilemap.createBlankLayer(name, tileset, 0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    if(!layer) {
      throw new Error('Failed to create new tilemap layer');
    }
    return layer;
  }

  createFloorLayer(tilemap: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset) {
    const layer = tilemap.createBlankLayer('floor', tileset, 0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    if(!layer) {
      throw new Error('Failed to create floor layer');
    }
    layer.fill(0);
    return layer;
  }

  createNewTilemapTileset(tilemap: Phaser.Tilemaps.Tilemap, name: string) {
    const tileset = tilemap.addTilesetImage(GAME_CONFIG.TILESET_KEY, GAME_CONFIG.TILESET_IMAGE_KEY);
    if (!tileset) {
      throw new Error('Failed to load tileset');
    }
    return tileset;
  }

  validateEditableLayer(layer: Phaser.Tilemaps.TilemapLayer, validationList?: string[]): { valid: boolean, missingTiles: string[] } {
    const requiredTypes = validationList || ['body_scanner','bag_dropoff_passenger_bay','bag_pickup_passenger_bay','gate'];

    const tiles = layer.getTilesWithin(0, 0, this.gridWidth, this.gridHeight);

    console.log(this._tileProperties);

    const tilesUsed: string[] = tiles.reduce((acc: string[], tile: Phaser.Tilemaps.Tile) => {
      const tileProps = this._tileProperties[tile.index];
      if(tileProps && tileProps.destinationKey && !acc.includes(tileProps.destinationKey)) {
        acc.push(tileProps.destinationKey);
      }
      return acc;
    }, []);

    console.log('tilesUsed', tilesUsed);

    const missingTiles = requiredTypes.filter((type) => !tilesUsed.includes(type));

    return { valid: missingTiles.length === 0, missingTiles };
  }

  addPropertiesToTiles(tiles: Phaser.Tilemaps.Tile[]) {
    return tiles.map((tile: Phaser.Tilemaps.Tile) => {
      if(tile.index === -1) {
        return tile;
      }

      if(this._tileProperties[tile.index]) {
        const props = this._tileProperties[tile.index];
        tile.properties = {...props};
      }
      return tile;
    });
  }
  
  addPropertiesToLayer(layer: Phaser.Tilemaps.TilemapLayer) {
    if(!this._tileProperties) {
      this.loadTileProperties();
    }

    const tiles = layer.layer.data.flat();
    this.addPropertiesToTiles(tiles);
  }

  findDestinationsInLayer(tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
    if(!this._tileProperties) {
      this.loadTileProperties();
    }

    const passengerInteractiveTiles = tilemapLayer.getTilesWithin(0, 0, tilemapLayer.width, tilemapLayer.height)
      .filter((tile: any) => tile.index > -1)
      .filter((tile: any) => this._tileProperties[tile.index]?.passengerInteractive)
      .map((tile: any) => ({...tile, properties: this._tileProperties[tile.index]}));
  
    const bagDropoffPassengerBayTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'bag_dropoff_passenger_bay');
    // const bagDropoffTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'bag_dropoff');
    const bodyScannerTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'body_scanner');
    const bagPickupTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'bag_pickup_passenger_bay');
    const gateTiles = passengerInteractiveTiles.filter((tile: any) => tile.properties.destinationKey === 'gate');
  
    const scaleX = tilemapLayer.scaleX;
    const scaleY = tilemapLayer.scaleY;

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

  findClosestTile(
    point: { x: number; y: number },
    tiles: Phaser.Tilemaps.Tile[]
  ): Phaser.Tilemaps.Tile | null {
    if (!tiles.length) return null;
  
    let closestTile = tiles[0];
    let shortestDistance = Phaser.Math.Distance.Between(
      point.x,
      point.y,
      closestTile.getCenterX(),
      closestTile.getCenterY()
    );
  
    for (let i = 1; i < tiles.length; i++) {
      const tile = tiles[i];
      const distance = Phaser.Math.Distance.Between(
        point.x,
        point.y,
        tile.getCenterX(),
        tile.getCenterY()
      );
  
      if (distance < shortestDistance) {
        closestTile = tile;
        shortestDistance = distance;
      }
    }
  
    return closestTile;
  }

  enableTileClickLogging(
    layer: Phaser.Tilemaps.TilemapLayer,
  ) {
    layer.setInteractive();
  
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
  
      const tile = layer.getTileAtWorldXY(worldPoint.x, worldPoint.y);
  
      if (tile) {
        console.log('Clicked tile:', {
          index: tile.index,
          x: tile.x,
          y: tile.y,
          properties: tile.properties,
          pixelX: tile.pixelX,
          pixelY: tile.pixelY
        });
      } else {
        console.log('No tile at clicked position');
      }
    });
  }
}
