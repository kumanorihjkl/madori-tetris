import type { Grid, PieceInstance, GameStats, PieceType } from './types';
import { GRID_WIDTH, GRID_HEIGHT } from './types';
import { PIECE_DEFINITIONS } from './pieces';
import { isAdjacentToPerimeter, getAdjacentPieces, getConnectedGardenSize } from './grid';

// 建蔽率を計算
export function calculateBuildingCoverage(grid: Grid): number {
  let buildingCells = 0;
  let totalCells = GRID_WIDTH * GRID_HEIGHT;
  
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const cell = grid[y][x];
      if (cell.occupied && cell.pieceType) {
        const definition = PIECE_DEFINITIONS[cell.pieceType];
        if (definition.category === 'building') {
          buildingCells++;
        }
      }
    }
  }
  
  return buildingCells / totalCells;
}

// 採光問題をチェック
export function checkLightingIssue(grid: Grid, placedPieces: PieceInstance[]): boolean {
  const livingRoomPieces = placedPieces.filter(p => p.type === 'LDK' || p.type === '寝室');
  
  for (const piece of livingRoomPieces) {
    if (!isAdjacentToPerimeter(grid, piece.id)) {
      return true; // 採光問題あり
    }
  }
  
  return false; // 採光問題なし
}

// ゾーン完成をチェック（LDK・寝室・浴室・トイレが互いに隣接し閉ループ）
export function checkZoneComplete(grid: Grid, placedPieces: PieceInstance[]): boolean {
  const requiredTypes: PieceType[] = ['LDK', '寝室', '浴室', 'トイレ'];
  const requiredPieces = placedPieces.filter(p => requiredTypes.includes(p.type));
  
  // 4種類すべてが配置されているかチェック
  const placedTypes = new Set(requiredPieces.map(p => p.type));
  if (placedTypes.size !== 4) {
    return false;
  }
  
  // 各ピースが他の必要なピースと隣接しているかチェック
  const adjacencyMap = new Map<string, Set<string>>();
  
  for (const piece of requiredPieces) {
    const adjacentPieces = getAdjacentPieces(grid, piece.id);
    const adjacentRequiredTypes = new Set<string>();
    
    for (const adjPieceId of adjacentPieces) {
      const adjPiece = requiredPieces.find(p => p.id === adjPieceId);
      if (adjPiece) {
        adjacentRequiredTypes.add(adjPiece.type);
      }
    }
    
    adjacencyMap.set(piece.type, adjacentRequiredTypes);
  }
  
  // 閉ループをチェック（各ピースが少なくとも2つの他のピースと隣接）
  for (const [type, adjacentTypes] of adjacencyMap) {
    if (adjacentTypes.size < 2) {
      return false;
    }
  }
  
  // グラフの連結性をチェック
  return isConnectedGraph(adjacencyMap);
}

// グラフが連結しているかチェック
function isConnectedGraph(adjacencyMap: Map<string, Set<string>>): boolean {
  const nodes = Array.from(adjacencyMap.keys());
  if (nodes.length === 0) return false;
  
  const visited = new Set<string>();
  const stack = [nodes[0]];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    
    visited.add(current);
    const neighbors = adjacencyMap.get(current) || new Set();
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }
  
  return visited.size === nodes.length;
}

// スリム廊下をチェック
export function checkSlimCorridor(placedPieces: PieceInstance[]): boolean {
  const corridorPieces = placedPieces.filter(p => p.type === '廊下');
  const totalCorridorCells = corridorPieces.reduce((sum, piece) => {
    return sum + (piece.size.width * piece.size.height);
  }, 0);
  
  return totalCorridorCells <= 8;
}

// 景観ボーナスをチェック
export function checkLandscapeBonus(grid: Grid): boolean {
  const maxGardenSize = getConnectedGardenSize(grid);
  return maxGardenSize >= 4;
}

// 必須ピースの配置数をカウント
export function countRequiredPieces(placedPieces: PieceInstance[]): { 駐車場: number; 庭: number } {
  return {
    駐車場: placedPieces.filter(p => p.type === '駐車場').length,
    庭: placedPieces.filter(p => p.type === '庭').length,
  };
}

// ゲーム統計を計算
export function calculateGameStats(grid: Grid, placedPieces: PieceInstance[]): GameStats {
  return {
    buildingCoverage: calculateBuildingCoverage(grid),
    placedRequiredPieces: countRequiredPieces(placedPieces),
    hasLightingIssue: checkLightingIssue(grid, placedPieces),
    zoneComplete: checkZoneComplete(grid, placedPieces),
    slimCorridor: checkSlimCorridor(placedPieces),
    landscapeBonus: checkLandscapeBonus(grid),
  };
}

// ピース配置時のスコアを計算
export function calculatePieceScore(piece: PieceInstance): number {
  const definition = PIECE_DEFINITIONS[piece.type];
  return definition.points;
}

// ボーナススコアを計算
export function calculateBonusScore(stats: GameStats): number {
  let bonus = 0;
  
  if (stats.zoneComplete) {
    bonus += 1000;
  }
  
  if (stats.slimCorridor) {
    bonus += 500;
  }
  
  if (stats.landscapeBonus) {
    bonus += 300;
  }
  
  return bonus;
}

// ゲーム終了条件をチェック
export function checkGameOverConditions(
  grid: Grid, 
  placedPieces: PieceInstance[], 
  newPieceCanSpawn: boolean
): { isGameOver: boolean; reason?: string } {
  // 1. 衝突死
  if (!newPieceCanSpawn) {
    return { isGameOver: true, reason: '新しいピースを配置できません' };
  }
  
  // 2. 建蔽率オーバー
  const buildingCoverage = calculateBuildingCoverage(grid);
  if (buildingCoverage > 0.80) {
    return { isGameOver: true, reason: '建蔽率が80%を超えました' };
  }
  
  // 3. 採光ゼロ居室
  if (checkLightingIssue(grid, placedPieces)) {
    return { isGameOver: true, reason: 'LDKまたは寝室に採光がありません' };
  }
  
  return { isGameOver: false };
}

// レベルアップ条件をチェック
export function shouldLevelUp(piecesPlaced: number, currentLevel: number): boolean {
  // 10個ピース配置ごとにレベルアップ
  const requiredPieces = currentLevel * 10;
  return piecesPlaced >= requiredPieces;
}

// 行消去時のスコアを計算
export function calculateLineClearScore(linesCleared: number, level: number): number {
  const baseScores = {
    1: 100,   // シングル
    2: 300,   // ダブル
    3: 500,   // トリプル
    4: 800,   // テトリス
  };
  
  const baseScore = baseScores[linesCleared as keyof typeof baseScores] || 0;
  return baseScore * level;
}

// レベルに応じた落下速度を取得（ミリ秒）
export function getDropSpeed(level: number): number {
  if (level <= 3) {
    return 1000; // 低速
  } else if (level <= 6) {
    return 600;  // 中速
  } else {
    return 300;  // 高速
  }
}
