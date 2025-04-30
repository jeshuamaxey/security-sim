import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { passengers, SIZE } from '../main';
import Passenger, { PassengerTask, PassengerTexture } from '../passenger/Passenger';
import { PathFinder } from '../utils/tilemaps';
import { PASSENGER } from '../passenger/constants';

type Job = {
  type: 'move';
  destination: {x: number, y: number};
}

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

    passengerTasks: PassengerTask[];

    constructor ()
    {
      super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;

        const map = this.make.tilemap({ key: 'airport' });

        const tileset = map.addTilesetImage('airport', 'airport'); // name must match what's in Tiled
        const floorLayer = map.createLayer('floor', tileset!, 0, 0)!;
        floorLayer.name = 'floor';
        const barriersLayer = map.createLayer('barriers', tileset!, 0, 0)!;
        barriersLayer.name = 'barriers';

        const pathFinder = new PathFinder(map, barriersLayer);

        barriersLayer.setCollisionByProperty({ collides: true });

        this.passengers = this.add.group({
          classType: Passenger,
          maxSize: 100,
          runChildUpdate: true
        });

        const targets = [
          {x: 500, y: 400},
          {x: 300, y: 100},
        ];

        targets.forEach((target, index) => {
          this.add.text(target.x, target.y, `TARGET ${index + 1}`, {
            fontSize: 18,
            color: '#000000'
          });
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

        this.passengerListText = this.add.text(0, 40, 'Passengers:', {
          fontSize: 18,
          color: '#000000'
        });

        this.passengerTasks = [
          {
            type: 'move',
            destination: targets[0],
            name: 'move 1',
            inProgress: false
          },
          {
            type: 'move',
            destination: targets[1],
            name: 'move 2',
            inProgress: false
          }
        ];

        // this.spawnPassenger(pathFinder, true);
        
        // spawn passengers every 3 seconds
        // this.time.addEvent({
        //   delay: 1000,
        //   callback: () => {
        //     this.spawnPassenger(pathFinder);
        //   },
        //   callbackScope: this,
        //   // loop: true
        // });

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
          tasks: this.passengerTasks,
          pathFinder: pathFinder,
          debug: debug ? {
            showPath: true,
            showPathTraced: true,
            debugLog: true
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
          // newPassenger.markForDestroy();
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
        return `${index + 1}. ${passenger.name} ${passenger.currentTaskIndex} ${impeded} ${(passenger as Passenger).currentStepInPath}`;
      }).join('\n');
      this.passengerListText.setText(`Passengers:\n${passengerList}`);

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
