export const spriteAnimations = {
  idle: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-idle`,
    frames: scene.anims.generateFrameNumbers(name, { start: 0, end: 3 }),
    frameRate: 1,
    repeat: -1
  }),

  // WALK
  walkRight: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-walk-right`,
    frames: scene.anims.generateFrameNumbers(name, { start: 48, end: 53 }),
    frameRate: 4,
    repeat: -1
  }),
  walkUp: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-walk-up`,
    frames: scene.anims.generateFrameNumbers(name, { start: 54, end: 59 }),
    frameRate: 4,
    repeat: -1
  }),
  walkLeft: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-walk-left`,
    frames: scene.anims.generateFrameNumbers(name, { start: 60, end: 65 }),
    frameRate: 4,
    repeat: -1
  }),
  walkDown: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-walk-down`,
    frames: scene.anims.generateFrameNumbers(name, { start: 66, end: 71 }),
    frameRate: 4,
    repeat: -1
  }),

  // RUN
  runRight: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-run-right`,
    frames: scene.anims.generateFrameNumbers(name, { start: 48, end: 53 }),
    frameRate: 10,
    repeat: -1
  }),
  runUp: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-run-up`,
    frames: scene.anims.generateFrameNumbers(name, { start: 54, end: 59 }),
    frameRate: 10,
    repeat: -1
  }),
  runLeft: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-run-left`,
    frames: scene.anims.generateFrameNumbers(name, { start: 60, end: 65 }),
    frameRate: 10,
    repeat: -1
  }),
  runDown: (scene: Phaser.Scene, name: string) => ({
    key: `${name}-run-down`,
    frames: scene.anims.generateFrameNumbers(name, { start: 66, end: 71 }),
    frameRate: 10,
    repeat: -1
  })
}