import LEVELS, { LevelConfig } from '../levels';

export type LevelScore = {
  suspiciousItemsPassed: number;
  passengersProcessed: number;
  timeTaken: number; // in seconds
  completed: boolean;
  passed: boolean;
};

export type LevelProgressMap = {
  [levelId: string]: LevelScore;
};

class LevelProgressStore {
  private levels: LevelConfig[]
  private key = 'levelProgress';
  private progress: LevelProgressMap = {};

  constructor(levels: LevelConfig[]) {
    this.levels = levels
    this.load();
  }

  private load() {
    const stored = localStorage.getItem(this.key);
    if (stored) {
      this.progress = JSON.parse(stored);
    }
  }

  private save() {
    localStorage.setItem(this.key, JSON.stringify(this.progress));
  }

  markLevelComplete(levelId: string, score: LevelScore) {
    this.progress[levelId] = { ...score, completed: true };
    this.save();
  }

  isCompleted(levelId: string): boolean {
    return this.progress[levelId]?.completed ?? false;
  }

  isUnlocked(levelId: string): boolean {
    const index = this.levels.findIndex(level => level.id === levelId);
    if(index === 0) return true;

    const prevLevel = this.levels[index - 1]
    return this.isCompleted(prevLevel.id)
  }

  getScore(levelId: string): LevelScore | null {
    return this.progress[levelId] ?? null;
  }

  getAll(): LevelProgressMap {
    return this.progress;
  }

  clear() {
    this.progress = {};
    localStorage.removeItem(this.key);
  }

  getNextIncompleteLevel(): LevelConfig | null {
    return this.levels.find(level => !this.isCompleted(level.id)) ?? null;
  }
}

export default new LevelProgressStore(LEVELS);
