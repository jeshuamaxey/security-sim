import { EventBus } from '../EventBus';
import { passengers, SIZE } from '../main';
import Passenger, { PassengerTask, PassengerTexture } from '../passenger/Passenger';
import { findDestinationsInLayer, PathFinder } from '../utils/tilemaps';
import { PASSENGER } from '../passenger/constants';
import getPassengerTasks, { TaskDestinationMap } from '../tasks/tasks';
import { GAME_CONFIG } from '../config';
import Bag from '../bag/Bag';
import BaseScene from './BaseScene';

const DEBUG_TILES = false;
export class Game extends BaseScene
{
    map: Phaser.Tilemaps.Tilemap;
    collidablesLayer: Phaser.Tilemaps.TilemapLayer;

    passengers: Phaser.GameObjects.Group;
    bags: Phaser.GameObjects.Group;

    pathFinder: PathFinder;

    gameText: Phaser.GameObjects.Text;
    spawnButton: Phaser.GameObjects.Text;
    spawnButtonDebug: Phaser.GameObjects.Text;
    passengerListText: Phaser.GameObjects.Text;
    focusPassengerDetails: Phaser.GameObjects.Text;
    scoreText: Phaser.GameObjects.Text;
    focusPassenger: Passenger | null;

    score: number;

    destinations: TaskDestinationMap;
    passengerTasks: PassengerTask[];

    constructor ()
    {
      super({ key: 'Game' });
    }

    create ()
    {
      this.createBaseLayout();

      this.score = 0;

      this.map = this.make.tilemap({ key: GAME_CONFIG.TILEMAP_KEY });

      const tileset = this.map.addTilesetImage(GAME_CONFIG.TILESET_KEY, GAME_CONFIG.TILESET_IMAGE_KEY); // name must match what's in Tiled
      const floorLayer = this.map.createLayer('floor', tileset!, 0, 0)!;
      floorLayer.name = 'floor';
      
      this.collidablesLayer = this.map.createLayer('collidables', tileset!, 0, 0)!;
      this.collidablesLayer.name = 'collidables';
      this.collidablesLayer.setCollisionByProperty({ collides: true });

      this.gameContainer.add(floorLayer);
      this.gameContainer.add(this.collidablesLayer);

      const worldWidth = this.map.widthInPixels;
      const worldHeight = this.map.heightInPixels;

      this.fitCameraToWorld(worldWidth, worldHeight);
      this.gameCamera.centerOn(worldWidth / 2, worldHeight / 2);

      if(DEBUG_TILES) {
        const debugGraphics = this.add.graphics().setAlpha(0.75);
        this.collidablesLayer.renderDebug(debugGraphics, {
          tileColor: null, // No color for non-colliding tiles
          collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255), // Red for collidable tiles
          faceColor: new Phaser.Display.Color(0, 255, 0, 255) // Green for collision face edges
        });
      }

      this.destinations = findDestinationsInLayer(this.collidablesLayer);

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
      
      // spawn passengers every 3 seconds
      if(GAME_CONFIG.AUTO_SPAWN) {
        this.time.addEvent({
          delay: 1000 / GAME_CONFIG.SPAWN_RATE,
          callback: () => {
            this.spawnPassenger(this.pathFinder);
          },
          callbackScope: this,
          loop: true
        });
      }

      EventBus.emit('current-scene-ready', this);
    }

    setupUI() {
      console.log('Game setupUI');

      this.spawnButton = this.add.text(0, 0, 'SPAWN', {
        fontSize: 18,
        color: '#000000'
      });
      this.spawnButton.setInteractive();
      this.spawnButton.on('pointerdown', () => {
        this.spawnPassenger(this.pathFinder);
      });

      this.spawnButtonDebug = this.add.text(0, 20, 'SPAWN DEBUG', {
        fontSize: 18,
        color: '#000000'
      });
      this.spawnButtonDebug.setInteractive();
      this.spawnButtonDebug.on('pointerdown', () => {
        this.spawnPassenger(this.pathFinder, true);
      });

      this.passengerListText = this.add.text(0, 40, `Passengers: ${0}`, {
        fontSize: 18,
        color: '#000000'
      });

      this.scoreText = this.add.text(300, 0, `Score: ${this.score}`, {
        fontSize: 18,
        color: '#000000'
      });

      this.uiContainer.add(this.spawnButton);
      this.uiContainer.add(this.spawnButtonDebug);
      this.uiContainer.add(this.passengerListText);
      this.uiContainer.add(this.scoreText);
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

    private renderPassengerList() {
      const passengerList = (this.passengers.getChildren() as Passenger[]).map((passenger, index) => {
        // check emoji or walking emoji
        const emoji = (passenger as Passenger).bag ? '💼' : '🚫';
        const impeded = (passenger as Passenger).impeded ? '🚫' : '';
        return `${index + 1}. ${passenger.name} ${passenger.currentTaskIndex} ${emoji} ${impeded} (${passenger.currentTask?.name}) ${(passenger as Passenger).currentStepInPath}`;
      }).join('\n');

      this.passengerListText.setText(`Passengers: ${this.passengers.getChildren().length}\n${passengerList}`);
    }

    private renderFocusedPassengerDetails() {
      if(this.focusPassengerDetails) {
        this.focusPassengerDetails.destroy();
      }

      if(this.focusPassenger) {
        this.focusPassengerDetails = this.add.text(SIZE.WIDTH - 500, 0, `
          Focused Passenger: ${this.focusPassenger.name}
          Impeded: ${this.focusPassenger.impeded}
          Current Step In Path: ${this.focusPassenger.currentStepInPath}
          `, {
          fontSize: 18,
          color: '#000000',
          align: 'right'
        });
      } else {
        this.focusPassengerDetails = this.add.text(SIZE.WIDTH - 500, 0, 'No passenger focused', {
          fontSize: 18,
          color: '#000000',
          align: 'right'
        });
      }

      this.uiContainer.add(this.focusPassengerDetails);
    }

    private renderScore() {
      this.scoreText.setText(`Score: ${this.score}`);
    }

    private updateScore() {
      this.score += 1;
    }

    update (time: number, delta: number)
    {
      this.renderPassengerList();
      this.renderFocusedPassengerDetails();

      this.renderScore()
    }
    
}
