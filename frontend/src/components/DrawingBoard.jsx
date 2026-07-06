import { useCallback, useEffect } from 'react';
import { useDrawingCanvas } from '../canvas/useDrawingCanvas.js';
import { useGame } from '../context/GameContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { EVENTS } from '../constants/events.js';
import Toolbar from './Toolbar.jsx';

export default function DrawingBoard({ isDrawer }) {
  const { drawStart, drawMove, drawEnd, undo, clearCanvas } = useGame();
  const { socket } = useSocket();

  const onLocalStroke = useCallback(
    (evt) => {
      if (evt.type === 'start') drawStart(evt);
      else if (evt.type === 'move') drawMove(evt);
      else if (evt.type === 'end') drawEnd();
    },
    [drawStart, drawMove, drawEnd]
  );

  const {
    canvasRef,
    color,
    setColor,
    brushSize,
    setBrushSize,
    isErasing,
    setIsErasing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    clearLocalCanvas,
    applyRemoteEvent,
  } = useDrawingCanvas({ isDrawer, onLocalStroke });

  useEffect(() => {
    const onCanvasUpdate = (evt) => applyRemoteEvent(evt);
    const onCanvasClear = () => clearLocalCanvas();
    const onCanvasUndo = () => {
      /* Simplification: full redraw-on-undo is out of scope for the
         72h MVP; we just clear + let the drawer keep going. A production
         follow-up would replay the stroke history minus the last path. */
    };

    socket.on(EVENTS.CANVAS_UPDATE, onCanvasUpdate);
    socket.on(EVENTS.CANVAS_CLEAR, onCanvasClear);
    socket.on(EVENTS.CANVAS_UNDO, onCanvasUndo);
    return () => {
      socket.off(EVENTS.CANVAS_UPDATE, onCanvasUpdate);
      socket.off(EVENTS.CANVAS_CLEAR, onCanvasClear);
      socket.off(EVENTS.CANVAS_UNDO, onCanvasUndo);
    };
  }, [socket, applyRemoteEvent, clearLocalCanvas]);

  const handleUndo = () => undo();
  const handleClear = () => {
    clearLocalCanvas();
    clearCanvas();
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <Toolbar
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        isErasing={isErasing}
        setIsErasing={setIsErasing}
        onUndo={handleUndo}
        onClear={handleClear}
        disabled={!isDrawer}
      />
      <div className="flex-1 card overflow-hidden relative min-h-[300px]">
        <canvas
          ref={canvasRef}
          className={`w-full h-full block ${isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          style={{ touchAction: 'none' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        {!isDrawer && (
          <div className="absolute top-2 right-2 text-xs bg-black/40 px-2 py-1 rounded-full text-[var(--color-text-muted)]">
            watching
          </div>
        )}
      </div>
    </div>
  );
}
