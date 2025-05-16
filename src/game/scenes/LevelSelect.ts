// LevelSelect.ts
import Phaser from 'phaser';
import LEVELS from '../levels';
import LevelProgressStore from '../store/levelProgress';

export class LevelSelect extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelect' });
  }

  create() {
    const { width } = this.scale;

    this.add.text(width / 2, 40, 'Select a Level', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const startY = 100;
    const padding = 40;

    LEVELS.forEach((level, index) => {
      const completed = LevelProgressStore.isCompleted(level.id);
      const label = `${level.name} ${completed ? '✅' : ''}`;

      const levelButton = this.add.text(width / 2, startY + index * padding, label, {
        fontSize: '20px',
        color: completed ? '#00cc66' : '#ffffff',
        backgroundColor: '#444444',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setInteractive();

      levelButton.on('pointerdown', () => {
        this.scene.start('Game', { levelId: level.id });
      });
    });

    const backBtn = this.add.text(width / 2, startY + LEVELS.length * padding + 30, '↩ Back to Menu', {
      fontSize: '18px',
      color: '#cccccc'
    }).setOrigin(0.5).setInteractive();

    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }
}