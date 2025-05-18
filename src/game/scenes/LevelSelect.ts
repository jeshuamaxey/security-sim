// LevelSelect.ts
import Phaser from 'phaser';
import LEVELS from '../levels';
import LevelProgressStore from '../store/levelProgress';
import UIButton from '../ui/Button';

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
      const unlocked = LevelProgressStore.isUnlocked(level.id)
      const emoji = completed ? '✅' : unlocked ? '🔓' : '🔒'
      const label = `${level.name} ${emoji}`;

      const levelButton = new UIButton(this, width / 2, startY + index * padding, label, {
        onClick: () => this.scene.start('Game', { levelId: level.id}),
        disabled: !unlocked
      }, {
        fontSize: '20px',
        color: completed ? '#00cc66' : '#ffffff',
        backgroundColor: '#444444',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5)

      this.add.existing(levelButton)
    });

    const backBtn = new UIButton(this, width / 2, startY + LEVELS.length * padding + 30, '↩ Back to Menu', {
      onClick: () => this.scene.start('MainMenu')
    }, {
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5);

    this.add.existing(backBtn);
  }
}