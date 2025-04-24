import { PASSENGER } from "./constants";

import { spriteAnimations } from '../sprite-animations';

export type PassengerTexture = 'adam' | 'alex' | 'bob' | 'amelia';

type Vector2Like = Phaser.Types.Math.Vector2Like

type PassengerConfig = {
  name: PassengerTexture;
  destination?: Vector2Like;
}

type Direction = 'left' | 'right' | 'up' | 'down' | 'none';

class Passenger extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction;
  private speed: number;
  private destination?: Vector2Like;
  private destinationRadius: number;
  public body: Phaser.Physics.Arcade.Body;
  public impeded: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: PassengerConfig) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    // PHYSICS
    this.setPushable(true);
    this.body.setBounce(1, 1);
    this.body.debugBodyColor = 0x0000ff;
    // const yOffset = 0
    // this.body.setOffset(100, 160);
    // this.body.setSize(this.width, this.height*0.5);

    // ANIMATIONS
    for(const animation in spriteAnimations) {
      this.anims.create(spriteAnimations[animation as keyof typeof spriteAnimations](scene, texture));
    }

    // CONFIG
    this.speed = PASSENGER.SPEED;
    this.direction = 'none';
    this.name = config.name + Math.round(Math.random()*10000).toString();
    this.destination = config.destination;
    this.destinationRadius = 10;

    this.setScale(PASSENGER.SCALE);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    if(this.destination) {
      
      const oldDirection = this.direction;
      this.direction = this.updateDirectionToTarget(this.getCenter(), this.destination, this.destinationRadius);
      
      if(this.direction !== 'none' && oldDirection !== this.direction) {
        this.walk(this.direction);
      }
      else if(this.direction === 'none' && this.body.velocity.length() > 0) {
        this.stopWalking()
      }
    }
  }

  onHit(body: Phaser.Physics.Arcade.Body) {
    // determine whether the body hit is between this and the destination
    let isBetween = false;
    if(this.direction === 'up') {
      isBetween = body.y < this.body.y;
    } else if(this.direction === 'down') {
      isBetween = body.y > this.body.y;
    } else if(this.direction === 'left') {
      isBetween = body.x < this.body.x;
    } else if(this.direction === 'right') {
      isBetween = body.x > this.body.x;
    }

    this.impeded = isBetween;
    if(this.impeded) {
      this.stopWalking();
    }
  }

  /**
   * Walk the passenger in the given direction
   * Controls x/y velocity and animation
   * @param direction - The direction to walk
   */
  public walk(direction: string) {
    if(direction !== 'none') {
      this.play(`${this.texture.key}-walk-${direction}`, true)
    }
    
    if(this.body) {
      console.log('walk()', direction);
      if(direction === 'left') {  
        this.body.setVelocityX(-this.speed);
        this.body.setVelocityY(0);

      } else if(direction === 'right') {
        this.body.setVelocityX(this.speed);
        this.body.setVelocityY(0);
      } else if(direction === 'up') {
        this.body.setVelocityY(-this.speed);
        this.body.setVelocityX(0);
      } else if(direction === 'down') {
        this.body.setVelocityX(0);
        this.body.setVelocityY(this.speed);
      }
    } else {
      console.log('No body');
    }
  }

  public stopWalking() {
    console.log("stopWalking()")
    const delay = Math.random() * 200;
    this.playAfterDelay(`${this.texture.key}-idle`, delay);
    this.body.setVelocityX(0);
    this.body.setVelocityY(0);
  }

  /**
   * Update the direction to the target
   * The passenger first walks in the x direction until it is aligned to the destination, then it walks in the y direction until it has arrived at the destination.
   * @param currentPosition - The current position of the passenger
   * @param target - The target position
   * @param tolerance - The tolerance for the distance to the target
   * @returns The direction to the target
   */
  updateDirectionToTarget(currentPosition: Vector2Like, target: Vector2Like, tolerance: number): Direction {
    const direction = {
      x: target.x - currentPosition.x,
      y: target.y - currentPosition.y
    };

    const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (distance < tolerance) {
      return 'none';
    }

    if (Math.abs(direction.x) > tolerance) {
      return direction.x > 0 ? 'right' : 'left';
    }

    return direction.y > 0 ? 'down' : 'up';
  }
}

export default Passenger;
