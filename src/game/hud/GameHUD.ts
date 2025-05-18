// GameHUD.ts
import Phaser, { Scene } from 'phaser';
import { GAME_CONFIG } from '../config';
import LevelProgressStore from '../store/levelProgress';
import StackedBarChart from '../ui/StackedBarChart';
import UIButton from '../ui/Button';
export default class GameHUD {
  private scene: Scene;
  private passengers: Phaser.GameObjects.Group;
  private container: Phaser.GameObjects.Container;
  private timeText: Phaser.GameObjects.Text;
  private levelNameText: Phaser.GameObjects.Text;
  private playPauseButton: Phaser.GameObjects.Text;
  private exitButton: Phaser.GameObjects.Text;

  private debugElements: Phaser.GameObjects.Text[] = [];
  private spawnButton: Phaser.GameObjects.Text;
  private spawnButtonDebug: Phaser.GameObjects.Text;

  private isPaused = false;
  private debugVisible = false;

  private stackedProgressBar: StackedBarChart;

  constructor(scene: Scene, container: Phaser.GameObjects.Container, passengers: Phaser.GameObjects.Group) {
    this.scene = scene;
    this.container = container;
    this.passengers = passengers;

    this.createLayout();
  }

  private createLayout() {
    const { width, height } = this.scene.scale;

    this.createHeader();
    this.createGameStatusColumn()

    // DEBUG ELEMENTS
    this.debugVisible = location.hash === '#debug';

    if(this.debugVisible) {
      this.createDebugElements();
    }
  }

  createHeader() {
    const level = LevelProgressStore.getNextIncompleteLevel()
    const { width } = this.scene.scale;

    const headerBg = this.scene.add.rectangle(0, 0, width, GAME_CONFIG.STYLE.HEADER_HEIGHT, 0x333333)
      .setOrigin(0)
      .setScrollFactor(0);
    this.container.add(headerBg);

    this.playPauseButton = new UIButton(this.scene, 10, 6, '⏸ Pause', {
      onClick: () => {
        this.isPaused ? this.scene.events.emit('resume-game') : this.scene.events.emit('pause-game');
        this.isPaused = !this.isPaused;
        this.playPauseButton.setText(this.isPaused ? '▶ Play' : '⏸ Pause');
      },
    }, {
      backgroundColor: undefined
    })
    this.container.add(this.playPauseButton);

    this.timeText = this.scene.add.text(100, 6, 'Time: 0.0s', { fontSize: '16px', color: '#ffffff' });
    this.container.add(this.timeText);

    this.levelNameText = this.scene.add.text(220, 6, level?.name || '', { fontSize: '16px', color: '#ffffff' });
    this.container.add(this.levelNameText);

    this.exitButton = new UIButton(this.scene, width - 70, 6, 'Exit ✖', {
      onClick: () => this.scene.scene.start('MainMenu')
    })
    this.container.add(this.exitButton);
  }

  createDebugElements() {
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

  createGameStatusColumn() {
    const statusColumnWidth = 250
    const statusColumnPadding = 12

    const { width, height } = this.scene.scale

    const x = width - statusColumnWidth
    const y = GAME_CONFIG.STYLE.HEADER_HEIGHT
    const statusColumnHeight = height - y

    const bg = this.scene.add.rectangle(x, y, statusColumnWidth, statusColumnHeight, 0xbbbbbb)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.container.add(bg);

    // progress bar shows the percentage of passengers processed
    const barX = x + statusColumnPadding
    const barY = y - statusColumnPadding
    const barWidth = statusColumnWidth - statusColumnPadding * 2
    const barHeight = 30

    this.stackedProgressBar = new StackedBarChart(
      this.scene,
      barX,
      barY,
      barWidth,
      barHeight,
      3,
      0xcccccc,
      [0x00aa00, 0xf5f542, 0xaa0000]);
    this.container.add(this.stackedProgressBar);
  }

  updateHUD(elapsedTime: number, processed: number, total: number) {
    const passengersInSystem = this.passengers.getLength()
    const passengersRemaining = total - processed - passengersInSystem
    this.timeText.setText(`Time: ${elapsedTime.toFixed(1)}s`);

    this.stackedProgressBar.update([
      processed,
      passengersInSystem,
      passengersRemaining,
    ])
  }

  destroy() {
    this.container.destroy();
  }
}
