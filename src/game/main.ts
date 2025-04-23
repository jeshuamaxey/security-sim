import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

export const SIZE = {
  WIDTH: 1024,
  HEIGHT: 768,
}

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: SIZE.WIDTH,
  height: SIZE.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#028af8',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    MainGame,
    GameOver
  ]
};

export const passengers = [
  {
    name: 'adam',
    sprite: 'adam',
    width: 32,
    height: 32,
    scale: 2
  },
  {
    name: 'alex',
    sprite: 'alex',
    width: 32,
    height: 32,
    scale: 2
  },
  {
    name: 'bob',
    sprite: 'bob',
    width: 32,
    height: 32,
    scale: 2
  },
  {
    name: 'amelia',
    sprite: 'amelia',
    width: 32,
    height: 32,
    scale: 2
  }
]

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
}

export default StartGame;
