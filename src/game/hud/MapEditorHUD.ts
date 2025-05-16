import { GAME_CONFIG } from "../config";

type Tool = {
  name: string;
  emoji: string;
}

const tools: Tool[] = [{
  name: 'delete',
  emoji: '🗑'
}]
export default class MapEditorHUD extends Phaser.GameObjects.Container {
  scene: Phaser.Scene;
  tilePalette: Phaser.GameObjects.Group;
  selectedTileIndex: number;
  selectedToolIndex: number;


  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.scene = scene;

    const width = scene.scale.width;

    const header = scene.add.rectangle(0, 0, width, GAME_CONFIG.STYLE.HEADER_HEIGHT, 0x333333)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    const title = scene.add.text(10, 6, '🗺 Map Editor', {
      fontSize: 16,
      color: '#ffffff'
    });

    const saveBtn = scene.add.text(width - 160, 6, '💾 Save', {
      fontSize: 16,
      color: '#00ff00'
    }).setInteractive();
    saveBtn.on('pointerdown', () => {
      console.log('saveBtn clicked');
      this.scene.events.emit('hud:save');
    });
    saveBtn.on('pointerover', () => {
      this.scene.input.manager.canvas.style.cursor = 'pointer';
    });

    saveBtn.on('pointerout', () => {
      this.scene.input.manager.canvas.style.cursor = 'default';
    });

    const playBtn = scene.add.text(width - 80, 6, '▶ Play', {
      fontSize: 16,
      color: '#00ccff'
    }).setInteractive();
    playBtn.on('pointerdown', () => {
      console.log('playBtn clicked');
      this.scene.events.emit('hud:play');
    });
    playBtn.on('pointerover', () => {
      this.scene.input.manager.canvas.style.cursor = 'pointer';
    });

    playBtn.on('pointerout', () => {
      this.scene.input.manager.canvas.style.cursor = 'default';
    });

    this.createTilePalette();
    this.createToolPalette();

    this.add([header, title, saveBtn, playBtn]);
  }

  createTilePalette() {
    const tileIndices = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27];
    this.tilePalette = this.scene.add.group();

    tileIndices.forEach((index, i) => {
      const width = GAME_CONFIG.TILE_SIZE;
      const height = GAME_CONFIG.TILE_SIZE;
      const tilesPerRow = 2;

      const rowN = 1 + Math.floor(i / tilesPerRow);
      const colN = 1 + i % tilesPerRow;

      const x = colN * width;
      const y = GAME_CONFIG.STYLE.HEADER_HEIGHT + rowN * height;

      const img = this.scene.add.sprite(x, y, GAME_CONFIG.TILESET_SPRITESHEET_KEY, index)
        .setInteractive()
        .setScale(1.0)
        .setScrollFactor(0);

      this.tilePalette.add(img);
      this.add(img);

      // Handle clicks on the tile palette
      img.on('pointerdown', () => {
        console.log('Selected tile from palette:', index);
        this.scene.events.emit('hud:tile-selected', index);
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
        this.scene.input.manager.canvas.style.cursor = 'pointer';
      });

      img.on('pointerout', () => {
        this.scene.input.manager.canvas.style.cursor = 'default';
      });
    });
  }

  createToolPalette() {
    // this.toolPalette = this.scene.add.group();

    const height = this.scene.scale.height;

    const x = GAME_CONFIG.TILE_SIZE
    const y = height - (Math.round(this.tilePalette.children.size/2) * GAME_CONFIG.TILE_SIZE) + GAME_CONFIG.TILE_SIZE

    console.log({ x, y})

    tools.forEach((tool, i) => {
      const btn = this.scene.add.text(x, y, `${tool.emoji}`, {
        fontSize: 14,
        color: '#ffffff',
        backgroundColor: '#dd2200',
        fixedHeight: GAME_CONFIG.TILE_SIZE,
        fixedWidth: GAME_CONFIG.TILE_SIZE,
        padding: { x: 8, y: 10 }
      })
      .setInteractive()
      .setScrollFactor(0)
      .setOrigin(0.5,0.5)

      btn.on('pointerdown', () => {
        btn.setBackgroundColor(this.selectedToolIndex === 0 ? '#ff5555' : '#cc0000');
        this.scene.events.emit(`hud:${tool.name}-tool-selected`)
      });

      btn.on('pointerover', () => {
        this.scene.input.manager.canvas.style.cursor = 'pointer';
      });

      btn.on('pointerout', () => {
        this.scene.input.manager.canvas.style.cursor = 'default';
      });
      this.add(btn);
    })    
  }
}
