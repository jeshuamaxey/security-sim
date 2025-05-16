import { GameObjects } from 'phaser';
import LevelProgressStore from '../store/levelProgress';

import BaseScene from './BaseScene';

export class MainMenu extends BaseScene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super({ key: 'MainMenu' });
    }

    create() {
      const title = this.add.text(this.scale.width / 2, 100, 'SECURITY SIM', {
        fontSize: '48px',
        color: '#ffffff'
      }).setOrigin(0.5);
    
      const subtitle = this.add.text(this.scale.width / 2, 160, 'Airport Security Simulator', {
        fontSize: '18px',
        color: '#aaaaaa'
      }).setOrigin(0.5);
    
      const playButton = this.add.text(this.scale.width / 2, 250, '▶ Play', {
        fontSize: '32px',
        backgroundColor: '#00cc66',
        padding: { x: 16, y: 8 },
        color: '#ffffff'
      }).setOrigin(0.5).setInteractive();
    
      playButton.on('pointerdown', () => {
        this.scene.start('Game');
      });

      const levelSelectButton = this.add.text(this.scale.width / 2, 320, '🔍 Level Select', {
        fontSize: '16px',
        color: '#ffffff',
        padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setInteractive();

      levelSelectButton.on('pointerdown', () => {
        this.scene.start('LevelSelect');
      });

      const mapEditorButton = this.add.text(this.scale.width / 2, 380, '🔧 Map Editor', {
        fontSize: '16px',
        color: '#ffffff',
        padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setInteractive();

      mapEditorButton.on('pointerdown', () => {
        this.scene.start('MapEditor');
      });
    
      const resetButton = this.add.text(this.scale.width / 2, this.scale.height - 100, '🗑 Reset Progress', {
        fontSize: '16px',
        color: '#ff4444'
      }).setOrigin(0.5).setInteractive();
    
      resetButton.on('pointerdown', () => {
        LevelProgressStore.clear();
        alert('Progress reset!');
      });
    
      this.cameras.main.setBackgroundColor('#1e1e1e');
    }    
}
