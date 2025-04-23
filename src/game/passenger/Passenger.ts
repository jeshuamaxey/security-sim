import { PASSENGER } from "./constants";

import { spriteAnimations } from '../sprite-animations';

export type PassengerTexture = 'adam' | 'alex' | 'bob' | 'amelia';

type PassengerConfig = {
  name: PassengerTexture;
  destination?: Phaser.Types.Math.Vector2Like;
}

type Direction = 'left' | 'right' | 'up' | 'down' | 'none';

class Passenger extends Phaser.GameObjects.Sprite {
  private direction: Direction;
  private speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: PassengerConfig) {
    super(scene, x, y, texture);
    scene.add.existing(this);

    for(const animation in spriteAnimations) {
      this.anims.create(spriteAnimations[animation as keyof typeof spriteAnimations](scene, texture));
    }

    this.direction = 'none';
    this.name = config.name + Math.round(Math.random()*10000).toString();

    this.setScale(PASSENGER.SCALE);

    const delay = Math.random() * 1000;
    scene.time.delayedCall(delay, () => {
      this.play(`${config.name}-idle`);
    });
  }

  update(time: number, delta: number) {
    super.update(time, delta);
  }
}

export default Passenger;
