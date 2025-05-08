import { PASSENGER } from "./constants";

import { spriteAnimations } from '../sprite-animations';
import { PathFinder } from "../utils/tilemaps";
import { TaskDestination } from "../tasks/tasks";
import { GAME_CONFIG } from "../config";
import Bag from "../bag/Bag";
import { Game } from "../scenes/Game";

export type PassengerTexture = 'adam' | 'alex' | 'bob' | 'amelia';

type Vector2Like = Phaser.Types.Math.Vector2Like

type PassengerDebugConfig = {
  showPath?: boolean;
  showPathTraced?: boolean;
  debugLog?: boolean;
  showDestinations?: boolean;
}

type PassengerConfig = {
  name: PassengerTexture;
  pathFinder: PathFinder;
  bag?: Bag;
  debug?: PassengerDebugConfig;
  tasks: PassengerTask[];
  onArrivedAtAirside: () => void;
}

type Direction = 'left' | 'right' | 'up' | 'down' | 'none';

export type PassengerTask = {
  name: string;
  type: 'move' | 'action' | 'wait';
  inProgress: boolean;
  completed?: boolean;
} & ({
  type: 'move';
  destination: TaskDestination;
} | {
  type: 'action';
  update: (scene: Game, passenger: Passenger) => void;
  init: (scene: Game, passenger: Passenger) => void;
} | {
  type: 'wait';
  durationMs: number;
})
class Passenger extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction;
  private speed: number;
  public body: Phaser.Physics.Arcade.Body;

  public pathFinder: PathFinder;
  public pathInTileCoords?: number[][];
  public pathInWorldCoords?: Vector2Like[];
  public movingToDestination: boolean;
  public currentStepInPath: number;
  private checkArrivedAtWaypoint: Phaser.Time.TimerEvent;

  public lastPassengerCollidedWith?: Passenger;
  private lastCollisionTimeout?: Phaser.Time.TimerEvent;

  public bag?: Bag;

  public debug: PassengerDebugConfig;
  public debugGraphics: Phaser.GameObjects.Graphics;

  private markedForDestroy: boolean;
  private securityCompleteTimer?: Phaser.Time.TimerEvent;

  private tasks: PassengerTask[];
  private _currentTaskIndex: number;

  private onArrivedAtAirside: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: PassengerConfig) {
    super(scene, x, y, texture);

    this.setScale(GAME_CONFIG.SCALE);

    scene.add.existing(this);
    scene.physics.world.enable(this);
    
    // PHYSICS
    // account for empty space at the top of sprite images
    this.body.setSize(16, 24);
    this.body.setOffset(0, 8);
    this.setOrigin(PASSENGER.ORIGIN_X, PASSENGER.ORIGIN_Y);
    
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
    
    // DEBUG
    this.debug = config.debug || {
      showPath: false,
      showPathTraced: false,
      debugLog: false,
      showDestinations: false
    };
    this.debugGraphics = scene.add.graphics();

    // CONFIG
    if(config.bag) {
      this.bag = config.bag;
      this.bag.setDepth(this.depth + 1);
      this.bag.setPosition(this.x, this.y);
    }

    this.onArrivedAtAirside = config.onArrivedAtAirside;

    this.speed = PASSENGER.SPEED;
    this.direction = 'none';
    this.name = config.name + Math.round(Math.random()*10000).toString();
    
    this.markedForDestroy = false;
    
    this.pathFinder = config.pathFinder;
    this.currentStepInPath = 0;
    
    this.lastCollisionTimeout = undefined;
    
    this.tasks = [...config.tasks];
    this._currentTaskIndex = 0;
    
    
    if(config.debug?.showPath && this.pathInWorldCoords) {
      this.drawPath(this.pathInWorldCoords);
    }
    
  }
  
  update(time: number, delta: number) {
    super.update(time, delta);
    
    if(this.currentTask) {
      if(this.currentTask.type === 'move') {
        this.updateMoveTask();
      } else if(this.currentTask.type === 'action') {
        this.updateActionTask();
      } else if(this.currentTask.type === 'wait') {
        this.updateWaitTask();
      }
    } else if (!this.securityCompleteTimer && !this.markedForDestroy) {
      // Only create the timer once when we run out of tasks
      this.securityCompleteTimer = this.scene.time.addEvent({
        delay: 5000,
        callback: () => {
          this.onArrivedAtAirside();
          this.markForDestroy();
        }
      });
    }

    // if the passenger has a bag, move the bag with the passenger
    if(this.bag && this.bag.onPerson) {
      this.bag.setPosition(this.x, this.y);
    }

    if(this.debug?.showPathTraced) {
      this.debugGraphics.fillStyle(0x0000ff, 1);
      this.debugGraphics.fillCircle(this.x, this.y, 4);
    }

    if(this.debug?.showDestinations && this.currentTask && this.currentTask.type === 'move') {
      this.debugGraphics.fillStyle(0x00ff00, 1);
      this.debugGraphics.fillCircle(this.currentTask.destination.x, this.currentTask.destination.y, 4);
      this.scene.add.text(this.currentTask.destination.x, this.currentTask.destination.y, `D${this._currentTaskIndex + 1}`, {
        fontSize: 18,
        color: '#00ff00'
      });
    }

    if(this.markedForDestroy) {
      this.bag?.destroy();
      this.destroy();
    }
  }

  private drawPath(pathInWorldCoords: Vector2Like[]) {
    this.debugGraphics.lineStyle(2, 0x00ff00, 1);
      
      // Draw lines between waypoints
      for (let i = 0; i < pathInWorldCoords.length - 1; i++) {
        const start = pathInWorldCoords[i];
        const end = pathInWorldCoords[i + 1];
        this.debugGraphics.lineBetween(start.x, start.y, end.x, end.y);
      }
      
      // Draw circles at waypoints
      this.debugGraphics.fillStyle(0xff0000, 1);
      pathInWorldCoords.forEach((point, i) => {
        this.debugGraphics.fillCircle(point.x, point.y, 4);
        this.scene.add.text(point.x, point.y, i.toString(), {
          fontSize: 12,
          color: '#000000'
        });
      });

      this.tasks.forEach((task, index) => {
        if(task.type === 'move') {
          this.scene.add.text(task.destination.x, task.destination.y, `T${index + 1}`, {
            fontSize: 18,
            color: '#00ff00'
          });
        }
      })
  }

  public pLog(message: string, method: 'log' | 'warn' | 'error' | 'group' | 'groupEnd' = 'log') {
    if(this.debug?.debugLog) {
      console[method](`${this.name} :: ${message}`);
    }
  }

  public get currentTask(): PassengerTask | null {
    if(this._currentTaskIndex >= this.tasks.length) {
      return null;
    }

    return this.tasks[this._currentTaskIndex];
  }

  public get currentTaskIndex() {
    return this._currentTaskIndex;
  }

  private updateMoveTask() {
    if(!this.currentTask || this.currentTask.type !== 'move') {
      return;
    }
    if(!this.body) {
      console.warn('no body for passenger', this.name);
      return;
    }

    if(!this.currentTask.inProgress) {
      this.pLog(`beginning move task: "${this.currentTask.name}"`);
      this.pLog(`currentTask.destination: ${JSON.stringify(this.currentTask.destination, null, 2)}`, 'log');
      const safeX = Phaser.Math.Clamp(this.x, 0, this.pathFinder.tilemap.widthInPixels - 1);
      const safeY = Phaser.Math.Clamp(this.y, 0, this.pathFinder.tilemap.heightInPixels - 1);
      const startPosition = { x: safeX, y: safeY };
      const startTile = { x: this.pathFinder.tilemap.worldToTileX(startPosition.x), y: this.pathFinder.tilemap.worldToTileY(startPosition.y) };
      if(startTile.x === null || startTile.y === null) {
        throw new Error('Invalid start tile coordinates');
      }

      const start = {
        ...startPosition,
        tileX: startTile.x,
        tileY: startTile.y
      }

      // Use the actual task destination instead of hardcoded values
      const destination = this.currentTask.destination;
      const destinationTile = { 
        x: this.pathFinder.tilemap.worldToTileX(destination.x), 
        y: this.pathFinder.tilemap.worldToTileY(destination.y) 
      };
      if(destinationTile.x === null || destinationTile.y === null) {
        throw new Error('Invalid destination tile coordinates');
      }

      const end = {
        ...destination,
        tileX: destinationTile.x,
        tileY: destinationTile.y
      }

      this.pathInWorldCoords = this.pathFinder.findPathInWorldCoords(start, end);

      if(this.pathInWorldCoords.length === 0) {
        this.pLog(`no path found for move task: "${this.currentTask.name}"`, 'error');
        return;
      }

      if(this.debug.showPath) {
        this.drawPath(this.pathInWorldCoords);
      }

      this.currentTask.inProgress = true;
    }

    if(this.pathInWorldCoords?.length && !this.movingToDestination && !this.impeded) {
      this.pLog(`moving along path: "${this.currentTask.name}"`);
      this.moveAlongPathWithPhysics(this.pathInWorldCoords, this.speed);
    }
  }

  private updateActionTask() {
    if(!this.currentTask || this.currentTask.type !== 'action') {
      return;
    }

    if(!this.currentTask.inProgress) {
      this.pLog(`beginning action task: "${this.currentTask.name}"`);
      this.currentTask.init(this.scene as Game, this);
      this.currentTask.inProgress = true;
    } else {
      this.currentTask.update(this.scene as Game, this);
    }
  }

  private updateWaitTask() {
    if(!this.currentTask || this.currentTask.type !== 'wait') {
      return;
    }

    this.pLog(`waiting for ${this.currentTask.durationMs}ms (this is untested)`, 'log');

    this.scene.time.addEvent({
      delay: this.currentTask.durationMs,
      callback: () => {
        if(this.currentTask) {
          this.currentTask.completed = true;
        }
      }
    });
  }

  destroy() {
    if (this.checkArrivedAtWaypoint) {
      this.checkArrivedAtWaypoint.remove();
    }
    if (this.securityCompleteTimer) {
      this.securityCompleteTimer.remove();
    }

    super.destroy();
  }

  public markForDestroy() {
    this.markedForDestroy = true;
  }

  public get impeded() {
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
    this.pLog(`moveAlongPathWithPhysics()`, 'log');

    if (!worldPath.length) {
      console.warn('no path to move along');
      return;
    }

    let initialDistanceFromWaypoint = 0;
    
    const moveToNextTile = () => {
      if (this.impeded) {
        this.pauseMovingAlongPath();
        return;
      }

      // Safety check to prevent invalid step counts
      this.currentStepInPath = Math.min(this.currentStepInPath, worldPath.length);

      if (this.currentStepInPath >= worldPath.length) {
        this.pLog(`arrivedAtDestination()`, 'log');

        this.body.setVelocity(0);
        this.arrivedAtDestination();
        return;
      }

      this.movingToDestination = true;

      
      const target = worldPath[this.currentStepInPath];
      
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      
      const angle = Math.atan2(dy, dx);
      
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      this.body.setVelocity(vx, vy);
      
      initialDistanceFromWaypoint = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
      this.direction = this.updateDirectionToTarget({ x: this.x, y: this.y }, target, PASSENGER.WAYPOINT_TOLERANCE);
      this.startWalkingAnimation(this.direction);

      // Restore immediate distance check for initial position
      if(initialDistanceFromWaypoint < PASSENGER.WAYPOINT_TOLERANCE) {
        this.pLog(`immediatelyArrivedAtWaypoint for currentStepInPath: ${this.currentStepInPath}`, 'log');

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
            this.pLog(`arrivedAtWaypoint step ${this.currentStepInPath}`, 'log');

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
    this.stopWalkingAnimation();

    this.checkArrivedAtWaypoint.remove();

    this.movingToDestination = false;
    this.pathInWorldCoords = undefined;
    this.pathInTileCoords = undefined;
    this.currentStepInPath = 0;

    if(this.currentTask) {
      this.currentTask.inProgress = false;
      this.currentTask.completed = true;
    }

    this.moveToNextTask();
  }

 public moveToNextTask() {
    this.pLog('moveToNextTask()', 'log');
    this._currentTaskIndex++;
  }
}

export default Passenger;
