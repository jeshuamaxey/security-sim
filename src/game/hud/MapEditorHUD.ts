import { COLORS, COLORS_0x } from "../colors";
import { GAME_CONFIG } from "../config";
import UIButton from "../ui/Button";

type Tool = {
  name: string;
  emoji: string;
  backgroundColor: string
}

const tools: Tool[] = [{
  name: 'delete',
  emoji: '🗑',
  backgroundColor: COLORS.red
}, {
  name: 'rotate',
  emoji: '🔄',
  backgroundColor: COLORS.lightGray
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

    const backBtn = new UIButton(this.scene, width - 240, 6, '↩ Back', {
      onClick: () => {
        this.scene.events.emit('hud:back');
      }
    }, {
      fontSize: 16,
    }, {
      backgroundColor: undefined
    })

    const saveBtn = new UIButton(this.scene, width - 160, 6, '💾 Save', {
      onClick: () => {
        this.scene.events.emit('hud:save');
      }
    }, {
      fontSize: 16,
      color: '#00ff00'
    }, {
      backgroundColor: undefined
    })

    const playBtn = new UIButton(this.scene, width - 80, 6, '▶ Play', {
      onClick: () => {
        this.scene.events.emit('hud:play');
      }
    }, {
      fontSize: 16,
      color: '#00ccff'
    }, {
      backgroundColor: undefined
    })


    this.createTilePalette();
    this.createToolPalette();

    this.add([header, title, saveBtn, playBtn, backBtn]);
  }

  createTilePalette() {
    const tileIndices = [
      // barriers
      5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      15, // body scanner
      16, // body scanner
      17, // bag drop
      18, // bag pickup
      19, // bag convey 
      21, // gate
      22, // bag drop passenger bag
      23, // bag pickup bassenger bag
      // 24, // convey right
      25, // convey up
      // 26, // convey left
      // 27, // convey down
      28, // convey turn right
      29, // convey turn left
    ];
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
    const baseY = (Math.round(this.tilePalette.children.size/2)+2) * GAME_CONFIG.TILE_SIZE

    const selectedToolBg = this.scene.add.rectangle(GAME_CONFIG.TILE_SIZE-1, baseY-1, GAME_CONFIG.TILE_SIZE+2, GAME_CONFIG.TILE_SIZE+2, COLORS_0x.midGreen, 0.6)
    
    tools.forEach((tool, i) => {
      const width = GAME_CONFIG.TILE_SIZE;
      const height = GAME_CONFIG.TILE_SIZE;
      const tilesPerRow = 2;

      const rowN = 1 + Math.floor(i / tilesPerRow);
      const colN = 1 + i % tilesPerRow;

      const x = colN * width;
      const y = GAME_CONFIG.STYLE.HEADER_HEIGHT + rowN * height;

      const btn = this.scene.add.text(x, baseY+y, `${tool.emoji}`, {
        fontSize: 14,
        color: '#ffffff',
        backgroundColor: tool.backgroundColor,
        fixedHeight: GAME_CONFIG.TILE_SIZE,
        fixedWidth: GAME_CONFIG.TILE_SIZE,
        padding: { x: 8, y: 10 }
      })
      .setInteractive()
      .setScrollFactor(0)
      .setOrigin(0.5,0.5)

      btn.on('pointerdown', () => {
        // btn.setBackgroundColor(this.selectedToolIndex === 0 ? '#ff5555' : );
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
