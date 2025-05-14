import { BAG } from "../passenger/constants";
import { Game } from "../scenes/Game";

type BagConfig = {
  onPerson?: boolean;
  onConveyor?: boolean;

  contents: {
    has_electronics?: boolean;
    has_liquids?: boolean;
    has_suspicious_item?: boolean;
  }
}

class Bag extends Phaser.Physics.Arcade.Sprite {
  public id: string;

  public currentTile: Phaser.Tilemaps.Tile;

  public onPerson: boolean;
  public onConveyor: boolean;
  public currentConveyorDirection: 'left' | 'right' | 'up' | 'down' | null;
  
  // scanner
  public inScanner: boolean;
  public scanInProgress: boolean;
  public scanComplete: boolean;
  public is_flagged: boolean; // Whether the bag has been flagged for inspection

  public onPickup: boolean;
  
  public contents: {
    has_electronics: boolean;
    has_liquids: boolean;
    has_suspicious_item: boolean;
  }
  
  public electronics_alert_dealt_with: boolean; // Whether the bag's electronics alert has been dealt with
  public liquids_alert_dealt_with: boolean; // Whether the bag's liquids alert has been dealt with
  public suspicious_item_dealt_with: boolean; // Whether the bag's suspicious item has been dealt with

  private game: Game;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: BagConfig) {
    super(scene, x, y, texture);

    this.id = `bag-${Math.random().toString(36).substring(2, 15)}`;
    this.game = scene as Game;

    // physics body
    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.inScanner = false;
    this.scanInProgress = false;
    this.scanComplete = false;

    this.currentConveyorDirection = null;

    if(config.onPerson) {
      this.onPerson = true;
      this.onConveyor = false;
    } else if(config.onConveyor) {
      this.onPerson = false;
      this.onConveyor = true;
    } else {
      this.onPerson = false;
      this.onConveyor = false;
    }
    
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

    if(!this.game.collidablesLayer) {
      console.warn('no collidables layer found for bag');
      this.setVelocity(0, 0);
      return;
    }

    this.currentTile = this.game.collidablesLayer.getTileAtWorldXY(this.x, this.y);

    if(!this.currentTile && !this.onPerson) {
      console.warn('no tile found for bag');
      this.setVelocity(0, 0);
      return;
    }

    this.onConveyor = this.currentTile?.properties.destinationKey === 'bag_conveyor';
    this.inScanner = this.currentTile?.properties.destinationKey === 'bag_scanner';
    this.onPickup = this.currentTile?.properties.destinationKey === 'bag_pickup';

    if(this.onConveyor) {
      if(this.changeCourse) {
        const direction = this.currentTile?.properties.direction;
        
        if(!direction) {
          console.warn('no direction found for bag');
          this.setVelocity(0, 0);
          return;
        }
        
        if(direction !== this.currentConveyorDirection) {
          this.propel(direction);
        }
      }
    }

    else if(this.inScanner) {
      if(!this.scanComplete && this.changeCourse) {
        this.setVelocity(0, 0);
      }

      if(!this.scanInProgress && !this.scanComplete) {
        this.scanInProgress = true;
        this.game.time.delayedCall(1000, () => {
          this.scanComplete = true;
          this.scanInProgress = false;

          this.exitScanner();
        });
      }
    }

    else if(this.onPickup) {
      if(this.changeCourse) {
        this.setVelocity(0, 0);
      }
    }
  }

  propel(direction: 'left' | 'right' | 'up' | 'down') {
    this.currentConveyorDirection = direction;

    if(direction === 'right') {
      this.setVelocity(BAG.CONVEYOR_SPEED, 0);
    } else if(direction === 'left') {
      this.setVelocity(-BAG.CONVEYOR_SPEED, 0);
    } else if(direction === 'up') {
      this.setVelocity(0, -BAG.CONVEYOR_SPEED);
    } else if(direction === 'down') {
      this.setVelocity(0, BAG.CONVEYOR_SPEED);
    }
  }

  exitScanner() {
    this.propel(this.currentTile.properties.direction);
  }

  /**
   * Returns true if the bag is at or past the centre line of the tile it is over
   * at which point the current conveyor direction is no longer valid and the bag should change course
   */
  get changeCourse() {
    const atOrPastTileCentreLineX = this.x >= this.currentTile.pixelX + (this.currentTile.width / 2);
    const atOrPastTileCentreLineY = this.y < this.currentTile.pixelY + (this.currentTile.height / 2);
    
    let changeCourse = false;

    if(this.currentConveyorDirection === 'right' && atOrPastTileCentreLineX) {
      changeCourse = true;
    } else if(this.currentConveyorDirection === 'left' && !atOrPastTileCentreLineX) {
      changeCourse = true;
    } else if(this.currentConveyorDirection === 'up' && atOrPastTileCentreLineY) {
      changeCourse = true;
    } else if(this.currentConveyorDirection === 'down' && !atOrPastTileCentreLineY) {
      changeCourse = true;
    } else if(this.currentConveyorDirection === null) {
      changeCourse = true;
    }

    return changeCourse;
  }
}

export default Bag;