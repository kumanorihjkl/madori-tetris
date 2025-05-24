import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { GameCanvas } from './components/GameCanvas';
import { SidePanel } from './components/SidePanel';
import { useGameControls } from './hooks/useGameControls';
import { useGameLoop } from './hooks/useGameLoop';

function GameContainer() {
  useGameControls();
  useGameLoop();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-4">
        <GameCanvas />
      </div>
      <SidePanel />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <GameContainer />
      </div>
    </Provider>
  );
}

export default App;
