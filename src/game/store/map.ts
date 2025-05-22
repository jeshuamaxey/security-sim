export type StrippedTile = {
  index: number

  baseHeight: number
  baseWidth: number
  width: number
  height: number

  bottom: number
  right: number

  collideDown: boolean
  collideLeft: boolean
  collideRight: boolean
  collideUp: boolean

  faceBottom: boolean
  faceLeft: boolean
  faceRight: boolean
  faceTop: boolean

  pixelX: number
  pixelY: number
  properties: any
  rotation: number
  tint: number
  tintFill: boolean

  x: number
  y: number
}

// MapStore.ts
type SavedTileMapData = {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layerIndices: number[][];
  layer: StrippedTile[][]
};

class MapStore {
  private mapData: SavedTileMapData | null = null;

  save(data: SavedTileMapData) {
    this.mapData = data;
    localStorage.setItem('savedMap', JSON.stringify(data));
  }

  load(): SavedTileMapData | null {
    if (this.mapData) return this.mapData;

    const saved = localStorage.getItem('savedMap');
    if (saved) {
      this.mapData = JSON.parse(saved);
      return this.mapData;
    }

    return null;
  }

  clear() {
    this.mapData = null;
    localStorage.removeItem('savedMap');
  }
}

export default new MapStore(); // Singleton
