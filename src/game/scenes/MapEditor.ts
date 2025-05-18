import { GAME_CONFIG } from "../config";
import MapEditorHUD from '../hud/MapEditorHUD';
import MapStore from "../store/map";
import BaseScene from "./BaseScene";

export class MapEditor extends BaseScene {
  map: Phaser.Tilemaps.Tilemap;
  editableLayer: Phaser.Tilemaps.TilemapLayer;
  floorLayer: Phaser.Tilemaps.TilemapLayer;
  selectedTileIndex: number = -1; // Default tile to paint
  requiredTypes = ['body_scanner','bag_dropoff_passenger_bay','bag_pickup_passenger_bay','gate'];

  ghostTile: Phaser.GameObjects.Sprite;
  hoverEnabled: boolean = true;

  getTileAtPointer: (pointer: Phaser.Input.Pointer) => { tileX: number, tileY: number };

  constructor () {
    super({ key: 'MapEditor' });
  }

  create() {
    super.create();

    this.createBaseLayout();

    const hud = new MapEditorHUD(this);
    this.uiContainer.add(hud);

    this.events.on('hud:save', () => this.saveMap());
    this.events.on('hud:play', () => this.scene.start('Game'));
    this.events.on('hud:back', () => this.scene.start('MainMenu'));
    this.events.on('hud:tile-selected', (index: number) => {
      this.selectedTileIndex = index;
      this.ghostTile.setFrame(index);
      this.ghostTile.clearTint();
      this.ghostTile.setVisible(true);
    });
    this.events.on('hud:delete-tool-selected', () => {
      console.log('bing')
      this.selectedTileIndex = -1;
      this.ghostTile.setFrame(-1);
      this.ghostTile.setTint(0xff0000, 0.9);
      this.ghostTile.setVisible(false);
    });

    const mapStore = MapStore.load();

    // Create the tilemap with the correct dimensions
    this.map = this.tilemapUtils.createNewTilemap();
    const tileset = this.tilemapUtils.createNewTilemapTileset(this.map, 'airport-tilemap-spritesheet');

    // Create the floor layer
    this.floorLayer = this.tilemapUtils.createFloorLayer(this.map, tileset);
    // this.floorLayer.setInteractive();
    
    // Create the editable layer
    this.editableLayer = this.tilemapUtils.createNewTilemapLayer(this.map, 'editable', tileset);
    if(mapStore) {
      mapStore.layerIndices.forEach((row, y) => {
        row.forEach((tileIndex, x) => {
          if (tileIndex !== -1) {
            this.editableLayer?.putTileAt(tileIndex, x, y);
          }
        });
      });
    }
    
    this.editableLayer.setVisible(true);

    this.gameContainer.add(this.floorLayer);
    this.gameContainer.add(this.editableLayer);

    this.tilemapUtils.fitCameraToMap(this.map);

    this.getTileAtPointer = (pointer: Phaser.Input.Pointer) => {
      // Adjust for gameContainer offset
      const localX = pointer.worldX - this.gameContainer.x;
      const localY = pointer.worldY - this.gameContainer.y;
    
      const tileX = Math.floor(localX / GAME_CONFIG.TILE_SIZE);
      const tileY = Math.floor(localY / GAME_CONFIG.TILE_SIZE);
    
      return { tileX, tileY };
    }

    // Handle clicks on the map area
    this.floorLayer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const { tileX, tileY } = this.getTileAtPointer(pointer);
      console.log('Click on floor:', tileX, tileY);
    });

    this.editableLayer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const { tileX, tileY } = this.getTileAtPointer(pointer);

      // Check if click is within map bounds
      if (tileX < 0 || tileX >= GAME_CONFIG.MAP_WIDTH || tileY < 0 || tileY >= GAME_CONFIG.MAP_HEIGHT) {
        console.log('Click outside map bounds');
        return;
      }

      // Place the tile and ensure it's visible
      const tile = this.editableLayer.putTileAt(this.selectedTileIndex, tileX, tileY);

      if (tile) {
        tile.setVisible(true);
      } else {
        console.error('Failed to place tile');
      }
    });

    // Try using the scene's dimensions instead
    const width = this.gameContainer.width;
    const height = this.gameContainer.height;
    const x = this.gameContainer.x;
    const y = this.gameContainer.y;

    const inputZone = new Phaser.GameObjects.Zone(
      this,
      x,
      y,
      width,
      height
    )
    .setOrigin(0)
    .setInteractive()
    .setScrollFactor(0);

    this.add.existing(inputZone);
    this.gameCamera.ignore([inputZone]);

    // hover highlight
    // 1. Create a highlight square
    // this.ghostTile = this.add
    //   .rectangle(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE)
    //   .setStrokeStyle(2, 0xffff00)
    //   .setFillStyle(0xffff00, 0.2)
    //   .setVisible(false);

    this.ghostTile = this.add.sprite(0, 0, GAME_CONFIG.TILESET_SPRITESHEET_KEY, this.selectedTileIndex)
      .setAlpha(0.5)
      .setVisible(false)
      .setDepth(1000) // ensure it's above everything
      .setScrollFactor(0); // optional — disable scrolling if needed

    this.ghostTile.setFrame(this.selectedTileIndex);

    this.gameContainer.add(this.ghostTile); // Ensure it's in the game container
    this.uiCamera.ignore(this.ghostTile);   // Don't render it in the UI

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.hoverEnabled) return;
  
      const { tileX, tileY } = this.getTileAtPointer(pointer)

      if (
        tileX >= 0 && tileX < GAME_CONFIG.MAP_WIDTH &&
        tileY >= 0 && tileY < GAME_CONFIG.MAP_HEIGHT
      ) {
        const snappedX = tileX * GAME_CONFIG.TILE_SIZE - this.gameContainer.x;
        const snappedY = tileY * GAME_CONFIG.TILE_SIZE - this.gameContainer.y;
    
        this.ghostTile.setPosition(
          snappedX + GAME_CONFIG.TILE_SIZE / 2,
          snappedY + GAME_CONFIG.TILE_SIZE / 2
        );
        this.ghostTile.setVisible(true);
      } else {
        this.ghostTile.setVisible(false);
      }
    });
    
    this.input.on('pointerout', () => {
      this.ghostTile.setVisible(false);
    });    
    
    inputZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.worldX - this.gameContainer.x;
      const localY = pointer.worldY - this.gameContainer.y;
      
      const tileX = Math.floor(localX / GAME_CONFIG.TILE_SIZE);
      const tileY = Math.floor(localY / GAME_CONFIG.TILE_SIZE);
      
      console.log(`InputZone :: P(${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)}) T(${tileX}, ${tileY})`);

      console.log('Raw pointer coordinates:', {
        worldX: pointer.worldX,
        worldY: pointer.worldY,
        x: pointer.x,
        y: pointer.y
      });

      this.editableLayer.putTileAt(this.selectedTileIndex, tileX, tileY);
    });

    // Optional: Add a small UI or hotkeys to change selectedTileIndex
  }

  saveMap(): void {
    const { valid, missingTiles } = this.tilemapUtils.validateEditableLayer(this.editableLayer, this.requiredTypes);
    if(!valid) {
      alert(`Map is missing required tiles: ${missingTiles.join(', ')}`);
      return;
    }

    const layerIndices = this.editableLayer.layer.data.map((row: Phaser.Tilemaps.Tile[]) =>
      row.map((tile: Phaser.Tilemaps.Tile) => tile.index)
    )

    if(!layerIndices) {
      console.error('No layer data found');
      return;
    }

    const savedData = {
      name: 'Custom Map 1',
      width: GAME_CONFIG.MAP_WIDTH,
      height: GAME_CONFIG.MAP_HEIGHT,
      tileSize: GAME_CONFIG.TILE_SIZE,
      layerIndices
    };
    
    MapStore.save(savedData);
  }
}
