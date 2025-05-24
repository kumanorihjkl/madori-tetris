import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE } from '../logic/types';
import { PIECE_DEFINITIONS } from '../logic/pieces';
import { detectWalls, detectExteriorWalls, detectExteriorBoundaryWalls, detectOpenings, detectExteriorOpenings } from '../logic/walls';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useSelector<RootState, RootState['game']>((state) => state.game);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // グリッドの背景を描画
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // グリッドラインを描画
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // 縦線
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    
    // 横線
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // 配置済みピースを描画
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = gameState.grid[y][x];
        if (cell.occupied && cell.pieceType) {
          const definition = PIECE_DEFINITIONS[cell.pieceType];
          ctx.fillStyle = definition.color;
          ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
          
          // ピース名を描画
          ctx.fillStyle = '#fff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            cell.pieceType,
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2 + 3
          );
        }
      }
    }

    // 壁を描画（配置済みピース間の境界）
    const interiorWalls = detectWalls(gameState.grid);
    const exteriorWalls = detectExteriorWalls(gameState.grid);
    const exteriorBoundaryWalls = detectExteriorBoundaryWalls(gameState.grid);
    const allWalls = [...interiorWalls, ...exteriorWalls, ...exteriorBoundaryWalls];

    ctx.strokeStyle = '#000'; // 黒色の実線
    ctx.lineWidth = 2; // 壁の太さ
    ctx.lineCap = 'square';

    allWalls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.x1 * CELL_SIZE, wall.y1 * CELL_SIZE);
      ctx.lineTo(wall.x2 * CELL_SIZE, wall.y2 * CELL_SIZE);
      ctx.stroke();
    });

    // 開口部を灰色の線で描画
    const interiorOpenings = detectOpenings(gameState.grid);
    const exteriorOpenings = detectExteriorOpenings(gameState.grid);
    const allOpenings = [...interiorOpenings, ...exteriorOpenings];
    
    ctx.strokeStyle = '#888'; // 灰色の線
    ctx.lineWidth = 2; // 開口部の線の太さ
    ctx.lineCap = 'square';

    allOpenings.forEach(opening => {
      ctx.beginPath();
      if (opening.type === 'vertical') {
        // 垂直方向の開口部
        const startY = opening.y * CELL_SIZE;
        const endY = (opening.y + opening.size) * CELL_SIZE;
        ctx.moveTo(opening.x * CELL_SIZE, startY);
        ctx.lineTo(opening.x * CELL_SIZE, endY);
      } else {
        // 水平方向の開口部
        const startX = opening.x * CELL_SIZE;
        const endX = (opening.x + opening.size) * CELL_SIZE;
        ctx.moveTo(startX, opening.y * CELL_SIZE);
        ctx.lineTo(endX, opening.y * CELL_SIZE);
      }
      ctx.stroke();
    });

    // 現在のピースを描画
    if (gameState.currentPiece) {
      const piece = gameState.currentPiece;
      const definition = PIECE_DEFINITIONS[piece.type];
      
      // 半透明で描画
      ctx.fillStyle = definition.color + '80';
      
      for (let y = 0; y < piece.size.height; y++) {
        for (let x = 0; x < piece.size.width; x++) {
          const drawX = (piece.position.x + x) * CELL_SIZE;
          const drawY = (piece.position.y + y) * CELL_SIZE;
          
          ctx.fillRect(
            drawX + 1,
            drawY + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        }
      }
      
      // ピース名を描画
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const centerX = (piece.position.x + piece.size.width / 2) * CELL_SIZE;
      const centerY = (piece.position.y + piece.size.height / 2) * CELL_SIZE;
      ctx.fillText(piece.type, centerX, centerY + 4);
    }

  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={GRID_WIDTH * CELL_SIZE}
      height={GRID_HEIGHT * CELL_SIZE}
      className="border border-gray-400 bg-white"
    />
  );
}
