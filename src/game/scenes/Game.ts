import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { passengers, SIZE } from '../main';
import Passenger, { PassengerTexture } from '../passenger/Passenger';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    targetText: Phaser.GameObjects.Text;
    passengers: Phaser.GameObjects.Group;
    
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

        this.spawnPassenger();
        
        // spawn passengers every 3 seconds
        this.time.addEvent({
          delay: 3000,
          callback: () => {
            this.spawnPassenger();
          },
          callbackScope: this,
          loop: true
        });

        EventBus.emit('current-scene-ready', this);
    }

    spawnPassenger ()
    {
      const index = this.passengers.getLength();
      
      const passengerData = passengers[Math.floor(Math.random() * passengers.length)];
      
      const xPadding = 32
      const yPadding = 32
      const passengersPerRow = (SIZE.WIDTH - (2 * xPadding)) / passengerData.width;
      
      const x = xPadding + (index%passengersPerRow * passengerData.width);
      const y = (SIZE.HEIGHT - (yPadding + (Math.floor(index/passengersPerRow) * passengerData.height)));
      
      const passenger = new Passenger(this, x, y, passengerData.sprite, {
        name: passengerData.name as PassengerTexture,
        destination: this.targetText.getCenter()
      });
      
      this.passengers.add(passenger);
    }

    // getDirectionToTarget(currentPosition: Phaser.Math.Vector2, target: Phaser.Math.Vector2, tolerance: number = 10): 'left' | 'right' | 'up' | 'down' | 'none'
    // {
    //   const direction = {
    //     x: target.x - currentPosition.x,
    //     y: target.y - currentPosition.y
    //   };

    //   const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    //   if (distance < tolerance) {
    //     return 'none';
    //   }

    //   if (Math.abs(direction.x) > Math.abs(direction.y)) {
    //     return direction.x > 0 ? 'right' : 'left';
    //   }

    //   return direction.y > 0 ? 'down' : 'up';
    // }

    // walk(passenger: Phaser.GameObjects.Sprite, direction: string)
    // {
    //   passenger.play(`${passenger.data.get('name')}-walk-${direction}`, true);
    //   if(passenger.body) {
    //     console.log('Setting velocity', direction);
    //     (passenger.body as Phaser.Physics.Arcade.Body).setVelocityX(PASSENGER.SPEED);
    //   }
    // }

    update (time: number, delta: number)
    {



      // this.passengers.getChildren().forEach(passenger => {
      //   const destination = passenger.data.get('destination');
      //   const direction = this.getDirectionToTarget(passenger.getCenter(), destination);
      //   // console.log('Direction', direction);
      //   if (direction === 'none') {
      //     passenger.play(`${passenger.data.get('name')}-idle`, true);
      //   } else {
      //     this.walk(passenger, direction);
      //   }
      // });
    }
}
