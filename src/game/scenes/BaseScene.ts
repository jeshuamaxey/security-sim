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

    // this.gameAreaWidth = Math.floor((screenWidth - 2 * marginX) / GAME_CONFIG.TILE_SIZE) * GAME_CONFIG.TILE_SIZE;
    // this.gameAreaHeight = Math.floor(this.gameAreaWidth * (SIZE.HEIGHT / SIZE.WIDTH) / GAME_CONFIG.TILE_SIZE) * GAME_CONFIG.TILE_SIZE;

    // Calculate the required width based on map dimensions
    const requiredWidth = GAME_CONFIG.MAP_WIDTH * GAME_CONFIG.TILE_SIZE;
    const requiredHeight = GAME_CONFIG.MAP_HEIGHT * GAME_CONFIG.TILE_SIZE;

    // Check if the required width fits with margins
    if (requiredWidth > (screenWidth - 2 * marginX)) {
      console.warn('Map width is too large for screen with current margins');
    }

    this.gameAreaWidth = requiredWidth;
    this.gameAreaHeight = requiredHeight;

    const marginY = (screenHeight - this.gameAreaHeight) / 2;

    // Game container stays static
    this.gameContainer = this.add.container(marginX, marginY);
    this.gameContainer.setSize(this.gameAreaWidth, this.gameAreaHeight);
    this.uiContainer = this.add.container(0, 0);

    this.gameCamera = this.cameras.main;
    this.gameCamera.setViewport(
      marginX,        // x offset from left
      marginY,        // y offset from top
      this.gameAreaWidth,  // width
      this.gameAreaHeight  // height
    );

    this.gameCamera.setBackgroundColor(GAME_CONFIG.STYLE.BACKGROUND_COLOR);
    this.gameCamera.ignore(this.uiContainer);
    
    // UI container stays static
    this.uiCamera = this.cameras.add(0, 0, screenWidth, screenHeight);
    this.uiCamera.ignore(this.gameContainer); // Don't render the game world again

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
