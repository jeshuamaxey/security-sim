type BagConfig = {
  contents: {
    has_electronics?: boolean;
    has_liquids?: boolean;
    has_suspicious_item?: boolean;
  }
}

class Bag extends Phaser.Physics.Arcade.Sprite {
  public sprite: Phaser.GameObjects.Sprite;
  public is_flagged: boolean; // Whether the bag has been flagged for inspection
  
  public contents: {
    has_electronics: boolean;
    has_liquids: boolean;
    has_suspicious_item: boolean;
  }
  
  public electronics_alert_dealt_with: boolean; // Whether the bag's electronics alert has been dealt with
  public liquids_alert_dealt_with: boolean; // Whether the bag's liquids alert has been dealt with
  public suspicious_item_dealt_with: boolean; // Whether the bag's suspicious item has been dealt with

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: BagConfig) {
    super(scene, x, y, texture);

    console.log('creating bag')

    // physics body
    scene.add.existing(this);
    scene.physics.world.enable(this);
    
    this.is_flagged = false;

    this.contents = {
      has_electronics: false,
      has_liquids: false,
      has_suspicious_item: false,

      ...config.contents
    };
    
    this.electronics_alert_dealt_with = false;
    this.liquids_alert_dealt_with = false;
    this.suspicious_item_dealt_with = false;
  }

  update(time: number, delta: number) {
    super.update(time, delta);
  }
}

export default Bag;