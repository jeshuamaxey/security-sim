
import { passengers } from '../main';
import Passenger, { PassengerTask, PassengerTexture } from '../passenger/Passenger';
import { PathFinder } from '../utils/tilemaps';
import { PASSENGER } from '../passenger/constants';
import getPassengerTasks, { TaskDestinationMap } from '../tasks/tasks';
import { GAME_CONFIG } from '../config';
import Bag from '../bag/Bag';
import BaseScene from './BaseScene';
import GameHUD from '../hud/GameHUD';
import MapStore from '../store/map';
import LevelProgressStore, { LevelScore } from '../store/levelProgress';
import { LevelConfig } from '../levels';
import UIButton from '../ui/Button';
import { COLORS } from '../colors';

const DEBUG_TILES = false;
export class Game extends BaseScene
{
    map: Phaser.Tilemaps.Tilemap;
    collidablesLayer: Phaser.Tilemaps.TilemapLayer | null;

    currentLevel: LevelConfig;
    spawnedPassengerCount: number;
    processedPassengerCount: number;
    suspiciousItemsPassed: number;
    spawnTimer: Phaser.Time.TimerEvent;

    levelStartTime: number;
    levelStarted: boolean;
    levelCompleted: boolean;

    isPaused: boolean = false;
    pauseStartTime: number | null = null;
    pauseOffset: number = 0; // time paused (in ms)

    passengers: Phaser.GameObjects.Group;
    bags: Phaser.GameObjects.Group;
    focusPassenger: Passenger | null;

    pathFinder: PathFinder;

    hud: GameHUD;

    uiElements: {
      playPause?: Phaser.GameObjects.Text;
      timeText?: Phaser.GameObjects.Text;
      passengerCount?: Phaser.GameObjects.Text;
      exitBtn?: Phaser.GameObjects.Text;
      debugToggle?: Phaser.GameObjects.Text;

      debugText?: Phaser.GameObjects.Text;
      spawnButton?: Phaser.GameObjects.Text;
      spawnButtonDebug?: Phaser.GameObjects.Text;
    };

    debugVisible: boolean;
    debugElements: Phaser.GameObjects.Text[];

    gameText: Phaser.GameObjects.Text;
    spawnButton: Phaser.GameObjects.Text;
    spawnButtonDebug: Phaser.GameObjects.Text;
    passengerListText: Phaser.GameObjects.Text;
    focusPassengerDetails: Phaser.GameObjects.Text;
    scoreText: Phaser.GameObjects.Text;
    timerText: Phaser.GameObjects.Text;
    pauseButton: Phaser.GameObjects.Text;

    destinations: TaskDestinationMap;
    passengerTasks: PassengerTask[];

    constructor ()
    {
      super({ key: 'Game' });
    }

    create ()
    {
      // LEVEL
      const level = LevelProgressStore.getNextIncompleteLevel();
      if (!level) {
        console.warn('No levels remaining!');
        return;
      }
      
      this.currentLevel = level;

      
      // LAYER CREATION
      this.createBaseLayout();

      this.events.on('pause-game', () => this.pauseGame());
      this.events.on('resume-game', () => this.resumeGame());
      this.events.on('spawn-passenger', () => this.spawnPassenger(this.pathFinder));
      this.events.on('spawn-passenger-debug', () => this.spawnPassenger(this.pathFinder, true));

      const mapStore = MapStore.load();

      if(!mapStore) {
        console.error('Failed to load map from store');
        return;
      }

      this.map = this.tilemapUtils.createNewTilemap();

      const tileset = this.map.addTilesetImage(GAME_CONFIG.TILESET_KEY, GAME_CONFIG.TILESET_IMAGE_KEY, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE, 0, 0); // name must match what's in Tiled

      if(!tileset) {
        console.error('Failed to create tileset');
        return;
      }
      
      const floorLayer = this.tilemapUtils.createFloorLayer(this.map, tileset);
      
      // create the collidables layer and assign tile properties
      this.collidablesLayer = this.map.createBlankLayer('collidables', tileset, 0, 0);

      if(!this.collidablesLayer) {
        console.error('Failed to create collidables layer');
        return;
      }

      mapStore.layerIndices.forEach((row, y) => {
        row.forEach((tileIndex, x) => {
          if (tileIndex !== -1) {
            const tile = this.collidablesLayer?.putTileAt(tileIndex, x, y);

            const props = this.tilemapUtils.tileProperties?.[tileIndex];

            if(tile && props) {
              tile.properties = {...props};
            }
          }
        });
      });

      this.collidablesLayer.setCollisionByProperty({ collides: true });

      this.tilemapUtils.enableTileClickLogging(this.collidablesLayer);

      this.gameContainer.add(floorLayer);
      this.gameContainer.add(this.collidablesLayer);

      this.tilemapUtils.fitCameraToMap(this.map);

      if(DEBUG_TILES) {
        const debugGraphics = this.add.graphics().setAlpha(0.75);
        this.collidablesLayer.renderDebug(debugGraphics, {
          tileColor: null, // No color for non-colliding tiles
          collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255), // Red for collidable tiles
          faceColor: new Phaser.Display.Color(0, 255, 0, 255) // Green for collision face edges
        });
      }

      this.destinations = this.tilemapUtils.findDestinationsInLayer(this.collidablesLayer);

      this.pathFinder = new PathFinder(this.map, this.collidablesLayer);

      this.passengers = this.add.group({
        classType: Passenger,
        maxSize: 100,
        runChildUpdate: true
      });

      this.bags = this.add.group({
        classType: Bag,
        maxSize: 100,
        runChildUpdate: true
      });

      this.hud = new GameHUD(this, this.uiContainer, this.passengers);

      this.showPreGameModal(this.currentLevel);
    }

    showPreGameModal(level: LevelConfig) {
      const modal = this.add.container(0, 0).setScrollFactor(0);
      const bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
        .setOrigin(0)
        .setInteractive();
    
      const title = this.add.text(this.scale.width / 2, 100, level.name, {
        fontSize: '32px',
        color: COLORS.white
      }).setOrigin(0.5);
    
      const description = this.add.text(this.scale.width / 2, 160, level.description || '', {
        fontSize: '18px',
        color: COLORS.lightGray,
        wordWrap: { width: this.scale.width * 0.8 }
      }).setOrigin(0.5);
    
      const playButton = new UIButton(this, this.scale.width / 2, 240, '▶ Play', {
        onClick: () => {
          modal.destroy();
          this.startLevel(level);
        }
      }, {
        fontSize: '24px',
        backgroundColor: COLORS.green,
        padding: { x: 12, y: 6 },
        color: COLORS.white
      }).setOrigin(0.5)
    
      modal.add([bg, title, description, playButton]);
      this.uiContainer.add(modal);
    }

    startLevel(level: LevelConfig) {
      this.currentLevel = level;
      this.levelStartTime = this.time.now;
      this.levelStarted = true;
      this.spawnedPassengerCount = 0;
      this.processedPassengerCount = 0;
      this.suspiciousItemsPassed = 0;
    
      const spawnInterval = 1000 * level.spawnRate;
    
      // Begin auto-spawning
      if(!level.isDebug) {
        this.spawnTimer = this.time.addEvent({
          delay: spawnInterval,
          callback: () => {
          if (this.spawnedPassengerCount >= level.passengerCount) {
            this.spawnTimer.remove();
            return;
          }
    
          this.spawnPassenger(this.pathFinder);
          this.spawnedPassengerCount++;
        },
          callbackScope: this,
          loop: true
        });
      } else {
        this.spawnTimer = this.time.addEvent({
          delay: 5000,
          callback: () => {
            console.log('not spawning passengers in debug mode');
          },
          callbackScope: this,
          loop: true
        });
      }
    }

    getElapsedLevelTime(): number {
      if (!this.levelStarted || this.levelStartTime === null) return 0;
    
      const now = this.isPaused && this.pauseStartTime !== null
        ? this.pauseStartTime
        : this.time.now;
    
      return (now - this.levelStartTime - this.pauseOffset) / 1000;
    }

    pauseGame() {
      if (!this.isPaused) {
        this.isPaused = true;
        this.pauseStartTime = this.time.now;
    
        this.physics.world.pause();
        this.spawnTimer.paused = true;
        this.passengers.getChildren().forEach(p => (p as Passenger).pause());
      }
    }
    
    resumeGame() {
      if (this.isPaused) {
        this.isPaused = false;
        if (this.pauseStartTime !== null) {
          this.pauseOffset += this.time.now - this.pauseStartTime;
          this.pauseStartTime = null;
        }
    
        this.physics.world.resume();
        this.spawnTimer.paused = false;
        this.passengers.getChildren().forEach(p => (p as Passenger).resume());
      }
    }
    
    completeLevel() {
      this.levelCompleted = true;
      const timeTaken = this.getElapsedLevelTime();
    
      const score = {
        suspiciousItemsPassed: this.suspiciousItemsPassed,
        passengersProcessed: this.processedPassengerCount,
        timeTaken,
        completed: true,
        passed: this.suspiciousItemsPassed <= (this.currentLevel.kpis.find(kpi => kpi.key === 'suspiciousItemsPassed')?.max ?? 0)
      };
    
      LevelProgressStore.markLevelComplete(this.currentLevel.id, score);
    
      this.showLevelCompleteModal(score);
    }

    showLevelCompleteModal(score: LevelScore) {
      const modal = this.add.container(0, 0).setScrollFactor(0);
    
      const bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8)
        .setOrigin(0)
        .setInteractive();
    
      const resultText = score.passed ? '✅ Level Passed' : '❌ Level Failed';
      const summary = `Suspicious items: ${score.suspiciousItemsPassed}\nProcessed: ${score.passengersProcessed}\nTime: ${Math.round(score.timeTaken)}s`;
    
      const title = this.add.text(this.scale.width / 2, 150, resultText, {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5);
    
      const stats = this.add.text(this.scale.width / 2, 220, summary, {
        fontSize: '18px',
        color: COLORS.lightGray,
        align: 'center'
      }).setOrigin(0.5);

      const button = new UIButton(this, this.scale.width / 2, 300, '↩ Return to Menu', {
        onClick: () => {
          this.scene.start('MainMenu'); // or whatever your menu scene is
        }
      }, {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#0077cc',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
    
      modal.add([bg, title, stats, button]);
      this.uiContainer.add(modal);
    }
      
    spawnPassenger (pathFinder: PathFinder, debug: boolean = false): Passenger
    {
      const passengerData = passengers[Math.floor(Math.random() * passengers.length)];
      
      const xPadding = 0;//passengerData.width / 2;
      const yPadding = passengerData.height / 2;
      
      // const spawnX = xPadding;
      // const spawnY = SIZE.HEIGHT - yPadding;

      const tileSize = 32;
      const spawnX = Phaser.Math.Snap.Floor(this.gameCamera.worldView.left + xPadding, tileSize);
      const spawnY = Phaser.Math.Snap.Floor(this.gameCamera.worldView.bottom - yPadding, tileSize);
      const visualOffsetY = tileSize * (1 - PASSENGER.ORIGIN_Y);

      const bag = new Bag(this, spawnX, spawnY - visualOffsetY, 'bag', {
        contents: {
          has_electronics: true,
          has_liquids: true,
          has_suspicious_item: true
        },
        onPerson: true
      });

      this.uiCamera.ignore(bag);
      
      this.bags.add(bag);
      
      const newPassenger = new Passenger(this, spawnX, spawnY, passengerData.sprite, {
        name: passengerData.name as PassengerTexture,
        tasks: getPassengerTasks(this.destinations),
        pathFinder: pathFinder,
        bag: bag,
        debug: debug ? {
          showPath: true,
          showPathTraced: true,
          debugLog: true,
          showDestinations: true
        } : undefined,
        onArrivedAtAirside: () => {
          this.updateScore();
        }
      });

      this.uiCamera.ignore(newPassenger);

      // @ts-ignore
      const collider = this.physics.add.overlap(newPassenger, this.passengers, (passenger: Passenger, other: Passenger) => {
        passenger.onHitOtherPassenger(other);
        other.onHitOtherPassenger(passenger);

        collider.active = false;

        this.time.delayedCall(PASSENGER.WAIT_AFTER_COLLISION_MS, () => {
          collider.active = true;
        });
      });

      //detect when passenger is clicked on
      newPassenger.setInteractive();
      newPassenger.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.focusPassenger = newPassenger;

        newPassenger.debug.debugLog = !newPassenger.debug.debugLog;
      });
      
      this.passengers.add(newPassenger);

      return newPassenger;
    }

    private updateScore() {
      this.processedPassengerCount++;
    }

    update (time: number, delta: number)
    {
      if(!this.levelStarted || this.levelCompleted || this.isPaused) {
        return;
      }

      if (
        this.currentLevel &&
        this.processedPassengerCount >= this.currentLevel.passengerCount &&
        !this.levelCompleted
      ) {
        this.completeLevel();
      }

      this.hud.updateHUD(this.getElapsedLevelTime(), this.processedPassengerCount, this.currentLevel.passengerCount);
    }
}
