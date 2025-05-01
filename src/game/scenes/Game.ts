import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { passengers, SIZE } from '../main';
import Passenger, { PassengerTask, PassengerTexture } from '../passenger/Passenger';
import { findDestinationsInLayer, PathFinder } from '../utils/tilemaps';
import { PASSENGER } from '../passenger/constants';
import getPassengerTasks, { TaskDestinationMap } from '../passenger/tasks';
import { GAME_CONFIG } from '../config';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    passengers: Phaser.GameObjects.Group;
    spawnButton: Phaser.GameObjects.Text;
    spawnButtonDebug: Phaser.GameObjects.Text;
    passengerListText: Phaser.GameObjects.Text;
    focusPassengerDetails: Phaser.GameObjects.Text;

    focusPassenger: Passenger | null;

    destinations: TaskDestinationMap;
    passengerTasks: PassengerTask[];

    constructor ()
    {
      super('Game');
    }

    create ()
    {
      this.camera = this.cameras.main;

      const map = this.make.tilemap({ key: GAME_CONFIG.TILEMAP_KEY });

      const tileset = map.addTilesetImage(GAME_CONFIG.TILESET_KEY, GAME_CONFIG.TILESET_IMAGE_KEY); // name must match what's in Tiled
      const floorLayer = map.createLayer('floor', tileset!, 0, 0)!;
      floorLayer.name = 'floor';
      
      const collidablesLayer = map.createLayer('collidables', tileset!, 0, 0)!;
      collidablesLayer.name = 'collidables';
      collidablesLayer.setCollisionByProperty({ collides: true });

      console.log({collidablesLayer})

      this.destinations = findDestinationsInLayer(collidablesLayer);

      const pathFinder = new PathFinder(map, collidablesLayer);

      const debugPath = pathFinder.findPathInTileCoords(this.destinations.bag_dropoff, this.destinations.body_scanner);
      console.log({
        bagDropoff: this.destinations.bag_dropoff,
        bodyScanner: this.destinations.body_scanner,
        debugPath
      })        

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

      // this.spawnPassenger(pathFinder, true);
      
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
      
      const newPassenger = new Passenger(this, spawnX, spawnY, passengerData.sprite, {
        name: passengerData.name as PassengerTexture,
        tasks: getPassengerTasks(this.destinations),
        pathFinder: pathFinder,
        debug: debug ? {
          showPath: true,
          showPathTraced: true,
          debugLog: true,
          showDestinations: true
        } : undefined
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

    update (time: number, delta: number)
    {
      const passengerList = (this.passengers.getChildren() as Passenger[]).map((passenger, index) => {
        // check emoji or walking emoji
        // const emoji = (passenger as Passenger).atDestination ? '✅' : '🚶‍♂️';
        const impeded = (passenger as Passenger).impeded ? '🚫' : '';
        return `${index + 1}. ${passenger.name} ${passenger.currentTaskIndex} ${impeded} (${passenger.body.x.toFixed(0)}, ${passenger.body.y.toFixed(0)}) ${(passenger as Passenger).currentStepInPath}`;
      }).join('\n');
      this.passengerListText.setText(`Passengers: ${this.passengers.getChildren().length}\n${passengerList}`);

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
    
}
