import type { Grid, GridCell, PieceInstance, Position, Size } from './types';
import { GRID_WIDTH, GRID_HEIGHT } from './types';

// 空のグリッドを作成
export function createEmptyGrid(): Grid {
  return Array(GRID_HEIGHT).fill(null).map(() =>
    Array(GRID_WIDTH).fill(null).map((): GridCell => ({
      occupied: false,
    }))
  );
}

// ピースがグリッド内に収まるかチェック
export function isPositionValid(grid: Grid, piece: PieceInstance): boolean {
  const { position, size } = piece;
  
  // 境界チェック
  if (position.x < 0 || position.x + size.width > GRID_WIDTH) {
    return false;
  }
  if (position.y < 0 || position.y + size.height > GRID_HEIGHT) {
    return false;
  }
  
  // 衝突チェック
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const gridX = position.x + x;
      const gridY = position.y + y;
      
      if (grid[gridY][gridX].occupied) {
        return false;
      }
    }
  }
  
  return true;
}

// ピースをグリッドに配置
export function placePieceOnGrid(grid: Grid, piece: PieceInstance): Grid {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  for (let y = 0; y < piece.size.height; y++) {
    for (let x = 0; x < piece.size.width; x++) {
      const gridX = piece.position.x + x;
      const gridY = piece.position.y + y;
      
      if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
        newGrid[gridY][gridX] = {
          occupied: true,
          pieceId: piece.id,
          pieceType: piece.type,
        };
      }
    }
  }
  
  return newGrid;
}

// ピースをグリッドから削除
export function removePieceFromGrid(grid: Grid, pieceId: string): Grid {
  return grid.map(row =>
    row.map(cell =>
      cell.pieceId === pieceId
        ? { occupied: false }
        : cell
    )
  );
}

// ピースを移動
export function movePiece(piece: PieceInstance, direction: 'left' | 'right' | 'down'): PieceInstance {
  const delta = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
  }[direction];
  
  return {
    ...piece,
    position: {
      x: piece.position.x + delta.x,
      y: piece.position.y + delta.y,
    },
  };
}

// ハードドロップ位置を計算
export function calculateHardDropPosition(grid: Grid, piece: PieceInstance): Position {
  let testPiece = { ...piece };
  
  while (isPositionValid(grid, testPiece)) {
    testPiece = movePiece(testPiece, 'down');
  }
  
  // 1つ上の有効な位置に戻す
  return {
    x: testPiece.position.x,
    y: testPiece.position.y - 1,
  };
}

// 完成した行を検出（テトリス風のライン消去は今回は使わない）
export function findCompletedLines(grid: Grid): number[] {
  const completedLines: number[] = [];
  
  for (let y = 0; y < GRID_HEIGHT; y++) {
    if (grid[y].every(cell => cell.occupied)) {
      completedLines.push(y);
    }
  }
  
  return completedLines;
}

// 行を削除してグリッドを詰める
export function clearLines(grid: Grid, lines: number[]): Grid {
  if (lines.length === 0) return grid;
  
  const newGrid = createEmptyGrid();
  let newRowIndex = GRID_HEIGHT - 1;
  
  for (let oldRowIndex = GRID_HEIGHT - 1; oldRowIndex >= 0; oldRowIndex--) {
    if (!lines.includes(oldRowIndex)) {
      newGrid[newRowIndex] = [...grid[oldRowIndex]];
      newRowIndex--;
    }
  }
  
  return newGrid;
}

// 外周に接しているかチェック（採光チェック用）
export function isAdjacentToPerimeter(grid: Grid, pieceId: string): boolean {
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (grid[y][x].pieceId === pieceId) {
        // 外周チェック
        if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
          return true;
        }
      }
    }
  }
  return false;
}

// 隣接するピースを検出
export function getAdjacentPieces(grid: Grid, pieceId: string): Set<string> {
  const adjacentPieces = new Set<string>();
  const directions = [
    { x: 0, y: -1 }, // 上
    { x: 1, y: 0 },  // 右
    { x: 0, y: 1 },  // 下
    { x: -1, y: 0 }, // 左
  ];
  
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (grid[y][x].pieceId === pieceId) {
        // 隣接セルをチェック
        for (const dir of directions) {
          const adjX = x + dir.x;
          const adjY = y + dir.y;
          
          if (adjX >= 0 && adjX < GRID_WIDTH && adjY >= 0 && adjY < GRID_HEIGHT) {
            const adjCell = grid[adjY][adjX];
            if (adjCell.occupied && adjCell.pieceId && adjCell.pieceId !== pieceId) {
              adjacentPieces.add(adjCell.pieceId);
            }
          }
        }
      }
    }
  }
  
  return adjacentPieces;
}

// 連続する庭マスの数を計算（景観ボーナス用）
export function getConnectedGardenSize(grid: Grid): number {
  const visited = new Set<string>();
  let maxSize = 0;
  
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const key = `${x},${y}`;
      if (!visited.has(key) && grid[y][x].pieceType === '庭') {
        const size = floodFillGarden(grid, x, y, visited);
        maxSize = Math.max(maxSize, size);
      }
    }
  }
  
  return maxSize;
}

// 庭の連続領域をフラッドフィルで計算
function floodFillGarden(grid: Grid, startX: number, startY: number, visited: Set<string>): number {
  const stack = [{ x: startX, y: startY }];
  let size = 0;
  
  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;
    if (grid[y][x].pieceType !== '庭') continue;
    
    visited.add(key);
    size++;
    
    // 隣接セルを追加
    stack.push(
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    );
  }
  
  return size;
}
