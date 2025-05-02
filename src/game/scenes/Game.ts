import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { passengers, SIZE } from '../main';
import Passenger, { PassengerTask, PassengerTexture } from '../passenger/Passenger';
import { findDestinationsInLayer, PathFinder } from '../utils/tilemaps';
import { PASSENGER } from '../passenger/constants';
import getPassengerTasks, { TaskDestinationMap } from '../tasks/tasks';
import { GAME_CONFIG } from '../config';
import Bag from '../bag/Bag';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;

    map: Phaser.Tilemaps.Tilemap;
    collidablesLayer: Phaser.Tilemaps.TilemapLayer;

    gameText: Phaser.GameObjects.Text;
    passengers: Phaser.GameObjects.Group;
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
      super('Game');
    }

    create ()
    {
      this.camera = this.cameras.main;

      this.map = this.make.tilemap({ key: GAME_CONFIG.TILEMAP_KEY });

      const tileset = this.map.addTilesetImage(GAME_CONFIG.TILESET_KEY, GAME_CONFIG.TILESET_IMAGE_KEY); // name must match what's in Tiled
      const floorLayer = this.map.createLayer('floor', tileset!, 0, 0)!;
      floorLayer.name = 'floor';
      
      this.collidablesLayer = this.map.createLayer('collidables', tileset!, 0, 0)!;
      this.collidablesLayer.name = 'collidables';
      this.collidablesLayer.setCollisionByProperty({ collides: true });

      console.log({collidablesLayer: this.collidablesLayer})

      const debugGraphics = this.add.graphics().setAlpha(0.75);
      this.collidablesLayer.renderDebug(debugGraphics, {
        tileColor: null, // No color for non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255), // Red for collidable tiles
        faceColor: new Phaser.Display.Color(0, 255, 0, 255) // Green for collision face edges
      });


      this.destinations = findDestinationsInLayer(this.collidablesLayer);

      const pathFinder = new PathFinder(this.map, this.collidablesLayer);       

      this.passengers = this.add.group({
        classType: Passenger,
        maxSize: 100,
        runChildUpdate: true
      });

      this.spawnButton = this.add.text(0, 0, 'SPAWN', {
        fontSize: 18,
        color: '#000000'
      });
      this.spawnButton.setInteractive();
      this.spawnButton.on('pointerdown', () => {
        this.spawnPassenger(pathFinder);
      });

      this.spawnButtonDebug = this.add.text(0, 20, 'SPAWN DEBUG', {
        fontSize: 18,
        color: '#000000'
      });
      this.spawnButtonDebug.setInteractive();
      this.spawnButtonDebug.on('pointerdown', () => {
        this.spawnPassenger(pathFinder, true);
      });

      this.passengerListText = this.add.text(0, 40, `Passengers: ${this.passengers.getChildren().length}`, {
        fontSize: 18,
        color: '#000000'
      });

      this.score = 0;
      this.scoreText = this.add.text(300, 0, `Score: ${this.score}`, {
        fontSize: 18,
        color: '#000000'
      });
      
      // spawn passengers every 3 seconds
      if(GAME_CONFIG.AUTO_SPAWN) {
        this.time.addEvent({
          delay: 1000 / GAME_CONFIG.SPAWN_RATE,
          callback: () => {
            this.spawnPassenger(pathFinder);
          },
          callbackScope: this,
          loop: true
        });
      }

      EventBus.emit('current-scene-ready', this);
    }
      
    spawnPassenger (pathFinder: PathFinder, debug: boolean = false): Passenger
    {
      const passengerData = passengers[Math.floor(Math.random() * passengers.length)];
      
      const xPadding = passengerData.width / 2;
      const yPadding = passengerData.height / 2;
      
      const spawnX = xPadding;
      const spawnY = SIZE.HEIGHT - yPadding;

      const bag = new Bag(this, spawnX, spawnY, 'bag', {
        contents: {
          has_electronics: true,
          has_liquids: true,
          has_suspicious_item: true
        },
        onPerson: true
      });
      
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
