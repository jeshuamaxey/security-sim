// GameHUD.ts
import Phaser, { Scene } from 'phaser';
import { GAME_CONFIG } from '../config';
export default class GameHUD {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private timeText: Phaser.GameObjects.Text;
  private passengerCountText: Phaser.GameObjects.Text;
  private playPauseButton: Phaser.GameObjects.Text;
  private exitButton: Phaser.GameObjects.Text;

  private debugElements: Phaser.GameObjects.Text[] = [];
  private spawnButton: Phaser.GameObjects.Text;
  private spawnButtonDebug: Phaser.GameObjects.Text;

  private isPaused = false;
  private debugVisible = false;

  constructor(scene: Scene, container: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.container = container;

    this.createLayout();
  }

  private createLayout() {
    const { width, height } = this.scene.scale;

    const headerBg = this.scene.add.rectangle(0, 0, width, GAME_CONFIG.STYLE.HEADER_HEIGHT, 0x333333)
      .setOrigin(0)
      .setScrollFactor(0);
    this.container.add(headerBg);

    this.playPauseButton = this.scene.add.text(10, 6, '⏸ Pause', { fontSize: '16px', color: '#ffffff' })
      .setInteractive()
      .on('pointerdown', () => {
        this.isPaused ? this.scene.events.emit('resume-game') : this.scene.events.emit('pause-game');
        this.isPaused = !this.isPaused;
        this.playPauseButton.setText(this.isPaused ? '▶ Play' : '⏸ Pause');
      });
    this.container.add(this.playPauseButton);

    this.timeText = this.scene.add.text(100, 6, 'Time: 0.0s', { fontSize: '16px', color: '#ffffff' });
    this.container.add(this.timeText);

    this.passengerCountText = this.scene.add.text(220, 6, 'Passengers: 0 / 0', { fontSize: '16px', color: '#ffffff' });
    this.container.add(this.passengerCountText);

    this.exitButton = this.scene.add.text(width - 70, 6, 'Exit ✖', { fontSize: '16px', color: '#ff5555' })
      .setInteractive()
      .on('pointerdown', () => this.scene.scene.start('MainMenu'));
    this.container.add(this.exitButton);

    this.debugVisible = location.hash === '#debug';

    // Example debug text
    if(this.debugVisible) {
      this.spawnButton = this.scene.add.text(this.scene.scale.width - 150, this.scene.scale.height - 50, 'SPAWN', {
        fontSize: 18,
        color: '#000000'
      });
      this.spawnButton.setInteractive();
      this.spawnButton.on('pointerdown', () => {
        this.scene.events.emit('spawn-passenger');
      });

      this.spawnButtonDebug = this.scene.add.text(this.scene.scale.width - 150, this.scene.scale.height - 30, 'SPAWN DEBUG', {
        fontSize: 18,
        color: '#000000'
      });
      this.spawnButtonDebug.setInteractive();
      this.spawnButtonDebug.on('pointerdown', () => {
        this.scene.events.emit('spawn-passenger-debug');
      });
      
      this.debugElements = [
        this.spawnButton,
        this.spawnButtonDebug
      ];

      this.debugElements.forEach(el => this.container.add(el));
    }
  }

  updateHUD(elapsedTime: number, processed: number, total: number) {
    this.timeText.setText(`Time: ${elapsedTime.toFixed(1)}s`);
    this.passengerCountText.setText(`Passengers: ${processed} / ${total}`);
  }

  destroy() {
    this.container.destroy();
  }
}
