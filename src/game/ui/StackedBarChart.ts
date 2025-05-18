const DEFAULT_COLORS = [
  0xaa0000,
  0xf5f542,
  0x00aa00,
  0xaaaa00,
  0x00aaaa,
  0xaa00aa
]

class StackedBarChart extends Phaser.GameObjects.Container {
  private colors: number[]

  private bg: Phaser.GameObjects.Rectangle
  private rects: Phaser.GameObjects.Rectangle[]

  public width: number
  
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, count: number, bg?: number, colors?: number[]) {
    super(scene, x, y);

    this.width = width
    
    this.bg = this.scene.add.rectangle(x, y, width, height, bg)
    this.bg
      .setOrigin(0, 0)
      .setScale(1, 1)
      .setScrollFactor(0);
    this.add(this.bg)
    
    this.colors = colors || DEFAULT_COLORS
    this.rects = []

    for(let i = 0; i < count; i++) {
      const r = this.scene.add.rectangle(x, y, width, height, this.colors[i])
      r.setOrigin(0, 0)
      r.setScale(0.01, 1)
      this.rects.push(r)
      this.add(r)
    }
  }

  update(progress: number[]) {
    // console.log("update stacked bar chart", progress)
    type Update = {
      xOffset: number,
      progress: number
    }

    const total = progress.reduce((acc, curr) => acc + curr, 0)
    const updates = progress.reduce((arr, curr, i) => {
      const progress = Math.max(0.01, curr / total)
      const xOffset = i === 0 ? 0 : arr[i-1].xOffset + arr[i-1].progress*this.width

      return [
        ...arr,
        {
          xOffset,
          progress
        }
      ]
    }, [] as Update[])

    this.rects.forEach((rect, i) => {
      rect.setScale(updates[i].progress, 1)
      rect.setX(updates[i].xOffset)

      // rect.setInteractive()
      // rect.on('pointerdown', () => {
      //   this.setY(this.y + 0.01)
      // })
    })
  }
}

export default StackedBarChart;