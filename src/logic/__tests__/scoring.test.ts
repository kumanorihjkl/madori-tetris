import { describe, it, expect } from 'vitest';
import { calculateBuildingCoverage, checkLightingIssue, checkZoneComplete } from '../scoring';
import { createEmptyGrid, placePieceOnGrid } from '../grid';
import { createPieceInstance } from '../pieces';
import type { PieceInstance } from '../types';

describe('scoring', () => {
  describe('calculateBuildingCoverage', () => {
    it('空のグリッドでは建蔽率が0%', () => {
      const grid = createEmptyGrid();
      const coverage = calculateBuildingCoverage(grid);
      expect(coverage).toBe(0);
    });

    it('建物ピースが配置されると建蔽率が計算される', () => {
      let grid = createEmptyGrid();
      
      // LDK (5×4 = 20マス) を配置
      const ldkPiece = createPieceInstance('LDK', { x: 0, y: 0 });
      grid = placePieceOnGrid(grid, ldkPiece);
      
      const coverage = calculateBuildingCoverage(grid);
      // 20マス / 160マス = 0.125 (12.5%)
      expect(coverage).toBe(0.125);
    });

    it('屋外ピースは建蔽率に含まれない', () => {
      let grid = createEmptyGrid();
      
      // 庭 (2×2 = 4マス) を配置
      const gardenPiece = createPieceInstance('庭', { x: 0, y: 0 });
      grid = placePieceOnGrid(grid, gardenPiece);
      
      const coverage = calculateBuildingCoverage(grid);
      expect(coverage).toBe(0);
    });
  });

  describe('checkLightingIssue', () => {
    it('LDKが外周に接していない場合は採光問題あり', () => {
      let grid = createEmptyGrid();
      
      // LDKを中央に配置（外周に接しない）
      const ldkPiece = createPieceInstance('LDK', { x: 2, y: 2 });
      grid = placePieceOnGrid(grid, ldkPiece);
      
      const hasIssue = checkLightingIssue(grid, [ldkPiece]);
      expect(hasIssue).toBe(true);
    });

    it('LDKが外周に接している場合は採光問題なし', () => {
      let grid = createEmptyGrid();
      
      // LDKを左端に配置（外周に接する）
      const ldkPiece = createPieceInstance('LDK', { x: 0, y: 0 });
      grid = placePieceOnGrid(grid, ldkPiece);
      
      const hasIssue = checkLightingIssue(grid, [ldkPiece]);
      expect(hasIssue).toBe(false);
    });
  });

  describe('checkZoneComplete', () => {
    it('必要な4種類のピースがすべて配置されていない場合はfalse', () => {
      let grid = createEmptyGrid();
      
      const ldkPiece = createPieceInstance('LDK', { x: 0, y: 0 });
      const bedroomPiece = createPieceInstance('寝室', { x: 5, y: 0 });
      
      grid = placePieceOnGrid(grid, ldkPiece);
      grid = placePieceOnGrid(grid, bedroomPiece);
      
      const isComplete = checkZoneComplete(grid, [ldkPiece, bedroomPiece]);
      expect(isComplete).toBe(false);
    });

    it('4種類のピースが配置されているが隣接していない場合はfalse', () => {
      let grid = createEmptyGrid();
      
      const ldkPiece = createPieceInstance('LDK', { x: 0, y: 0 });
      const bedroomPiece = createPieceInstance('寝室', { x: 6, y: 0 });
      const bathPiece = createPieceInstance('浴室', { x: 0, y: 5 });
      const toiletPiece = createPieceInstance('トイレ', { x: 6, y: 5 });
      
      const pieces = [ldkPiece, bedroomPiece, bathPiece, toiletPiece];
      
      for (const piece of pieces) {
        grid = placePieceOnGrid(grid, piece);
      }
      
      const isComplete = checkZoneComplete(grid, pieces);
      expect(isComplete).toBe(false);
    });
  });
});
