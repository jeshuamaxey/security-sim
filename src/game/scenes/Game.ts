import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { passengers, SIZE } from '../main';
import Passenger, { PassengerTexture } from '../passenger/Passenger';
import { PathFinder } from '../utils/tilemaps';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    targetText: Phaser.GameObjects.Text;
    passengers: Phaser.GameObjects.Group;
    spawnButton: Phaser.GameObjects.Text;

    constructor ()
    {
      super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        // this.background = this.add.image(512, 384, 'background');

        const map = this.make.tilemap({ key: 'airport' });

        const tileset = map.addTilesetImage('airport', 'airport'); // name must match what's in Tiled
        const floorLayer = map.createLayer('floor', tileset!, 0, 0)!;
        floorLayer.name = 'floor';
        const barriersLayer = map.createLayer('barriers', tileset!, 0, 0)!;
        barriersLayer.name = 'barriers';

        const pathFinder = new PathFinder(map, barriersLayer);

        barriersLayer.setCollisionByProperty({ collides: true });

        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // barriersLayer.renderDebug(debugGraphics, {
        //   tileColor: null,
        //   collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255),
        // });

        this.passengers = this.add.group({
          classType: Phaser.GameObjects.Sprite,
          maxSize: 100,
          runChildUpdate: true
        });

        this.targetText = this.add.text(500, 400, 'TARGET');

        this.spawnButton = this.add.text(0, 0, 'SPAWN');
        this.spawnButton.setInteractive();
        this.spawnButton.on('pointerdown', () => {
          this.spawnPassenger(pathFinder);
        });

        this.spawnPassenger(pathFinder);
        
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
      
      spawnPassenger (pathFinder: PathFinder): Passenger
      {      
        const passengerData = passengers[Math.floor(Math.random() * passengers.length)];
        
        const xPadding = passengerData.width / 2;
        const yPadding = passengerData.height / 2;
        
        const spawnX = xPadding;
        const spawnY = SIZE.HEIGHT - yPadding;
        
        const newPassenger = new Passenger(this, spawnX, spawnY, passengerData.sprite, {
          name: passengerData.name as PassengerTexture,
          destination: this.targetText.getCenter(),
          pathFinder: pathFinder
        });
  
        // @ts-ignore
        this.physics.add.collider(newPassenger, this.passengers, (passenger: Passenger, other: Passenger) => {
          console.log('CALLBACK: Collided with passenger', passenger.name, other.name);
          passenger.onHitOtherPassenger(other.body);
          other.onHitOtherPassenger(passenger.body);
        });
  
        // const barriers = this.children.getByName('barriers');
        // if(barriers) {
        //   console.log('barriers', barriers);
        //   // @ts-ignore
        //   this.physics.add.collider(newPassenger, barriers, (passenger: Passenger, tile: Phaser.Tilemaps.Tile) => {
        //     // console.log('CALLBACK: Collided with barrier', passenger.name, tile);
        //     // passenger.onHitBarrier(tile);
        //   });
        // }
        
        this.passengers.add(newPassenger);
  
        return newPassenger;
      }

    update (time: number, delta: number)
    {}
    
}
