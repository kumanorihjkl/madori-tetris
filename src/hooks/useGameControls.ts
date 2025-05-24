import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { movePiece, rotatePiece, hardDrop, holdPiece } from '../store/gameSlice';

export function useGameControls() {
  const dispatch = useDispatch<AppDispatch>();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        dispatch(movePiece('left'));
        break;
      case 'ArrowRight':
        event.preventDefault();
        dispatch(movePiece('right'));
        break;
      case 'ArrowDown':
        event.preventDefault();
        dispatch(movePiece('down'));
        break;
      case 'ArrowUp':
        event.preventDefault();
        dispatch(rotatePiece());
        break;
      case ' ':
        event.preventDefault();
        dispatch(hardDrop());
        break;
      case 'c':
      case 'C':
        event.preventDefault();
        dispatch(holdPiece());
        break;
    }
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
