import type { PieceDefinition, PieceType, PieceInstance, Position, Size } from './types';

// ピースの定義
export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  'LDK': {
    type: 'LDK',
    category: 'building',
    size: { width: 5, height: 4 },
    rotatable: true,
    color: '#2563eb', // 青
    points: 200, // 5×4×10
  },
  '寝室': {
    type: '寝室',
    category: 'building',
    size: { width: 4, height: 3 },
    rotatable: true,
    color: '#7c3aed', // 紫
    points: 120, // 4×3×10
  },
  '浴室': {
    type: '浴室',
    category: 'building',
    size: { width: 2, height: 2 },
    rotatable: false,
    color: '#0891b2', // シアン
    points: 40, // 2×2×10
  },
  'トイレ': {
    type: 'トイレ',
    category: 'building',
    size: { width: 2, height: 1 },
    rotatable: true,
    color: '#059669', // 緑
    points: 20, // 2×1×10
  },
  '廊下': {
    type: '廊下',
    category: 'building',
    size: { width: 1, height: 4 },
    rotatable: true,
    color: '#d97706', // オレンジ
    points: 40, // 1×4×10
  },
  '収納': {
    type: '収納',
    category: 'building',
    size: { width: 2, height: 1 },
    rotatable: true,
    color: '#dc2626', // 赤
    points: 20, // 2×1×10
  },
  '庭': {
    type: '庭',
    category: 'outdoor',
    size: { width: 2, height: 2 },
    rotatable: false,
    color: '#65a30d', // ライトグリーン
    points: 20, // 2×2×5
    required: {
      minLevel: 7,
      count: 1,
    },
  },
  '駐車場': {
    type: '駐車場',
    category: 'outdoor',
    size: { width: 3, height: 2 },
    rotatable: true,
    color: '#6b7280', // グレー
    points: 30, // 3×2×5
    required: {
      minLevel: 4,
      count: 1,
    },
  },
};

// ピースの回転
export function rotatePiece(piece: PieceInstance): PieceInstance {
  const definition = PIECE_DEFINITIONS[piece.type];
  if (!definition.rotatable) {
    return piece;
  }

  const newRotation = (piece.rotation + 90) % 360;
  const newSize = newRotation % 180 === 0 
    ? { width: definition.size.width, height: definition.size.height }
    : { width: definition.size.height, height: definition.size.width };

  return {
    ...piece,
    rotation: newRotation,
    size: newSize,
  };
}

// 新しいピースインスタンスを作成
export function createPieceInstance(type: PieceType, position: Position): PieceInstance {
  const definition = PIECE_DEFINITIONS[type];
  return {
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    position,
    size: { ...definition.size },
    rotation: 0,
    placed: false,
  };
}

// ピースの初期スポーン位置を計算
export function getSpawnPosition(type: PieceType): Position {
  const definition = PIECE_DEFINITIONS[type];
  return {
    x: Math.floor((10 - definition.size.width) / 2), // 中央に配置
    y: 0,
  };
}

// ランダムなピースタイプを生成（レベルに応じた制約あり）
export function generateRandomPieceType(level: number, placedCounts: Record<PieceType, number>): PieceType {
  const availableTypes: PieceType[] = [];
  
  // 基本ピース（常に利用可能）
  availableTypes.push('LDK', '寝室', '浴室', 'トイレ', '廊下', '収納');
  
  // レベルに応じて追加
  if (level >= 4) {
    availableTypes.push('駐車場');
  }
  if (level >= 7) {
    availableTypes.push('庭');
  }
  
  // 必須ピースの制約をチェック
  const filteredTypes = availableTypes.filter(type => {
    const definition = PIECE_DEFINITIONS[type];
    if (definition.required) {
      const currentCount = placedCounts[type] || 0;
      return currentCount < definition.required.count;
    }
    return true;
  });
  
  // フィルタ後に何も残らない場合は基本ピースから選択
  const finalTypes = filteredTypes.length > 0 ? filteredTypes : ['LDK', '寝室', '浴室', 'トイレ', '廊下', '収納'];
  
  return finalTypes[Math.floor(Math.random() * finalTypes.length)];
}

// ピースの7-bag システム（テトリス風）
export class PieceBag {
  private bag: PieceType[] = [];
  private level: number = 1;
  private placedCounts: Record<PieceType, number> = {
    'LDK': 0, '寝室': 0, '浴室': 0, 'トイレ': 0, '廊下': 0, '収納': 0, '庭': 0, '駐車場': 0
  };

  updateLevel(newLevel: number): void {
    this.level = newLevel;
  }

  updatePlacedCount(type: PieceType): void {
    this.placedCounts[type]++;
  }

  getNext(): PieceType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    const piece = this.bag.pop();
    if (!piece) {
      // フォールバックとして基本ピースを返す
      const fallbackPiece: PieceType = 'LDK';
      return fallbackPiece;
    }
    return piece;
  }

  private refillBag(): void {
    // 基本ピースを2個ずつ
    const basicPieces: PieceType[] = ['LDK', '寝室', '浴室', 'トイレ', '廊下', '収納'];
    this.bag = [...basicPieces, ...basicPieces];
    
    // レベルに応じて追加ピース
    if (this.level >= 4) {
      this.bag.push('駐車場');
    }
    if (this.level >= 7) {
      this.bag.push('庭');
    }
    
    // シャッフル
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }
}
