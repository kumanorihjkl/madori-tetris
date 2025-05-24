import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { updateGameLoop } from '../store/gameSlice';

export function useGameLoop() {
  const dispatch = useDispatch<AppDispatch>();
  const gameOver = useSelector<RootState, boolean>((state) => state.game.gameOver);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (gameOver) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const gameLoop = () => {
      const currentTime = Date.now();
      dispatch(updateGameLoop(currentTime));
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dispatch, gameOver]);
}
