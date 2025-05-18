import { GameObjects } from 'phaser';
import LevelProgressStore from '../store/levelProgress';

import BaseScene from './BaseScene';
import UIButton from '../ui/Button';

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
      this.setupUI()

      const title = this.add.text(this.scale.width / 2, 100, 'SECURITY SIM', {
        fontSize: '48px',
        color: '#ffffff'
      }).setOrigin(0.5);
    
      const subtitle = this.add.text(this.scale.width / 2, 160, 'Airport Security Simulator', {
        fontSize: '18px',
        color: '#aaaaaa'
      }).setOrigin(0.5);
    
      const playButton = new UIButton(this, this.scale.width / 2, 250, '▶ Play', {
        onClick: () => this.scene.start('Game')
      }, {
        fontSize: '32px',
        backgroundColor: '#00cc66',
        padding: { x: 16, y: 8 },
        color: '#ffffff'
      }).setOrigin(0.5)

      this.add.existing(playButton)

      const levelSelectButton = new UIButton(this, this.scale.width / 2, 320, '🔍 Level Select', {
        onClick: () => this.scene.start('LevelSelect')
      }, {
        fontSize: '16px',
        color: '#ffffff',
        padding: { x: 16, y: 8 }
      }).setOrigin(0.5)

      this.add.existing(levelSelectButton)


      const mapEditorButton = new UIButton(this, this.scale.width / 2, 380, '🔧 Map Editor', {
        onClick: () => this.scene.start('MapEditor')
      }, {
        fontSize: '16px',
        color: '#ffffff',
        padding: { x: 16, y: 8 }
      }).setOrigin(0.5)
      
      this.add.existing(mapEditorButton)
    
      const resetButton = new UIButton(this, this.scale.width / 2, this.scale.height - 100, '🗑 Reset Progress', {
        onClick: () => LevelProgressStore.clear()
      }, {
        fontSize: '16px',
        color: '#ff4444'
      }).setOrigin(0.5)

      this.add.existing(resetButton)
    
      this.cameras.main.setBackgroundColor('#1e1e1e');
    }    
}
