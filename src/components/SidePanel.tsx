import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { selectGameStats } from '../store/gameSlice';
import { startGame, resetGame } from '../store/gameSlice';
import { PIECE_DEFINITIONS } from '../logic/pieces';

export function SidePanel() {
  const dispatch = useDispatch<AppDispatch>();
  const gameState = useSelector<RootState, RootState['game']>((state) => state.game);
  const gameStats = useSelector(selectGameStats);

  const handleStartGame = () => {
    dispatch(startGame());
  };

  const handleResetGame = () => {
    dispatch(resetGame());
  };

  return (
    <div className="w-80 p-4 bg-gray-100 border-l border-gray-300">
      <h1 className="text-2xl font-bold mb-4 text-center">間取りテトリス・プロ</h1>
      
      {/* ゲーム情報 */}
      <div className="mb-6">
        <div className="bg-white p-3 rounded shadow mb-2">
          <div className="text-sm text-gray-600">スコア</div>
          <div className="text-xl font-bold">{gameState.score.toLocaleString()}</div>
        </div>
        
        <div className="bg-white p-3 rounded shadow mb-2">
          <div className="text-sm text-gray-600">レベル</div>
          <div className="text-xl font-bold">{gameState.level}</div>
        </div>
        
        <div className="bg-white p-3 rounded shadow mb-2">
          <div className="text-sm text-gray-600">建蔽率</div>
          <div className="text-xl font-bold">
            {(gameStats.buildingCoverage * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 必須ピース状況 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">必須ピース</h3>
        <div className="bg-white p-3 rounded shadow">
          <div className="flex justify-between mb-1">
            <span>駐車場:</span>
            <span>{gameStats.placedRequiredPieces.駐車場}/1</span>
          </div>
          <div className="flex justify-between">
            <span>庭:</span>
            <span>{gameStats.placedRequiredPieces.庭}/1</span>
          </div>
        </div>
      </div>

      {/* ホールドピース */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">ホールド</h3>
        <div className="bg-white p-3 rounded shadow h-16 flex items-center justify-center">
          {gameState.holdPiece ? (
            <div 
              className="px-3 py-1 rounded text-white text-sm font-bold"
              style={{ backgroundColor: PIECE_DEFINITIONS[gameState.holdPiece].color }}
            >
              {gameState.holdPiece}
            </div>
          ) : (
            <span className="text-gray-400">なし</span>
          )}
        </div>
      </div>

      {/* 次のピース */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">次のピース</h3>
        <div className="space-y-2">
          {gameState.nextPieces.slice(0, 3).map((pieceType, index) => (
            <div key={index} className="bg-white p-2 rounded shadow flex items-center justify-center">
              <div 
                className="px-3 py-1 rounded text-white text-sm font-bold"
                style={{ backgroundColor: PIECE_DEFINITIONS[pieceType].color }}
              >
                {pieceType}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ボーナス状況 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">ボーナス</h3>
        <div className="bg-white p-3 rounded shadow text-sm">
          <div className={`mb-1 ${gameStats.zoneComplete ? 'text-green-600' : 'text-gray-400'}`}>
            ✓ ゾーン完成 (+1000)
          </div>
          <div className={`mb-1 ${gameStats.slimCorridor ? 'text-green-600' : 'text-gray-400'}`}>
            ✓ スリム廊下 (+500)
          </div>
          <div className={`${gameStats.landscapeBonus ? 'text-green-600' : 'text-gray-400'}`}>
            ✓ 景観ボーナス (+300)
          </div>
        </div>
      </div>

      {/* 警告 */}
      {gameStats.hasLightingIssue && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
          ⚠️ 採光問題: LDKまたは寝室が外周に接していません
        </div>
      )}

      {gameStats.buildingCoverage > 0.75 && (
        <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded">
          ⚠️ 建蔽率警告: 80%に近づいています
        </div>
      )}

      {/* コントロール */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">操作方法</h3>
        <div className="bg-white p-3 rounded shadow text-sm">
          <div>← → : 移動</div>
          <div>↑ : 回転</div>
          <div>↓ : ソフトドロップ</div>
          <div>Space : ハードドロップ</div>
          <div>C : ホールド</div>
        </div>
      </div>

      {/* ゲームボタン */}
      <div className="space-y-2">
        {gameState.gameOver ? (
          <>
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-center mb-2">
              <div className="font-bold">ゲームオーバー</div>
              <div className="text-sm">{gameState.gameOverReason}</div>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              新しいゲーム
            </button>
          </>
        ) : gameState.currentPiece ? (
          <button
            onClick={handleResetGame}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            リセット
          </button>
        ) : (
          <button
            onClick={handleStartGame}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            新しいゲーム
          </button>
        )}
      </div>
    </div>
  );
}
