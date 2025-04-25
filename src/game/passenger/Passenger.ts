import { PASSENGER } from "./constants";

import { spriteAnimations } from '../sprite-animations';
import { IPoint } from "astar-typescript/dist/interfaces/astar.interfaces";
import { PathFinder } from "../utils/tilemaps";

export type PassengerTexture = 'adam' | 'alex' | 'bob' | 'amelia';

type Vector2Like = Phaser.Types.Math.Vector2Like

type PassengerDebugConfig = {
  showPath?: boolean;
  showPathTraced?: boolean;
}

type PassengerConfig = {
  name: PassengerTexture;
  destination?: Vector2Like;
  pathFinder: PathFinder;
  debug?: PassengerDebugConfig;
}

type Direction = 'left' | 'right' | 'up' | 'down' | 'none';

class Passenger extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction;
  private speed: number;
  private destination?: Vector2Like;
  private destinationRadius: number;
  public body: Phaser.Physics.Arcade.Body;
  public impeded: boolean;
  public pathFinder: PathFinder;
  public pathInTileCoords?: number[][];
  public pathInWorldCoords?: Vector2Like[];
  public movingToDestination: boolean;
  public atDestination: boolean;
  public debug?: PassengerDebugConfig;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: PassengerConfig) {
    super(scene, x, y, texture);

    // account for empty space at the top of sprite images
    this.setOrigin(0.5, 0.8);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    // PHYSICS
    this.setPushable(true);
    this.body.setBounce(0);
    this.body.debugBodyColor = 0x0000ff;
    this.body.setCollideWorldBounds(true);

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

    this.pathFinder = config.pathFinder;
    this.pathInTileCoords = this.pathFinder.findPath(this.getCenter(), this.destination as IPoint);
    this.pathInWorldCoords = this.pathInTileCoords.map(([x, y]) => {
      const xWorld = this.pathFinder.tilemap.tileToWorldX(x);
      const yWorld = this.pathFinder.tilemap.tileToWorldY(y);
      
      if(xWorld === null || yWorld === null) {
        throw new Error('Invalid tile coordinates');
      }

      return {
        x: xWorld + this.pathFinder.tilemap.tileWidth / 2, 
        y: yWorld + this.pathFinder.tilemap.tileHeight / 2
      };
    });

    // Draw the path
    const graphics = scene.add.graphics();

    if(config.debug?.showPath) {
      graphics.lineStyle(2, 0x00ff00, 1);
      
    // Draw lines between waypoints
    for (let i = 0; i < this.pathInWorldCoords.length - 1; i++) {
      const start = this.pathInWorldCoords[i];
      const end = this.pathInWorldCoords[i + 1];
      graphics.lineBetween(start.x, start.y, end.x, end.y);
    }
    
    // Draw circles at waypoints
      graphics.fillStyle(0xff0000, 1);
      this.pathInWorldCoords.forEach((point, i) => {
        graphics.fillCircle(point.x, point.y, 4);
        scene.add.text(point.x, point.y, i.toString(), {
          fontSize: 12,
          color: '#000000'
        });
      });
    }

    this.setScale(PASSENGER.SCALE);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    if(this.pathInWorldCoords && !this.atDestination && !this.movingToDestination) {
      this.moveAlongPathWithPhysics(this.pathInWorldCoords, this.speed);
    }

    if(this.debug?.showPathTraced) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x0000ff, 1);
      graphics.fillCircle(this.x, this.y, 4);
    }
  }

  onHitOtherPassenger(body: Phaser.Physics.Arcade.Body) {
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

  onHitBarrier(tile: Phaser.Tilemaps.Tile) {
    console.log('onHitBarrier()', tile);
    // identify the next tile in the direction of travel
    // this.stopWalking();
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

  moveAlongPathWithPhysics(worldPath: Vector2Like[], speed: number) {
    if (!worldPath.length) return;

    let currentStep = 0;
    let initialDistanceFromWaypoint = 0;
    
    const moveToNextTile = () => {
      if (currentStep >= worldPath.length) {
        this.body.setVelocity(0);
        // this.movingToDestination = false;
        // this.atDestination = true;
        return;
      }

      this.movingToDestination = true;
  
      const target = worldPath[currentStep];
      
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      
      const angle = Math.atan2(dy, dx);
      this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      
      initialDistanceFromWaypoint = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
      console.log('moveToNextTile()', {currentStep, cur: { x: this.x, y: this.y }, target, initialDistanceFromWaypoint});

      if(initialDistanceFromWaypoint < 4) {
        console.log('waypoint reached immediately', initialDistanceFromWaypoint, currentStep, worldPath.length);
        currentStep++;
        return moveToNextTile();
      }

      console.log('waiting for waypoint', initialDistanceFromWaypoint, currentStep);
  
      // Wait until close enough to the target tile
      const checkArrival = this.scene.time.addEvent({
        delay: 10,
        loop: true,
        callback: () => {
          const currentDistanceToWaypoint = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
          // console.log({initialDistanceFromWaypoint, dist: currentDistanceToWaypoint});
          if (currentDistanceToWaypoint < this.displayWidth/2) {
            console.log('waypoint reached()', currentDistanceToWaypoint, currentStep, worldPath.length);
            // Stop current movement
            this.body.setVelocity(0);
            checkArrival.remove();
            
            // Reset state
            // this.movingToDestination = false;
            
            // Move to next waypoint
            currentStep++;
            moveToNextTile();
          }
        }
      });
    };
  
    moveToNextTile();
  }
}

export default Passenger;
