import { COLORS } from "../colors"

type ButtonConfig = {
  onClick: () => void
  disabled?: boolean
}

const defaultStyle = {
  fontSize: '16px',
  color: '#ffffff',
  backgroundColor: undefined
}

const defaultHoverStyle = {
  backgroundColor: COLORS.lightGray
}

export default class UIButton extends Phaser.GameObjects.Text {
  disabled: boolean
  baseStyle: Partial<Phaser.Types.GameObjects.Text.TextStyle>
  hoverStyle: Partial<Phaser.Types.GameObjects.Text.TextStyle>

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    config: ButtonConfig,
    style?: Partial<Phaser.Types.GameObjects.Text.TextStyle>,
    hoverStyle?: Phaser.Types.GameObjects.Text.TextStyle) {

      super(scene, x, y, text, { ...defaultStyle, ...style })

      this.disabled = config.disabled || false
      if(!this.disabled) {
        this.setInteractive()
        this.on('pointerdown', config.onClick)
      }

      this.baseStyle = {
        ...defaultStyle,
        ...style
      }
      this.hoverStyle = {
        ...defaultHoverStyle,
        ...hoverStyle
      }

      // cursor on hover
      this
        .on('pointerover', () => {
          if(this.disabled) {
            this.scene.input.manager.canvas.style.cursor = 'not-allowed';
          }
          else {
            this.scene.input.manager.canvas.style.cursor = 'pointer';
            this.setStyle({ ...this.baseStyle, ...this.hoverStyle })
          }
        })
        .on('pointerout', () => {
          this.scene.input.manager.canvas.style.cursor = 'default';
          this.setStyle({ ...this.baseStyle, ...style })
        });
  }
}