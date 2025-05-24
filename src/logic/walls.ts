import type { Grid, PieceType } from './types';
import { GRID_WIDTH, GRID_HEIGHT } from './types';

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'horizontal' | 'vertical';
}

export interface Opening {
  x: number;
  y: number;
  size: number;
  type: 'horizontal' | 'vertical';
  openingType: 'door' | 'window' | 'entrance';
}

/**
 * 開口部が必要かどうかを判定する
 */
function shouldCreateOpening(pieceType1: PieceType, pieceType2: PieceType): boolean {
  // 廊下と他の部屋の境界には必ず開口部を作る
  if (pieceType1 === '廊下' || pieceType2 === '廊下') {
    return true;
  }
  
  // LDKと居住空間の境界には開口部を作る
  if ((pieceType1 === 'LDK' && ['寝室', '収納'].includes(pieceType2)) ||
      (pieceType2 === 'LDK' && ['寝室', '収納'].includes(pieceType1))) {
    return true;
  }
  
  // 浴室とトイレの境界には開口部を作らない（プライバシー重視）
  if ((pieceType1 === '浴室' && pieceType2 === 'トイレ') ||
      (pieceType1 === 'トイレ' && pieceType2 === '浴室')) {
    return false;
  }
  
  // その他の隣接する居住空間には開口部を作る
  const livingSpaces = ['LDK', '寝室', '収納'];
  if (livingSpaces.includes(pieceType1) && livingSpaces.includes(pieceType2)) {
    return true;
  }
  
  return false;
}

/**
 * 壁に開口部を作る
 */
function createOpeningsInWall(wall: Wall, pieceType1: PieceType, pieceType2: PieceType): Wall[] {
  if (!shouldCreateOpening(pieceType1, pieceType2)) {
    return [wall];
  }
  
  const wallLength = wall.type === 'horizontal' ? 
    Math.abs(wall.x2 - wall.x1) : 
    Math.abs(wall.y2 - wall.y1);
  
  // 壁が短すぎる場合は開口部を作らない
  if (wallLength < 2) {
    return [wall];
  }
  
  // 開口部のサイズ（1セル分）
  const openingSize = 1;
  const openingPosition = Math.floor(wallLength / 2);
  
  const walls: Wall[] = [];
  
  if (wall.type === 'horizontal') {
    // 開口部の前の壁
    if (openingPosition > 0) {
      walls.push({
        x1: wall.x1,
        y1: wall.y1,
        x2: wall.x1 + openingPosition,
        y2: wall.y2,
        type: 'horizontal'
      });
    }
    
    // 開口部の後の壁
    if (openingPosition + openingSize < wallLength) {
      walls.push({
        x1: wall.x1 + openingPosition + openingSize,
        y1: wall.y1,
        x2: wall.x2,
        y2: wall.y2,
        type: 'horizontal'
      });
    }
  } else {
    // 開口部の前の壁
    if (openingPosition > 0) {
      walls.push({
        x1: wall.x1,
        y1: wall.y1,
        x2: wall.x2,
        y2: wall.y1 + openingPosition,
        type: 'vertical'
      });
    }
    
    // 開口部の後の壁
    if (openingPosition + openingSize < wallLength) {
      walls.push({
        x1: wall.x1,
        y1: wall.y1 + openingPosition + openingSize,
        x2: wall.x2,
        y2: wall.y2,
        type: 'vertical'
      });
    }
  }
  
  return walls;
}

/**
 * 開口部の情報を取得する
 */
export function detectOpenings(grid: Grid): Opening[] {
  const openings: Opening[] = [];

  // 垂直方向の開口部を検出（左右の境界）
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH - 1; x++) {
      const leftCell = grid[y][x];
      const rightCell = grid[y][x + 1];

      // 両方のセルが占有されており、異なる部屋タイプの場合
      if (leftCell.occupied && rightCell.occupied && 
          leftCell.pieceType && rightCell.pieceType &&
          leftCell.pieceType !== rightCell.pieceType) {
        
        if (shouldCreateOpening(leftCell.pieceType, rightCell.pieceType)) {
          // 連続する垂直境界を検出して結合
          let wallStart = y;
          let wallEnd = y;
          
          // 下方向に同じ境界が続くかチェック
          while (wallEnd + 1 < GRID_HEIGHT) {
            const nextLeftCell = grid[wallEnd + 1][x];
            const nextRightCell = grid[wallEnd + 1][x + 1];
            
            if (nextLeftCell.occupied && nextRightCell.occupied &&
                nextLeftCell.pieceType && nextRightCell.pieceType &&
                nextLeftCell.pieceType === leftCell.pieceType &&
                nextRightCell.pieceType === rightCell.pieceType) {
              wallEnd++;
            } else {
              break;
            }
          }
          
          const wallLength = wallEnd - wallStart + 1;
          if (wallLength >= 2) {
            const openingSize = 1;
            const openingPosition = Math.floor(wallLength / 2);
            
            openings.push({
              x: x + 1,
              y: wallStart + openingPosition,
              size: openingSize,
              type: 'vertical',
              openingType: 'door'
            });
          }
          
          // 処理済みの範囲をスキップ
          y = wallEnd;
        }
      }
    }
  }

  // 水平方向の開口部を検出（上下の境界）
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT - 1; y++) {
      const topCell = grid[y][x];
      const bottomCell = grid[y + 1][x];

      // 両方のセルが占有されており、異なる部屋タイプの場合
      if (topCell.occupied && bottomCell.occupied && 
          topCell.pieceType && bottomCell.pieceType &&
          topCell.pieceType !== bottomCell.pieceType) {
        
        if (shouldCreateOpening(topCell.pieceType, bottomCell.pieceType)) {
          // 連続する水平境界を検出して結合
          let wallStart = x;
          let wallEnd = x;
          
          // 右方向に同じ境界が続くかチェック
          while (wallEnd + 1 < GRID_WIDTH) {
            const nextTopCell = grid[y][wallEnd + 1];
            const nextBottomCell = grid[y + 1][wallEnd + 1];
            
            if (nextTopCell.occupied && nextBottomCell.occupied &&
                nextTopCell.pieceType && nextBottomCell.pieceType &&
                nextTopCell.pieceType === topCell.pieceType &&
                nextBottomCell.pieceType === bottomCell.pieceType) {
              wallEnd++;
            } else {
              break;
            }
          }
          
          const wallLength = wallEnd - wallStart + 1;
          if (wallLength >= 2) {
            const openingSize = 1;
            const openingPosition = Math.floor(wallLength / 2);
            
            openings.push({
              x: wallStart + openingPosition,
              y: y + 1,
              size: openingSize,
              type: 'horizontal',
              openingType: 'door'
            });
          }
          
          // 処理済みの範囲をスキップ
          x = wallEnd;
        }
      }
    }
  }

  return openings;
}

/**
 * 外部境界の開口部を検出する
 */
export function detectExteriorOpenings(grid: Grid): Opening[] {
  const openings: Opening[] = [];

  // 外部境界壁の開口部を検出（部屋と空きスペースの境界）
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH - 1; x++) {
      const leftCell = grid[y][x];
      const rightCell = grid[y][x + 1];

      // 片方が占有されており、もう片方が空きスペースの場合
      if ((leftCell.occupied && leftCell.pieceType && !rightCell.occupied) ||
          (!leftCell.occupied && rightCell.occupied && rightCell.pieceType)) {
        
        const occupiedPieceType = leftCell.occupied ? leftCell.pieceType : rightCell.pieceType;
        const isBuildingPiece = occupiedPieceType && !['庭', '駐車場'].includes(occupiedPieceType);
        
        // 建物カテゴリのピースで、LDKや廊下の場合は開口部を作る
        if (isBuildingPiece && (occupiedPieceType === 'LDK' || occupiedPieceType === '廊下')) {
          // 連続する垂直境界を検出して結合
          let wallStart = y;
          let wallEnd = y;
          
          // 下方向に同じ境界が続くかチェック
          while (wallEnd + 1 < GRID_HEIGHT) {
            const nextLeftCell = grid[wallEnd + 1][x];
            const nextRightCell = grid[wallEnd + 1][x + 1];
            
            const nextLeftOccupied = nextLeftCell.occupied && nextLeftCell.pieceType && !['庭', '駐車場'].includes(nextLeftCell.pieceType);
            const nextRightOccupied = nextRightCell.occupied && nextRightCell.pieceType && !['庭', '駐車場'].includes(nextRightCell.pieceType);
            
            if ((nextLeftOccupied && !nextRightOccupied && leftCell.occupied && nextLeftCell.pieceType === occupiedPieceType) ||
                (!nextLeftOccupied && nextRightOccupied && rightCell.occupied && nextRightCell.pieceType === occupiedPieceType)) {
              wallEnd++;
            } else {
              break;
            }
          }
          
          const wallLength = wallEnd - wallStart + 1;
          if (wallLength >= 3) {
            const openingSize = 1;
            const openingPosition = Math.floor(wallLength / 2);
            
            openings.push({
              x: x + 1,
              y: wallStart + openingPosition,
              size: openingSize,
              type: 'vertical',
              openingType: 'entrance'
            });
          }
          
          // 処理済みの範囲をスキップ
          y = wallEnd;
        }
      }
    }
  }

  // 水平方向の外部境界開口部を検出
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT - 1; y++) {
      const topCell = grid[y][x];
      const bottomCell = grid[y + 1][x];

      // 片方が占有されており、もう片方が空きスペースの場合
      if ((topCell.occupied && topCell.pieceType && !bottomCell.occupied) ||
          (!topCell.occupied && bottomCell.occupied && bottomCell.pieceType)) {
        
        const occupiedPieceType = topCell.occupied ? topCell.pieceType : bottomCell.pieceType;
        const isBuildingPiece = occupiedPieceType && !['庭', '駐車場'].includes(occupiedPieceType);
        
        // 建物カテゴリのピースで、LDKや廊下の場合は開口部を作る
        if (isBuildingPiece && (occupiedPieceType === 'LDK' || occupiedPieceType === '廊下')) {
          // 連続する水平境界を検出して結合
          let wallStart = x;
          let wallEnd = x;
          
          // 右方向に同じ境界が続くかチェック
          while (wallEnd + 1 < GRID_WIDTH) {
            const nextTopCell = grid[y][wallEnd + 1];
            const nextBottomCell = grid[y + 1][wallEnd + 1];
            
            const nextTopOccupied = nextTopCell.occupied && nextTopCell.pieceType && !['庭', '駐車場'].includes(nextTopCell.pieceType);
            const nextBottomOccupied = nextBottomCell.occupied && nextBottomCell.pieceType && !['庭', '駐車場'].includes(nextBottomCell.pieceType);
            
            if ((nextTopOccupied && !nextBottomOccupied && topCell.occupied && nextTopCell.pieceType === occupiedPieceType) ||
                (!nextTopOccupied && nextBottomOccupied && bottomCell.occupied && nextBottomCell.pieceType === occupiedPieceType)) {
              wallEnd++;
            } else {
              break;
            }
          }
          
          const wallLength = wallEnd - wallStart + 1;
          if (wallLength >= 3) {
            const openingSize = 1;
            const openingPosition = Math.floor(wallLength / 2);
            
            openings.push({
              x: wallStart + openingPosition,
              y: y + 1,
              size: openingSize,
              type: 'horizontal',
              openingType: 'entrance'
            });
          }
          
          // 処理済みの範囲をスキップ
          x = wallEnd;
        }
      }
    }
  }

  // 外周の開口部も検出
  // 上端
  for (let x = 0; x < GRID_WIDTH; x++) {
    const cell = grid[0][x];
    if (cell.occupied && cell.pieceType && (cell.pieceType === 'LDK' || cell.pieceType === '廊下')) {
      // 連続する上端を検出
      let wallStart = x;
      let wallEnd = x;
      
      while (wallEnd + 1 < GRID_WIDTH) {
        const nextCell = grid[0][wallEnd + 1];
        if (nextCell.occupied && nextCell.pieceType === cell.pieceType) {
          wallEnd++;
        } else {
          break;
        }
      }
      
      const wallLength = wallEnd - wallStart + 1;
      if (wallLength >= 3) {
        const openingSize = 1;
        const openingPosition = Math.floor(wallLength / 2);
        
        openings.push({
          x: wallStart + openingPosition,
          y: 0,
          size: openingSize,
          type: 'horizontal',
          openingType: 'entrance'
        });
      }
      
      x = wallEnd;
    }
  }

  // 下端
  for (let x = 0; x < GRID_WIDTH; x++) {
    const cell = grid[GRID_HEIGHT - 1][x];
    if (cell.occupied && cell.pieceType && (cell.pieceType === 'LDK' || cell.pieceType === '廊下')) {
      // 連続する下端を検出
      let wallStart = x;
      let wallEnd = x;
      
      while (wallEnd + 1 < GRID_WIDTH) {
        const nextCell = grid[GRID_HEIGHT - 1][wallEnd + 1];
        if (nextCell.occupied && nextCell.pieceType === cell.pieceType) {
          wallEnd++;
        } else {
          break;
        }
      }
      
      const wallLength = wallEnd - wallStart + 1;
      if (wallLength >= 3) {
        const openingSize = 1;
        const openingPosition = Math.floor(wallLength / 2);
        
        openings.push({
          x: wallStart + openingPosition,
          y: GRID_HEIGHT,
          size: openingSize,
          type: 'horizontal',
          openingType: 'entrance'
        });
      }
      
      x = wallEnd;
    }
  }

  // 左端
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const cell = grid[y][0];
    if (cell.occupied && cell.pieceType && (cell.pieceType === 'LDK' || cell.pieceType === '廊下')) {
      // 連続する左端を検出
      let wallStart = y;
      let wallEnd = y;
      
      while (wallEnd + 1 < GRID_HEIGHT) {
        const nextCell = grid[wallEnd + 1][0];
        if (nextCell.occupied && nextCell.pieceType === cell.pieceType) {
          wallEnd++;
        } else {
          break;
        }
      }
      
      const wallLength = wallEnd - wallStart + 1;
      if (wallLength >= 3) {
        const openingSize = 1;
        const openingPosition = Math.floor(wallLength / 2);
        
        openings.push({
          x: 0,
          y: wallStart + openingPosition,
          size: openingSize,
          type: 'vertical',
          openingType: 'entrance'
        });
      }
      
      y = wallEnd;
    }
  }

  // 右端
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const cell = grid[y][GRID_WIDTH - 1];
    if (cell.occupied && cell.pieceType && (cell.pieceType === 'LDK' || cell.pieceType === '廊下')) {
      // 連続する右端を検出
      let wallStart = y;
      let wallEnd = y;
      
      while (wallEnd + 1 < GRID_HEIGHT) {
        const nextCell = grid[wallEnd + 1][GRID_WIDTH - 1];
        if (nextCell.occupied && nextCell.pieceType === cell.pieceType) {
          wallEnd++;
        } else {
          break;
        }
      }
      
      const wallLength = wallEnd - wallStart + 1;
      if (wallLength >= 3) {
        const openingSize = 1;
        const openingPosition = Math.floor(wallLength / 2);
        
        openings.push({
          x: GRID_WIDTH,
          y: wallStart + openingPosition,
          size: openingSize,
          type: 'vertical',
          openingType: 'entrance'
        });
      }
      
      y = wallEnd;
    }
  }

  return openings;
}

/**
 * 配置済みピース間の壁を検出する
 * 異なる部屋タイプが隣接している境界に壁を生成
 */
export function detectWalls(grid: Grid): Wall[] {
  const walls: Wall[] = [];

  // 垂直方向の壁を検出（左右の境界）
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH - 1; x++) {
      const leftCell = grid[y][x];
      const rightCell = grid[y][x + 1];

      // 両方のセルが占有されており、異なる部屋タイプの場合
      if (leftCell.occupied && rightCell.occupied && 
          leftCell.pieceType && rightCell.pieceType &&
          leftCell.pieceType !== rightCell.pieceType) {
        
        // 連続する垂直壁を検出して結合
        let wallStart = y;
        let wallEnd = y;
        
        // 下方向に同じ境界が続くかチェック
        while (wallEnd + 1 < GRID_HEIGHT) {
          const nextLeftCell = grid[wallEnd + 1][x];
          const nextRightCell = grid[wallEnd + 1][x + 1];
          
          if (nextLeftCell.occupied && nextRightCell.occupied &&
              nextLeftCell.pieceType && nextRightCell.pieceType &&
              nextLeftCell.pieceType === leftCell.pieceType &&
              nextRightCell.pieceType === rightCell.pieceType) {
            wallEnd++;
          } else {
            break;
          }
        }
        
        // 壁を作成し、開口部を追加
        const wall = {
          x1: (x + 1),
          y1: wallStart,
          x2: (x + 1),
          y2: wallEnd + 1,
          type: 'vertical' as const
        };
        
        // 開口部を作る
        const wallsWithOpenings = createOpeningsInWall(wall, leftCell.pieceType, rightCell.pieceType);
        walls.push(...wallsWithOpenings);
        
        // 処理済みの範囲をスキップ
        y = wallEnd;
      }
    }
  }

  // 水平方向の壁を検出（上下の境界）
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT - 1; y++) {
      const topCell = grid[y][x];
      const bottomCell = grid[y + 1][x];

      // 両方のセルが占有されており、異なる部屋タイプの場合
      if (topCell.occupied && bottomCell.occupied && 
          topCell.pieceType && bottomCell.pieceType &&
          topCell.pieceType !== bottomCell.pieceType) {
        
        // 連続する水平壁を検出して結合
        let wallStart = x;
        let wallEnd = x;
        
        // 右方向に同じ境界が続くかチェック
        while (wallEnd + 1 < GRID_WIDTH) {
          const nextTopCell = grid[y][wallEnd + 1];
          const nextBottomCell = grid[y + 1][wallEnd + 1];
          
          if (nextTopCell.occupied && nextBottomCell.occupied &&
              nextTopCell.pieceType && nextBottomCell.pieceType &&
              nextTopCell.pieceType === topCell.pieceType &&
              nextBottomCell.pieceType === bottomCell.pieceType) {
            wallEnd++;
          } else {
            break;
          }
        }
        
        // 壁を作成し、開口部を追加
        const wall = {
          x1: wallStart,
          y1: (y + 1),
          x2: wallEnd + 1,
          y2: (y + 1),
          type: 'horizontal' as const
        };
        
        // 開口部を作る
        const wallsWithOpenings = createOpeningsInWall(wall, topCell.pieceType, bottomCell.pieceType);
        walls.push(...wallsWithOpenings);
        
        // 処理済みの範囲をスキップ
        x = wallEnd;
      }
    }
  }

  return walls;
}

/**
 * 外壁に開口部を作る（玄関や窓）
 */
function createExteriorOpenings(wall: Wall, pieceTypes: (PieceType | undefined)[]): Wall[] {
  // LDKや廊下がある場合は玄関を作る
  const hasEntrance = pieceTypes.some(type => type === 'LDK' || type === '廊下');
  
  if (!hasEntrance) {
    return [wall];
  }
  
  const wallLength = wall.type === 'horizontal' ? 
    Math.abs(wall.x2 - wall.x1) : 
    Math.abs(wall.y2 - wall.y1);
  
  // 壁が短すぎる場合は開口部を作らない
  if (wallLength < 3) {
    return [wall];
  }
  
  // 玄関のサイズ（1セル分）
  const openingSize = 1;
  const openingPosition = Math.floor(wallLength / 2);
  
  const walls: Wall[] = [];
  
  if (wall.type === 'horizontal') {
    // 開口部の前の壁
    if (openingPosition > 0) {
      walls.push({
        x1: wall.x1,
        y1: wall.y1,
        x2: wall.x1 + openingPosition,
        y2: wall.y2,
        type: 'horizontal'
      });
    }
    
    // 開口部の後の壁
    if (openingPosition + openingSize < wallLength) {
      walls.push({
        x1: wall.x1 + openingPosition + openingSize,
        y1: wall.y1,
        x2: wall.x2,
        y2: wall.y2,
        type: 'horizontal'
      });
    }
  } else {
    // 開口部の前の壁
    if (openingPosition > 0) {
      walls.push({
        x1: wall.x1,
        y1: wall.y1,
        x2: wall.x2,
        y2: wall.y1 + openingPosition,
        type: 'vertical'
      });
    }
    
    // 開口部の後の壁
    if (openingPosition + openingSize < wallLength) {
      walls.push({
        x1: wall.x1,
        y1: wall.y1 + openingPosition + openingSize,
        x2: wall.x2,
        y2: wall.y2,
        type: 'vertical'
      });
    }
  }
  
  return walls;
}

/**
 * 外部境界壁を検出する（部屋と外部空間の境界）
 * 部屋がある場所と空きスペースの境界に壁を生成
 */
export function detectExteriorBoundaryWalls(grid: Grid): Wall[] {
  const walls: Wall[] = [];

  // 垂直方向の外部境界壁を検出（部屋と空きスペースの境界）
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH - 1; x++) {
      const leftCell = grid[y][x];
      const rightCell = grid[y][x + 1];

      // 片方が占有されており、もう片方が空きスペースの場合
      if ((leftCell.occupied && leftCell.pieceType && !rightCell.occupied) ||
          (!leftCell.occupied && rightCell.occupied && rightCell.pieceType)) {
        
        const occupiedPieceType = leftCell.occupied ? leftCell.pieceType : rightCell.pieceType;
        const isBuildingPiece = occupiedPieceType && !['庭', '駐車場'].includes(occupiedPieceType);
        
        // 建物カテゴリのピースの場合のみ壁を作る
        if (isBuildingPiece) {
          // 連続する垂直境界壁を検出して結合
          let wallStart = y;
          let wallEnd = y;
          
          // 下方向に同じ境界が続くかチェック
          while (wallEnd + 1 < GRID_HEIGHT) {
            const nextLeftCell = grid[wallEnd + 1][x];
            const nextRightCell = grid[wallEnd + 1][x + 1];
            
            const nextLeftOccupied = nextLeftCell.occupied && nextLeftCell.pieceType && !['庭', '駐車場'].includes(nextLeftCell.pieceType);
            const nextRightOccupied = nextRightCell.occupied && nextRightCell.pieceType && !['庭', '駐車場'].includes(nextRightCell.pieceType);
            
            if ((nextLeftOccupied && !nextRightOccupied && leftCell.occupied) ||
                (!nextLeftOccupied && nextRightOccupied && rightCell.occupied)) {
              wallEnd++;
            } else {
              break;
            }
          }
          
          // 壁の範囲内のピースタイプを収集
          const pieceTypes: (PieceType | undefined)[] = [];
          for (let i = wallStart; i <= wallEnd; i++) {
            const cellLeft = grid[i][x];
            const cellRight = grid[i][x + 1];
            const pieceType = cellLeft.occupied ? cellLeft.pieceType : cellRight.pieceType;
            pieceTypes.push(pieceType);
          }
          
          const wall = {
            x1: (x + 1),
            y1: wallStart,
            x2: (x + 1),
            y2: wallEnd + 1,
            type: 'vertical' as const
          };
          
          // 外部境界壁に開口部を作る
          const wallsWithOpenings = createExteriorOpenings(wall, pieceTypes);
          walls.push(...wallsWithOpenings);
          
          // 処理済みの範囲をスキップ
          y = wallEnd;
        }
      }
    }
  }

  // 水平方向の外部境界壁を検出（部屋と空きスペースの境界）
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT - 1; y++) {
      const topCell = grid[y][x];
      const bottomCell = grid[y + 1][x];

      // 片方が占有されており、もう片方が空きスペースの場合
      if ((topCell.occupied && topCell.pieceType && !bottomCell.occupied) ||
          (!topCell.occupied && bottomCell.occupied && bottomCell.pieceType)) {
        
        const occupiedPieceType = topCell.occupied ? topCell.pieceType : bottomCell.pieceType;
        const isBuildingPiece = occupiedPieceType && !['庭', '駐車場'].includes(occupiedPieceType);
        
        // 建物カテゴリのピースの場合のみ壁を作る
        if (isBuildingPiece) {
          // 連続する水平境界壁を検出して結合
          let wallStart = x;
          let wallEnd = x;
          
          // 右方向に同じ境界が続くかチェック
          while (wallEnd + 1 < GRID_WIDTH) {
            const nextTopCell = grid[y][wallEnd + 1];
            const nextBottomCell = grid[y + 1][wallEnd + 1];
            
            const nextTopOccupied = nextTopCell.occupied && nextTopCell.pieceType && !['庭', '駐車場'].includes(nextTopCell.pieceType);
            const nextBottomOccupied = nextBottomCell.occupied && nextBottomCell.pieceType && !['庭', '駐車場'].includes(nextBottomCell.pieceType);
            
            if ((nextTopOccupied && !nextBottomOccupied && topCell.occupied) ||
                (!nextTopOccupied && nextBottomOccupied && bottomCell.occupied)) {
              wallEnd++;
            } else {
              break;
            }
          }
          
          // 壁の範囲内のピースタイプを収集
          const pieceTypes: (PieceType | undefined)[] = [];
          for (let i = wallStart; i <= wallEnd; i++) {
            const cellTop = grid[y][i];
            const cellBottom = grid[y + 1][i];
            const pieceType = cellTop.occupied ? cellTop.pieceType : cellBottom.pieceType;
            pieceTypes.push(pieceType);
          }
          
          const wall = {
            x1: wallStart,
            y1: (y + 1),
            x2: wallEnd + 1,
            y2: (y + 1),
            type: 'horizontal' as const
          };
          
          // 外部境界壁に開口部を作る
          const wallsWithOpenings = createExteriorOpenings(wall, pieceTypes);
          walls.push(...wallsWithOpenings);
          
          // 処理済みの範囲をスキップ
          x = wallEnd;
        }
      }
    }
  }

  return walls;
}

/**
 * 外壁を検出する（建物の外周）
 * 建物カテゴリのピースの外側に壁を生成
 */
export function detectExteriorWalls(grid: Grid): Wall[] {
  const walls: Wall[] = [];

  // 上端の外壁
  for (let x = 0; x < GRID_WIDTH; x++) {
    const cell = grid[0][x];
    if (cell.occupied && cell.pieceType) {
      // 建物カテゴリかチェック（outdoor以外）
      const isBuildingPiece = !['庭', '駐車場'].includes(cell.pieceType);
      if (isBuildingPiece) {
        // 連続する上端壁を検出
        let wallStart = x;
        let wallEnd = x;
        
        while (wallEnd + 1 < GRID_WIDTH) {
          const nextCell = grid[0][wallEnd + 1];
          if (nextCell.occupied && nextCell.pieceType && 
              !['庭', '駐車場'].includes(nextCell.pieceType)) {
            wallEnd++;
          } else {
            break;
          }
        }
        
        // 壁の範囲内のピースタイプを収集
        const pieceTypes: (PieceType | undefined)[] = [];
        for (let i = wallStart; i <= wallEnd; i++) {
          pieceTypes.push(grid[0][i].pieceType);
        }
        
        const wall = {
          x1: wallStart,
          y1: 0,
          x2: wallEnd + 1,
          y2: 0,
          type: 'horizontal' as const
        };
        
        // 外壁に開口部を作る
        const wallsWithOpenings = createExteriorOpenings(wall, pieceTypes);
        walls.push(...wallsWithOpenings);
        
        x = wallEnd;
      }
    }
  }

  // 下端の外壁
  for (let x = 0; x < GRID_WIDTH; x++) {
    const cell = grid[GRID_HEIGHT - 1][x];
    if (cell.occupied && cell.pieceType) {
      const isBuildingPiece = !['庭', '駐車場'].includes(cell.pieceType);
      if (isBuildingPiece) {
        let wallStart = x;
        let wallEnd = x;
        
        while (wallEnd + 1 < GRID_WIDTH) {
          const nextCell = grid[GRID_HEIGHT - 1][wallEnd + 1];
          if (nextCell.occupied && nextCell.pieceType && 
              !['庭', '駐車場'].includes(nextCell.pieceType)) {
            wallEnd++;
          } else {
            break;
          }
        }
        
        // 壁の範囲内のピースタイプを収集
        const pieceTypes: (PieceType | undefined)[] = [];
        for (let i = wallStart; i <= wallEnd; i++) {
          pieceTypes.push(grid[GRID_HEIGHT - 1][i].pieceType);
        }
        
        const wall = {
          x1: wallStart,
          y1: GRID_HEIGHT,
          x2: wallEnd + 1,
          y2: GRID_HEIGHT,
          type: 'horizontal' as const
        };
        
        // 外壁に開口部を作る
        const wallsWithOpenings = createExteriorOpenings(wall, pieceTypes);
        walls.push(...wallsWithOpenings);
        
        x = wallEnd;
      }
    }
  }

  // 左端の外壁
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const cell = grid[y][0];
    if (cell.occupied && cell.pieceType) {
      const isBuildingPiece = !['庭', '駐車場'].includes(cell.pieceType);
      if (isBuildingPiece) {
        let wallStart = y;
        let wallEnd = y;
        
        while (wallEnd + 1 < GRID_HEIGHT) {
          const nextCell = grid[wallEnd + 1][0];
          if (nextCell.occupied && nextCell.pieceType && 
              !['庭', '駐車場'].includes(nextCell.pieceType)) {
            wallEnd++;
          } else {
            break;
          }
        }
        
        // 壁の範囲内のピースタイプを収集
        const pieceTypes: (PieceType | undefined)[] = [];
        for (let i = wallStart; i <= wallEnd; i++) {
          pieceTypes.push(grid[i][0].pieceType);
        }
        
        const wall = {
          x1: 0,
          y1: wallStart,
          x2: 0,
          y2: wallEnd + 1,
          type: 'vertical' as const
        };
        
        // 外壁に開口部を作る
        const wallsWithOpenings = createExteriorOpenings(wall, pieceTypes);
        walls.push(...wallsWithOpenings);
        
        y = wallEnd;
      }
    }
  }

  // 右端の外壁
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const cell = grid[y][GRID_WIDTH - 1];
    if (cell.occupied && cell.pieceType) {
      const isBuildingPiece = !['庭', '駐車場'].includes(cell.pieceType);
      if (isBuildingPiece) {
        let wallStart = y;
        let wallEnd = y;
        
        while (wallEnd + 1 < GRID_HEIGHT) {
          const nextCell = grid[wallEnd + 1][GRID_WIDTH - 1];
          if (nextCell.occupied && nextCell.pieceType && 
              !['庭', '駐車場'].includes(nextCell.pieceType)) {
            wallEnd++;
          } else {
            break;
          }
        }
        
        // 壁の範囲内のピースタイプを収集
        const pieceTypes: (PieceType | undefined)[] = [];
        for (let i = wallStart; i <= wallEnd; i++) {
          pieceTypes.push(grid[i][GRID_WIDTH - 1].pieceType);
        }
        
        const wall = {
          x1: GRID_WIDTH,
          y1: wallStart,
          x2: GRID_WIDTH,
          y2: wallEnd + 1,
          type: 'vertical' as const
        };
        
        // 外壁に開口部を作る
        const wallsWithOpenings = createExteriorOpenings(wall, pieceTypes);
        walls.push(...wallsWithOpenings);
        
        y = wallEnd;
      }
    }
  }

  return walls;
}
