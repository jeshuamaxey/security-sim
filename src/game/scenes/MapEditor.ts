import { GAME_CONFIG } from "../config";
import MapStore from "../store";
import BaseScene from "./BaseScene";

export class MapEditor extends BaseScene {
  map: Phaser.Tilemaps.Tilemap;
  editableLayer: Phaser.Tilemaps.TilemapLayer;
  floorLayer: Phaser.Tilemaps.TilemapLayer;
  selectedTileIndex: number = 1; // Default tile to paint
  requiredTypes = ['body_scanner','bag_dropoff_passenger_bag'];

  getTileAtPointer: (pointer: Phaser.Input.Pointer) => { tileX: number, tileY: number };

  tilePalette: Phaser.GameObjects.Group;

  constructor ()
    {
        super({ key: 'MapEditor' });
    }

  create() {
    this.createBaseLayout();

    // Create the tilemap with the correct dimensions
    this.map = this.make.tilemap({ 
      width: GAME_CONFIG.MAP_WIDTH, 
      height: GAME_CONFIG.MAP_HEIGHT,
      tileWidth: GAME_CONFIG.TILE_SIZE, 
      tileHeight: GAME_CONFIG.TILE_SIZE 
    });
    const tileset = this.map.addTilesetImage(GAME_CONFIG.TILESET_KEY, GAME_CONFIG.TILESET_IMAGE_KEY);
    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }

    // Create the floor layer
    this.floorLayer = this.map.createBlankLayer('floor', tileset, 0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT)!;
    this.floorLayer.fill(0);
    
    // Create the editable layer
    this.editableLayer = this.map.createBlankLayer('editable', tileset, 0, 0, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT)!;
    this.editableLayer.setVisible(true);
    this.editableLayer.setInteractive();

    this.gameContainer.add(this.floorLayer);
    this.gameContainer.add(this.editableLayer);
    this.getTileAtPointer = (pointer: Phaser.Input.Pointer) => {
      // Convert pointer position to layer-local coordinates
      const localX = (pointer.worldX)
      const localY = (pointer.worldY)
      
      // Convert to tile coordinates
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

        // Optional: attach metadata
        tile.properties.type = this.getTileTypeFromIndex(this.selectedTileIndex);
      } else {
        console.error('Failed to place tile');
      }
    });

    // Optional: Add a small UI or hotkeys to change selectedTileIndex
  }

  setupUI() {
    this.createTilePalette();
    this.createSaveButton();
    this.createPlayButton();
  }

  getTileTypeFromIndex(index: number): string | undefined {
    // Match tile index to type (customize to match your tileset)
    switch (index) {
      case 5: return 'scanner';
      case 10: return 'spawn';
      default: return undefined;
    }
  }

  validateMap(): boolean {
    console.warn("skipping map validation");
    return true;
    
    const tiles = this.editableLayer.getTilesWithin(0, 0, this.map.width, this.map.height);
    for (const requiredType of this.requiredTypes) {
      if (!tiles.some(t => t.properties?.destinationKey === requiredType)) {
        alert(`Map missing required tile: ${requiredType}`);
        return false;
      }
    }
    return true;
  }

  saveMap(): void {
    if (!this.validateMap()) return;

    const layer = this.map.getLayer('editable');
    const layerIndices = layer?.data.map(row =>
      row.map(tile => tile.index)
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

  createTilePalette() {
    const tileIndices = [1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27];
    this.tilePalette = this.add.group();

    tileIndices.forEach((index, i) => {
      const width = GAME_CONFIG.MAP_WIDTH;
      const height = GAME_CONFIG.MAP_HEIGHT;
      const tilesPerRow = 2;

      const rowN = 1 + Math.floor(i / tilesPerRow);
      const colN = 1 + i % tilesPerRow;

      const img = this.add.sprite(colN * width, rowN * height, GAME_CONFIG.TILESET_SPRITESHEET_KEY, index)
        .setInteractive()
        .setScale(1.0)
        .setScrollFactor(0);

      this.tilePalette.add(img);
      this.uiContainer.add(img);

      // Handle clicks on the tile palette
      img.on('pointerdown', () => {
        console.log('Selected tile from palette:', index);
        this.selectedTileIndex = index;
        // Visual feedback for selected tile
        this.tilePalette.getChildren().forEach(child => {
          if (child instanceof Phaser.GameObjects.Sprite) {
            child.setTint(0xffffff);
          }
        });
        img.setTint(0x00dd00); // Highlight selected tile
      });

      img.on('pointerover', () => {
        this.input.manager.canvas.style.cursor = 'pointer';
      });

      img.on('pointerout', () => {
        this.input.manager.canvas.style.cursor = 'default';
      });
    });
  }

  createSaveButton() {
    // create a rect to contain the text
    const x = 100;
    const y = this.scale.height - 20;
    const buttonWidth = 70;
    const buttonHeight = 40;

    const saveButtonText = this.add.text(x, y, 'Save', {
      fontSize: 18,
      color: '#000000'
    });
    const saveButton = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0xffffff, 1);
    saveButton.setInteractive();

    this.uiContainer.add(saveButton);
    this.uiContainer.add(saveButtonText);
    saveButton.on('pointerdown', () => {
      this.saveMap();
    });
  }

  createPlayButton() {
    // create a rect to contain the text
    const x = 180;
    const y = this.scale.height - 20;
    const buttonWidth = 70;
    const buttonHeight = 40;

    const playButtonText = this.add.text(x, y, 'Play', {
      fontSize: 18,
      color: '#000000'
    });
    const playButton = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0xffffff, 1);
    playButton.setInteractive();

    this.uiContainer.add(playButton);
    this.uiContainer.add(playButtonText);
    playButton.on('pointerdown', () => {
      this.scene.start('Game');
    });
  }
}
