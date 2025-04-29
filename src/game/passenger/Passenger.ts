import { PASSENGER } from "./constants";

import { spriteAnimations } from '../sprite-animations';
import { IPoint } from "astar-typescript/dist/interfaces/astar.interfaces";
import { PathFinder } from "../utils/tilemaps";

export type PassengerTexture = 'adam' | 'alex' | 'bob' | 'amelia';

type Vector2Like = Phaser.Types.Math.Vector2Like

type PassengerDebugConfig = {
  showPath?: boolean;
  showPathTraced?: boolean;
  debugLog?: boolean;
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

  public pathFinder: PathFinder;
  public pathInTileCoords?: number[][];
  public pathInWorldCoords?: Vector2Like[];
  public movingToDestination: boolean;
  public atDestination: boolean;
  public currentStepInPath: number;
  private checkArrivedAtWaypoint: Phaser.Time.TimerEvent;

  public lastPassengerCollidedWith?: Passenger;
  private lastCollisionTimeout?: Phaser.Time.TimerEvent;

  public debug: PassengerDebugConfig;
  public debugGraphics: Phaser.GameObjects.Graphics;

  private markedForDestroy: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: PassengerConfig) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.world.enable(this);
    
    // PHYSICS
    // account for empty space at the top of sprite images
    this.body.setSize(16, 24);
    this.body.setOffset(0, 8);
    this.setOrigin(0.5, 0.8);

    // setup physics behaviour
    this.setPushable(false);
    this.setImmovable(true);
    this.body.setBounce(0);
    this.body.setCollideWorldBounds(true);
    
    this.body.debugBodyColor = 0x0000ff;
    
    // ANIMATIONS
    for(const animation in spriteAnimations) {
      this.anims.create(spriteAnimations[animation as keyof typeof spriteAnimations](scene, texture));
    }

    // CONFIG
    this.debug = config.debug || {
      showPath: false,
      showPathTraced: false,
      debugLog: false
    };
    this.debugGraphics = scene.add.graphics();
    this.speed = PASSENGER.SPEED;
    this.direction = 'none';
    this.name = config.name + Math.round(Math.random()*10000).toString();
    this.destination = config.destination;
    this.destinationRadius = 10;

    this.markedForDestroy = false;

    this.pathFinder = config.pathFinder;
    this.currentStepInPath = 0;
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

    this.lastCollisionTimeout = undefined;

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

    if(this.pathInWorldCoords && !this.atDestination && !this.movingToDestination && !this.impeded) {
      this.moveAlongPathWithPhysics(this.pathInWorldCoords, this.speed);
    }

    if(this.debug?.showPathTraced) {
      this.debugGraphics.fillStyle(0x0000ff, 1);
      this.debugGraphics.fillCircle(this.x, this.y, 4);
    }

    if(this.markedForDestroy) {
      this.destroy();
    }
  }

  destroy() {
    this.checkArrivedAtWaypoint.remove();

    super.destroy();
  }

  public markForDestroy() {
    this.markedForDestroy = true;
  }

  public get impeded() {
    // console.log('impeded getter called', this.name);
    if(!this.body || this.direction === 'none' || !this.lastPassengerCollidedWith || !this.lastPassengerCollidedWith.body) {
      return false;
    }

    let isBetween = false;
    if(this.direction === 'up') {
      isBetween = this.lastPassengerCollidedWith?.body.y < this.body.y;
    } else if(this.direction === 'down') {
      isBetween = this.lastPassengerCollidedWith?.body.y > this.body.y;
    } else if(this.direction === 'left') {
      isBetween = this.lastPassengerCollidedWith?.body.x < this.body.x;
    } else if(this.direction === 'right') {
      isBetween = this.lastPassengerCollidedWith?.body.x > this.body.x;
    }

    return isBetween;
  }

  onHitOtherPassenger(other: Passenger) {
    this.lastPassengerCollidedWith = other;

    if (this.lastCollisionTimeout) {
      this.lastCollisionTimeout.remove();
    }

    if(this.impeded) {
      this.pauseMovingAlongPath();

      // wait 1 second and try to move again
      this.scene.time.addEvent({
        delay: PASSENGER.WAIT_AFTER_COLLISION_MS,
        callback: () => {
          const distanceToOther = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
          if(this.pathInWorldCoords && distanceToOther > this.body.width) {
            this.lastPassengerCollidedWith = undefined;  // Clear the collision state
          }
        }
      });
    } else {
      this.lastCollisionTimeout = this.scene.time.addEvent({
        delay: 200, // ms, adjust as needed
        callback: () => {
          this.lastPassengerCollidedWith = undefined;
          this.lastCollisionTimeout = undefined;
        }
      });
    }
  }

  onHitBarrier(tile: Phaser.Tilemaps.Tile) {
    console.log('onHitBarrier()', tile);
    // identify the next tile in the direction of travel
    // this.stopWalking();
  }

  /**
   * Walk the passenger in the given direction
   * @param direction - The direction to walk
   */
  public startWalkingAnimation(direction: string) {
    if(direction !== 'none') {
      this.play(`${this.texture.key}-walk-${direction}`, true)
    }
  }

  /**
   * Stop the passenger from walking
   */
  public stopWalkingAnimation() {
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

  /**
   * Move the passenger along the path with physics
   * @param worldPath - The path to move the passenger along
   * @param speed - The speed of the passenger
   */
  moveAlongPathWithPhysics(worldPath: Vector2Like[], speed: number) {
    if(this.debug?.debugLog) {
      console.log('moveAlongPathWithPhysics()', this.currentStepInPath, this.name);
    }

    if (!worldPath.length) {
      console.warn('no path to move along');
      return;
    }

    let initialDistanceFromWaypoint = 0;
    
    const moveToNextTile = () => {
      if(this.debug?.debugLog) console.log('moveToNextTile', this.name, this.currentStepInPath, worldPath.length);

      if (this.impeded) {
        this.pauseMovingAlongPath();
        return;
      }

      // Safety check to prevent invalid step counts
      this.currentStepInPath = Math.min(this.currentStepInPath, worldPath.length);

      if (this.currentStepInPath >= worldPath.length) {
        if(this.debug?.debugLog) {
          console.log('arrivedAtDestination()', {
            currentStepInPath: this.currentStepInPath,
            worldPathLength: worldPath.length,
            name: this.name
          });
        }

        this.body.setVelocity(0);
        this.arrivedAtDestination();
        return;
      }

      this.movingToDestination = true;
  
      const target = worldPath[this.currentStepInPath];
      
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      
      const angle = Math.atan2(dy, dx);
      this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      
      initialDistanceFromWaypoint = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
      this.direction = this.updateDirectionToTarget({ x: this.x, y: this.y }, target, PASSENGER.WAYPOINT_TOLERANCE);
      this.startWalkingAnimation(this.direction);

      // Restore immediate distance check for initial position
      if(initialDistanceFromWaypoint < PASSENGER.WAYPOINT_TOLERANCE) {
        if(this.debug?.debugLog) {
          console.log('immediatelyArrivedAtWaypoint :: ', this.currentStepInPath, this.name);
        }

        this.currentStepInPath++;
        if (!this.impeded) {
          moveToNextTile();
          return;  // Important: return here to prevent setting up the timer
        }
      }

      // Wait until close enough to the target tile
      this.checkArrivedAtWaypoint = this.scene.time.addEvent({
        delay: 10,
        loop: true,
        callback: () => {
          if (this.impeded) {
            this.checkArrivedAtWaypoint.remove();
            this.pauseMovingAlongPath();
            return;
          }

          const currentDistanceToWaypoint = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

          if (currentDistanceToWaypoint < PASSENGER.WAYPOINT_TOLERANCE) {
            if(this.debug?.debugLog) {
              console.log('arrivedAtWaypoint :: ', this.currentStepInPath, this.name, this.impeded);
            }

            // Stop current movement
            this.body.setVelocity(0);
            this.checkArrivedAtWaypoint.remove();
            
            // Move to next waypoint
            this.currentStepInPath++;
            moveToNextTile();
          }
        }
      });
    };
  
    moveToNextTile();
  }

  pauseMovingAlongPath() {
    this.body.setVelocity(0);
    this.stopWalkingAnimation();
    if (this.checkArrivedAtWaypoint) {
      this.checkArrivedAtWaypoint.remove();
    }
    
    // Important: Set this to false so the update() method can trigger movement again
    this.movingToDestination = false;

    const checkImpediment = this.scene.time.addEvent({
      delay: 10,
      loop: true,
      callback: () => {
        if(!this.impeded && this.pathInWorldCoords) {
          // Don't start a new movement if we've somehow exceeded our path
          if (this.currentStepInPath >= this.pathInWorldCoords.length) {
            this.arrivedAtDestination();  // Call arrivedAtDestination instead of resetting
            checkImpediment.remove();
            return;
          }
          checkImpediment.remove();
          // The update() method will handle restarting movement
        }
      }
    });
  }

  /**
   * Stop the passenger from walking and reset the path
   */
  arrivedAtDestination() {
    console.log('arrivedAtDestination', this.name);
    this.stopWalkingAnimation();

    this.checkArrivedAtWaypoint.remove();

    this.movingToDestination = false;
    this.atDestination = true;
    this.pathInWorldCoords = undefined;
    this.pathInTileCoords = undefined;

    this.scene.time.delayedCall(5000, () => {
      this.markForDestroy();
    });
  }
}

export default Passenger;
