import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        console.warn('jmping straight into game for dev');
        this.scene.start('Game');
        return;

        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo').setDepth(100);

        this.title = this.add.text(512, 460, 'Play', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Make the text interactive
        this.title.setInteractive({ cursor: 'pointer' });
        
        // Add hover effect
        this.title.on('pointerover', () => {
            this.title.setStyle({ color: '#eeeeee' });
        });
        
        this.title.on('pointerout', () => {
            this.title.setStyle({ color: '#ffffff' });
        });
        
        // Add click handler to start the Game scene
        this.title.on('pointerdown', () => {
            this.scene.start('Game');
        });

        EventBus.emit('current-scene-ready', this);
    }
}
