import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { passengers, SIZE } from '../main';
import Passenger, { PassengerTexture } from '../passenger/Passenger';
import { PASSENGER } from '../passenger/constants';

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
        this.background = this.add.image(512, 384, 'background');

        this.passengers = this.add.group({
          classType: Phaser.GameObjects.Sprite,
          maxSize: 100,
          runChildUpdate: true
        });

        this.targetText = this.add.text(500, 400, 'TARGET');

        this.spawnButton = this.add.text(0, 0, 'SPAWN');
        this.spawnButton.setInteractive();
        this.spawnButton.on('pointerdown', () => {
          this.spawnPassenger();
        });

        // this.spawnPassenger();
        
        // spawn passengers every 3 seconds
        this.time.addEvent({
          delay: 1000,
          callback: () => {
            this.spawnPassenger();
          },
          callbackScope: this,
          // loop: true
        });

        EventBus.emit('current-scene-ready', this);
    }

    spawnPassenger (): Passenger
    {      
      const passengerData = passengers[Math.floor(Math.random() * passengers.length)];
      
      const xPadding = 32
      const yPadding = 32
      
      const spawnX = xPadding;
      const spawnY = SIZE.HEIGHT - yPadding;
      
      const newPassenger = new Passenger(this, spawnX, spawnY, passengerData.sprite, {
        name: passengerData.name as PassengerTexture,
        destination: this.targetText.getCenter()
      });

      // @ts-ignore
      this.physics.add.collider(newPassenger, this.passengers, (passenger: Passenger, other: Passenger) => {
        console.log('CALLBACK: Collided', passenger.name, other.name);
        passenger.onHit(other.body);
        other.onHit(passenger.body);
      });
      
      this.passengers.add(newPassenger);

      return newPassenger;
    }

    update (time: number, delta: number)
    {}
    
}
