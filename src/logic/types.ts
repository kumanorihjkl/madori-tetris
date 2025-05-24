// ゲームの基本型定義

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type PieceType = 'LDK' | '寝室' | '浴室' | 'トイレ' | '廊下' | '収納' | '庭' | '駐車場';

export type PieceCategory = 'building' | 'outdoor';

export interface PieceDefinition {
  type: PieceType;
  category: PieceCategory;
  size: Size;
  rotatable: boolean;
  color: string;
  points: number;
  required?: {
    minLevel: number;
    count: number;
  };
}

export interface PieceInstance {
  id: string;
  type: PieceType;
  position: Position;
  size: Size;
  rotation: number; // 0, 90, 180, 270
  placed: boolean;
}

export interface GridCell {
  occupied: boolean;
  pieceId?: string;
  pieceType?: PieceType;
}

export type Grid = GridCell[][];

export interface GameState {
  grid: Grid;
  currentPiece: PieceInstance | null;
  nextPieces: PieceType[];
  holdPiece: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  linesCleared: number;
  gameOver: boolean;
  gameOverReason?: string;
  placedPieces: PieceInstance[];
  dropTimer: number;
  lastDropTime: number;
}

export interface GameStats {
  buildingCoverage: number; // 建蔽率
  placedRequiredPieces: {
    駐車場: number;
    庭: number;
  };
  hasLightingIssue: boolean; // 採光問題
  zoneComplete: boolean; // ゾーン完成
  slimCorridor: boolean; // スリム廊下
  landscapeBonus: boolean; // 景観ボーナス
}

export interface Controls {
  left: boolean;
  right: boolean;
  down: boolean;
  up: boolean;
  space: boolean;
  c: boolean;
}

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 16;
export const CELL_SIZE = 30; // Canvas上での1マスのピクセルサイズ
