import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GameState, PieceType, PieceInstance, Controls } from '../logic/types';
import { GRID_WIDTH, GRID_HEIGHT } from '../logic/types';
import { createEmptyGrid, isPositionValid, placePieceOnGrid, calculateHardDropPosition, findCompletedLines, clearLines } from '../logic/grid';
import { movePiece as moveGridPiece } from '../logic/grid';
import { createPieceInstance, getSpawnPosition, PieceBag } from '../logic/pieces';
import { rotatePiece as rotateGridPiece } from '../logic/pieces';
import { calculateGameStats, calculatePieceScore, checkGameOverConditions, shouldLevelUp, getDropSpeed, calculateLineClearScore } from '../logic/scoring';

// 初期状態
const initialState: GameState = {
  grid: createEmptyGrid(),
  currentPiece: null,
  nextPieces: [],
  holdPiece: null,
  canHold: true,
  score: 0,
  level: 1,
  linesCleared: 0,
  gameOver: false,
  gameOverReason: undefined,
  placedPieces: [],
  dropTimer: 0,
  lastDropTime: 0,
};

// ピースバッグのインスタンス
const pieceBag = new PieceBag();

// 行消去処理とピースリスト更新のヘルパー関数
function processLineClear(state: GameState) {
  // 完成した行を検出
  const completedLines = findCompletedLines(state.grid);
  
  if (completedLines.length > 0) {
    // 行を消去
    state.grid = clearLines(state.grid, completedLines);
    
    // 行消去数を更新
    state.linesCleared += completedLines.length;
    
    // 行消去スコアを加算
    state.score += calculateLineClearScore(completedLines.length, state.level);
    
    // 配置済みピースリストを更新（部分的に消去されたピースも考慮）
    const updatedPieces: PieceInstance[] = [];
    
    for (const piece of state.placedPieces) {
      const pieceBottomY = piece.position.y + piece.size.height - 1;
      const pieceTopY = piece.position.y;
      
      // ピースが消去された行と重複しているかチェック
      const affectedLines = completedLines.filter(lineY => lineY >= pieceTopY && lineY <= pieceBottomY);
      
      if (affectedLines.length === 0) {
        // ピースが消去された行に含まれていない場合、位置調整のみ
        const linesBelow = completedLines.filter(lineY => lineY > pieceBottomY).length;
        updatedPieces.push({
          ...piece,
          position: {
            ...piece.position,
            y: piece.position.y + linesBelow
          }
        });
      } else {
        // ピースが部分的または完全に消去された場合
        // 消去されていない部分を新しいピースとして分割
        const remainingSegments = [];
        
        // 消去された行より上の部分
        const topSegmentHeight = Math.max(0, Math.min(...affectedLines) - pieceTopY);
        if (topSegmentHeight > 0) {
          const linesBelow = completedLines.filter(lineY => lineY > pieceTopY + topSegmentHeight - 1).length;
          remainingSegments.push({
            ...piece,
            id: `${piece.id}-top`,
            size: {
              ...piece.size,
              height: topSegmentHeight
            },
            position: {
              ...piece.position,
              y: piece.position.y + linesBelow
            }
          });
        }
        
        // 消去された行より下の部分
        const bottomSegmentStart = Math.max(...affectedLines) + 1;
        const bottomSegmentHeight = Math.max(0, pieceBottomY - bottomSegmentStart + 1);
        if (bottomSegmentHeight > 0) {
          const linesBelow = completedLines.filter(lineY => lineY > bottomSegmentStart + bottomSegmentHeight - 1).length;
          remainingSegments.push({
            ...piece,
            id: `${piece.id}-bottom`,
            size: {
              ...piece.size,
              height: bottomSegmentHeight
            },
            position: {
              x: piece.position.x,
              y: bottomSegmentStart + linesBelow - completedLines.length
            }
          });
        }
        
        updatedPieces.push(...remainingSegments);
      }
    }
    
    state.placedPieces = updatedPieces;
    
    // グリッドを配置済みピースから再構築して整合性を保つ
    state.grid = createEmptyGrid();
    for (const piece of state.placedPieces) {
      state.grid = placePieceOnGrid(state.grid, piece);
    }
  }
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // ゲーム開始
    startGame: (state) => {
      state.grid = createEmptyGrid();
      state.currentPiece = null;
      state.nextPieces = [];
      state.holdPiece = null;
      state.canHold = true;
      state.score = 0;
      state.level = 1;
      state.linesCleared = 0;
      state.gameOver = false;
      state.gameOverReason = undefined;
      state.placedPieces = [];
      state.dropTimer = 0;
      state.lastDropTime = Date.now();
      
      // 次のピースを生成
      for (let i = 0; i < 3; i++) {
        state.nextPieces.push(pieceBag.getNext());
      }
      
      // 最初のピースをスポーン
      if (state.nextPieces.length > 0) {
        const nextType = state.nextPieces.shift()!;
        const spawnPosition = getSpawnPosition(nextType);
        const newPiece = createPieceInstance(nextType, spawnPosition);
        
        if (!isPositionValid(state.grid, newPiece)) {
          state.gameOver = true;
          state.gameOverReason = '新しいピースを配置できません';
          return;
        }
        
        state.currentPiece = newPiece;
        state.canHold = true;
        state.nextPieces.push(pieceBag.getNext());
      }
    },

    // 次のピースをスポーン
    spawnNextPiece: (state) => {
      if (state.nextPieces.length === 0) return;
      
      const nextType = state.nextPieces.shift()!;
      const spawnPosition = getSpawnPosition(nextType);
      const newPiece = createPieceInstance(nextType, spawnPosition);
      
      // スポーン位置で衝突チェック
      if (!isPositionValid(state.grid, newPiece)) {
        state.gameOver = true;
        state.gameOverReason = '新しいピースを配置できません';
        return;
      }
      
      state.currentPiece = newPiece;
      state.canHold = true;
      
      // 次のピースを補充
      state.nextPieces.push(pieceBag.getNext());
    },

    // ピースを移動
    movePiece: (state, action: PayloadAction<'left' | 'right' | 'down'>) => {
      if (!state.currentPiece || state.gameOver) return;
      
      const movedPiece = moveGridPiece(state.currentPiece, action.payload);
      
      if (isPositionValid(state.grid, movedPiece)) {
        state.currentPiece = movedPiece;
      } else if (action.payload === 'down') {
        // 下移動で衝突した場合、ピースを固定
        // placePieceロジックを直接実行
        if (state.currentPiece) {
          // グリッドに配置
          state.grid = placePieceOnGrid(state.grid, state.currentPiece);
          
          // 配置済みピースリストに追加
          const placedPiece = { ...state.currentPiece, placed: true };
          state.placedPieces.push(placedPiece);
          
          // スコア加算
          state.score += calculatePieceScore(placedPiece);
          
          // 行消去処理
          processLineClear(state);
          
          // ピースバッグに配置を通知
          pieceBag.updatePlacedCount(placedPiece.type);
          
          // レベルアップチェック
          if (shouldLevelUp(state.placedPieces.length, state.level)) {
            state.level++;
            pieceBag.updateLevel(state.level);
          }
          
          // ゲーム終了条件チェック
          const gameOverCheck = checkGameOverConditions(state.grid, state.placedPieces, true);
          if (gameOverCheck.isGameOver) {
            state.gameOver = true;
            state.gameOverReason = gameOverCheck.reason;
            return;
          }
          
          // 次のピースをスポーン
          state.currentPiece = null;
          // spawnNextPieceロジックを直接実行
          if (state.nextPieces.length > 0) {
            const nextType = state.nextPieces.shift()!;
            const spawnPosition = getSpawnPosition(nextType);
            const newPiece = createPieceInstance(nextType, spawnPosition);
            
            if (!isPositionValid(state.grid, newPiece)) {
              state.gameOver = true;
              state.gameOverReason = '新しいピースを配置できません';
              return;
            }
            
            state.currentPiece = newPiece;
            state.canHold = true;
            state.nextPieces.push(pieceBag.getNext());
          }
        }
      }
    },

    // ピースを回転
    rotatePiece: (state) => {
      if (!state.currentPiece || state.gameOver) return;
      
      const rotatedPiece = rotateGridPiece(state.currentPiece);
      
      if (isPositionValid(state.grid, rotatedPiece)) {
        state.currentPiece = rotatedPiece;
      }
    },

    // ハードドロップ
    hardDrop: (state) => {
      if (!state.currentPiece || state.gameOver) return;
      
      const dropPosition = calculateHardDropPosition(state.grid, state.currentPiece);
      state.currentPiece.position = dropPosition;
      
      // placePieceロジックを直接実行
      if (state.currentPiece) {
        // グリッドに配置
        state.grid = placePieceOnGrid(state.grid, state.currentPiece);
        
        // 配置済みピースリストに追加
        const placedPiece = { ...state.currentPiece, placed: true };
        state.placedPieces.push(placedPiece);
        
        // スコア加算
        state.score += calculatePieceScore(placedPiece);
        
        // 行消去処理
        processLineClear(state);
        
        // ピースバッグに配置を通知
        pieceBag.updatePlacedCount(placedPiece.type);
        
        // レベルアップチェック
        if (shouldLevelUp(state.placedPieces.length, state.level)) {
          state.level++;
          pieceBag.updateLevel(state.level);
        }
        
        // ゲーム終了条件チェック
        const gameOverCheck = checkGameOverConditions(state.grid, state.placedPieces, true);
        if (gameOverCheck.isGameOver) {
          state.gameOver = true;
          state.gameOverReason = gameOverCheck.reason;
          return;
        }
        
        // 次のピースをスポーン
        state.currentPiece = null;
        if (state.nextPieces.length > 0) {
          const nextType = state.nextPieces.shift()!;
          const spawnPosition = getSpawnPosition(nextType);
          const newPiece = createPieceInstance(nextType, spawnPosition);
          
          if (!isPositionValid(state.grid, newPiece)) {
            state.gameOver = true;
            state.gameOverReason = '新しいピースを配置できません';
            return;
          }
          
          state.currentPiece = newPiece;
          state.canHold = true;
          state.nextPieces.push(pieceBag.getNext());
        }
      }
    },

    // ホールド
    holdPiece: (state) => {
      if (!state.currentPiece || !state.canHold || state.gameOver) return;
      
      const currentType = state.currentPiece.type;
      
      if (state.holdPiece) {
        // ホールドピースと交換
        const spawnPosition = getSpawnPosition(state.holdPiece);
        const newPiece = createPieceInstance(state.holdPiece, spawnPosition);
        
        if (isPositionValid(state.grid, newPiece)) {
          state.currentPiece = newPiece;
          state.holdPiece = currentType;
          state.canHold = false;
        }
      } else {
        // 新しくホールド
        state.holdPiece = currentType;
        state.canHold = false;
        // spawnNextPieceロジックを直接実行
        if (state.nextPieces.length > 0) {
          const nextType = state.nextPieces.shift()!;
          const spawnPosition = getSpawnPosition(nextType);
          const newPiece = createPieceInstance(nextType, spawnPosition);
          
          if (!isPositionValid(state.grid, newPiece)) {
            state.gameOver = true;
            state.gameOverReason = '新しいピースを配置できません';
            return;
          }
          
          state.currentPiece = newPiece;
          state.canHold = true;
          state.nextPieces.push(pieceBag.getNext());
        }
      }
    },

    // ピースを配置
    placePiece: (state) => {
      if (!state.currentPiece || state.gameOver) return;
      
      // グリッドに配置
      state.grid = placePieceOnGrid(state.grid, state.currentPiece);
      
      // 配置済みピースリストに追加
      const placedPiece = { ...state.currentPiece, placed: true };
      state.placedPieces.push(placedPiece);
      
      // スコア加算
      state.score += calculatePieceScore(placedPiece);
      
      // 行消去処理
      processLineClear(state);
      
      // ピースバッグに配置を通知
      pieceBag.updatePlacedCount(placedPiece.type);
      
      // レベルアップチェック
      if (shouldLevelUp(state.placedPieces.length, state.level)) {
        state.level++;
        pieceBag.updateLevel(state.level);
      }
      
      // ゲーム終了条件チェック
      const gameOverCheck = checkGameOverConditions(state.grid, state.placedPieces, true);
      if (gameOverCheck.isGameOver) {
        state.gameOver = true;
        state.gameOverReason = gameOverCheck.reason;
        return;
      }
      
      // 次のピースをスポーン
      state.currentPiece = null;
      if (state.nextPieces.length > 0) {
        const nextType = state.nextPieces.shift()!;
        const spawnPosition = getSpawnPosition(nextType);
        const newPiece = createPieceInstance(nextType, spawnPosition);
        
        if (!isPositionValid(state.grid, newPiece)) {
          state.gameOver = true;
          state.gameOverReason = '新しいピースを配置できません';
          return;
        }
        
        state.currentPiece = newPiece;
        state.canHold = true;
        state.nextPieces.push(pieceBag.getNext());
      }
    },

    // ゲームループ更新
    updateGameLoop: (state, action: PayloadAction<number>) => {
      if (state.gameOver || !state.currentPiece) return;
      
      const currentTime = action.payload;
      const dropSpeed = getDropSpeed(state.level);
      
      if (currentTime - state.lastDropTime >= dropSpeed) {
        // movePieceロジックを直接実行
        if (state.currentPiece) {
          const movedPiece = moveGridPiece(state.currentPiece, 'down');
          
          if (isPositionValid(state.grid, movedPiece)) {
            state.currentPiece = movedPiece;
          } else {
            // 下移動で衝突した場合、ピースを固定
            // グリッドに配置
            state.grid = placePieceOnGrid(state.grid, state.currentPiece);
            
            // 配置済みピースリストに追加
            const placedPiece = { ...state.currentPiece, placed: true };
            state.placedPieces.push(placedPiece);
            
            // スコア加算
            state.score += calculatePieceScore(placedPiece);
            
            // 行消去処理
            processLineClear(state);
            
            // ピースバッグに配置を通知
            pieceBag.updatePlacedCount(placedPiece.type);
            
            // レベルアップチェック
            if (shouldLevelUp(state.placedPieces.length, state.level)) {
              state.level++;
              pieceBag.updateLevel(state.level);
            }
            
            // ゲーム終了条件チェック
            const gameOverCheck = checkGameOverConditions(state.grid, state.placedPieces, true);
            if (gameOverCheck.isGameOver) {
              state.gameOver = true;
              state.gameOverReason = gameOverCheck.reason;
              return;
            }
            
            // 次のピースをスポーン
            state.currentPiece = null;
            if (state.nextPieces.length > 0) {
              const nextType = state.nextPieces.shift()!;
              const spawnPosition = getSpawnPosition(nextType);
              const newPiece = createPieceInstance(nextType, spawnPosition);
              
              if (!isPositionValid(state.grid, newPiece)) {
                state.gameOver = true;
                state.gameOverReason = '新しいピースを配置できません';
                return;
              }
              
              state.currentPiece = newPiece;
              state.canHold = true;
              state.nextPieces.push(pieceBag.getNext());
            }
          }
        }
        state.lastDropTime = currentTime;
      }
    },

    // ゲームリセット
    resetGame: (state) => {
      Object.assign(state, initialState);
      state.lastDropTime = Date.now();
    },
  },
});

export const {
  startGame,
  spawnNextPiece,
  movePiece,
  rotatePiece,
  hardDrop,
  holdPiece,
  placePiece,
  updateGameLoop,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;

// セレクター
export const selectGameState = (state: { game: GameState }) => state.game;
export const selectGameStats = (state: { game: GameState }) => 
  calculateGameStats(state.game.grid, state.game.placedPieces);
