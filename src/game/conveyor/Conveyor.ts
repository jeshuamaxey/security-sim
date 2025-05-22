// conveyor/Conveyor.ts
import Phaser from 'phaser';
import { Pausable } from '../interfaces/Pausable';
import { conveyorAnimations } from './animations';
import Bag from '../bag/Bag';

type Direction = 'up' | 'down' | 'left' | 'right';

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];
const ROTATIONS = {
  up: 3 * Math.PI / 2,
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
}

const CONVEYOR_SPEED = 10;

const rotateDirection = (direction: Direction, rotation: number = 0) => {
  const index = DIRECTIONS.indexOf(direction);
  const nextIndex = (index + Math.round(rotation/(Math.PI/2))) % DIRECTIONS.length;
  return DIRECTIONS[nextIndex];
}

const getBagDirection = (bag: Bag) => {
  return bag.body && (
      bag.body.velocity.x > 0 ? 'right'
      : bag.body.velocity.x < 0 ? 'left'
      : bag.body.velocity.y > 0 ? 'down'
      : 'up'
    );
}

export default class Conveyor extends Phaser.GameObjects.Sprite implements Pausable {
  direction: Direction;
  turn: 'left' | 'right' | undefined;
  speed: number = CONVEYOR_SPEED;
  
  public paused: boolean = false;
  public editable: boolean = false;

  private _didLog: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: Direction,
    turn: 'left' | 'right' | undefined = undefined,
    rotation: number = 0,
    editable: boolean = true
  ) {
    super(scene, x, y, 'conveyor');

    const finalDirection = rotateDirection(direction, rotation); // trust the logic
    this.setDirection(finalDirection);
    this.turn = turn;
    this.editable = editable;
    this.setRotation(rotation);

    for(const animation in conveyorAnimations) {
      // check whether scene has anim already
      if(!scene.anims.exists(animation)) {
        conveyorAnimations[animation as keyof typeof conveyorAnimations](scene);
      }
    }

    // Add to scene and play animation
    scene.add.existing(this);
    const animation = this.turn ? `conveyor-turn-${this.turn}` : `conveyor-straight`;

    this.play(animation);
    this.setOrigin(0.5);
    this.setDepth(1); // Renders above tilemap

    this.setInteractive();
    if(this.editable) {
      this.on('pointerdown', () => {
        const index = DIRECTIONS.indexOf(this.direction);
        const nextDirection = DIRECTIONS[(index + 1) % DIRECTIONS.length];
        console.log('switch to:', index, nextDirection);
        this.setDirection(nextDirection);
      });
    }

    this.on('pointerdown', () => {
      console.log({
        direction: this.direction,
        rotation: this.rotation,
        turn: this.turn
      })
    });
  }

  setDirection(direction: Direction) {
    this.direction = direction;
    this.rotation = ROTATIONS[direction];
  }

  getDirection(): Direction {
    return this.direction;
  }

  shouldPropel(bag: Bag): boolean {
    const bagCenter = bag.getCenter();
    const conveyorCenter = this.getCenter();
  
    const offset = 2; // small buffer to ensure it triggers once

    const bagCurrentDirection = getBagDirection(bag);

    const diff = {
      x: Math.abs(bagCenter.x - conveyorCenter.x),
      y: Math.abs(bagCenter.y - conveyorCenter.y)
    }

    switch (bagCurrentDirection) {
      case 'right':
      case 'left':
        return diff.x <= offset;
  
      case 'up':
      case 'down':
        return diff.y <= offset;
  
      default:
        return false;
    }
  }

  public pause() {
    this.paused = true;
    this.anims.pause();
  }

  public resume() {
    this.paused = false;
    this.anims.resume();
  }
}
