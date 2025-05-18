class ProgressBar extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number) {
    super(scene, x, y, width, height, color);

    this
      .setOrigin(0, 0)
      .setScale(0.01, 1)
      .setScrollFactor(0);
  }

  update(progress: number) {
    const pMin = Math.min(0.01, progress)
    const pMax = Math.max(pMin, 1)
    this.setScale(pMax, 1);
  }
}

export default ProgressBar;