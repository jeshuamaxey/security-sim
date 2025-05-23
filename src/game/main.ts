import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { PASSENGER } from './passenger/constants';
import { GAME_CONFIG } from './config';
import { MapEditor } from './scenes/MapEditor';
import { LevelSelect } from './scenes/LevelSelect';

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
  scale: {
    parent: 'game-container',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1
  },
  backgroundColor: GAME_CONFIG.STYLE.BACKGROUND_COLOR,
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
    GameOver,
    MapEditor,
    LevelSelect
  ]
};

const basePassenger = {
  width: PASSENGER.WIDTH,
  height: PASSENGER.HEIGHT,
  offsetX: 0,
  offsetY: 0,
  scale: GAME_CONFIG.SCALE
}

export const passengers = [
  {
    name: 'adam',
    sprite: 'adam',
    ...basePassenger
  },
  {
    name: 'alex',
    sprite: 'alex',
    ...basePassenger
  },
  {
    name: 'bob',
    sprite: 'bob',
    ...basePassenger
  },
  {
    name: 'amelia',
    sprite: 'amelia',
    ...basePassenger
  }
]

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
}

export default StartGame;
