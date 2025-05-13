import { SIZE } from "../main";
import { GAME_CONFIG } from "../config";
import { TilemapUtils } from "../utils/tilemaps";
export default class BaseScene extends Phaser.Scene {
  gameCamera: Phaser.Cameras.Scene2D.Camera;
  uiCamera: Phaser.Cameras.Scene2D.Camera;

  gameContainer: Phaser.GameObjects.Container;
  uiContainer: Phaser.GameObjects.Container;

  gameAreaWidth: number;
  gameAreaHeight: number;

  tilemapUtils: TilemapUtils;

  constructor(config: Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.tilemapUtils = new TilemapUtils(this);
  }

  create() {
    this.tilemapUtils.loadTileProperties();
  }

  createBaseLayout() {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // Define margins
    const marginX = 100; // left & right

    this.gameAreaWidth = Math.floor((screenWidth - 2 * marginX) / GAME_CONFIG.TILE_SIZE) * GAME_CONFIG.TILE_SIZE;
    this.gameAreaHeight = Math.floor(this.gameAreaWidth * (SIZE.HEIGHT / SIZE.WIDTH) / GAME_CONFIG.TILE_SIZE) * GAME_CONFIG.TILE_SIZE;

    const marginY = (screenHeight - this.gameAreaHeight) / 2;

    // Game container stays static
    this.gameContainer = this.add.container(marginX, marginY);
    this.uiContainer = this.add.container(0, 0);

    this.gameCamera = this.cameras.main;
    this.gameCamera.setViewport(
      marginX,        // x offset from left
      marginY,        // y offset from top
      this.gameAreaWidth,  // width
      this.gameAreaHeight  // height
    );
    this.gameCamera.setBackgroundColor('#ff0000');
    this.gameCamera.ignore(this.uiContainer);
    
    // UI container stays static
    this.uiCamera = this.cameras.add(0, 0, screenWidth, screenHeight);
    this.uiCamera.ignore(this.gameContainer); // Don't render the game world again

    this.gameCamera.setBackgroundColor('rgba(0, 0, 0, 0.9)');
    this.uiCamera.setBackgroundColor('rgba(0, 255, 0, 0.1)');

    this.safeSetupUI();

  }

  safeSetupUI() {
    if (!this.uiContainer) {
      console.warn(`[${this.scene.key}] uiContainer is not initialized before setupUI call.`);
      return;
    }
  
    if (typeof this.setupUI !== 'function') {
      console.warn(`[${this.scene.key}] setupUI() is not defined.`);
      return;
    }
  
    try {
      this.setupUI();
    } catch (err) {
      console.error(`[${this.scene.key}] Error in setupUI():`, err);
    }
  } 

  setupUI() {
    console.log('BaseScene setupUI');
    // Stub to be overridden in subclasses
  }

  fitCameraToWorld(worldWidth: number, worldHeight: number) {
    if (!this.gameCamera || !this.gameAreaWidth || !this.gameAreaHeight) {
      console.warn('Camera or viewport dimensions not set before fitCameraToWorld()');
      return;
    }
  
    const zoomX = this.gameAreaWidth / worldWidth;
    const zoomY = this.gameAreaHeight / worldHeight;
  
    const zoom = Math.min(zoomX, zoomY);
    this.gameCamera.setZoom(zoom);
  }
}
