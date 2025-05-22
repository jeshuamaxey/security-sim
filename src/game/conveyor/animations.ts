export const conveyorAnimations = {
  straight: (scene: Phaser.Scene) => {
    if(scene.anims.exists(`conveyor-straight`)) {
      return scene.anims.get(`conveyor-straight`);
    }

    return scene.anims.create({
      key: `conveyor-straight`,
      frames: scene.anims.generateFrameNumbers('conveyor', { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1,
    });
  },
  turnRight: (scene: Phaser.Scene) => {
    if(scene.anims.exists(`conveyor-turn-right`)) {
      return scene.anims.get(`conveyor-turn-right`);
    }

    return scene.anims.create({
      key: `conveyor-turn-right`,
      frames: scene.anims.generateFrameNumbers('conveyor', { start: 4, end: 7 }),
      frameRate: 12,
      repeat: -1,
    });
  },
  turnLeft: (scene: Phaser.Scene) => {
    if(scene.anims.exists(`conveyor-turn-left`)) {
      return scene.anims.get(`conveyor-turn-left`);
    }

    return scene.anims.create({
      key: `conveyor-turn-left`,
      frames: scene.anims.generateFrameNumbers('conveyor', { start: 8, end: 11 }),
      frameRate: 12,
      repeat: -1,
    });
  },
};