import { useCallback, useEffect, useRef, useState } from 'react';

const THROTTLE_MS = 30; // ~33 events/sec — smooth but bandwidth-friendly

/**
 * Encapsulates all HTML5 Canvas drawing logic: local rendering, remote
 * stroke playback, undo history, and pointer-event throttling. Keeping
 * this in a hook (rather than inline in the component) makes the
 * drawing engine reusable and testable independent of layout/UI.
 */
export function useDrawingCanvas({ isDrawer, onLocalStroke }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const lastEmitRef = useRef(0);
  const localHistoryRef = useRef([]); // stacks of completed paths for undo

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isErasing, setIsErasing] = useState(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current && canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
      ctxRef.current.lineCap = 'round';
      ctxRef.current.lineJoin = 'round';
    }
    return ctxRef.current;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = parent.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = getCtx();
    if (ctx) ctx.scale(ratio, ratio);
  }, [getCtx]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const getRelativePoint = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  const drawSegment = useCallback(
    (from, to, strokeColor, size) => {
      const ctx = getCtx();
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(from.x * rect.width, from.y * rect.height);
      ctx.lineTo(to.x * rect.width, to.y * rect.height);
      ctx.stroke();
    },
    [getCtx]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (!isDrawer) return;
      e.preventDefault();
      isDrawingRef.current = true;
      const point = getRelativePoint(e);
      lastPointRef.current = point;
      const strokeColor = isErasing ? '#ffffff' : color;
      localHistoryRef.current.push([]);
      onLocalStroke?.({ type: 'start' });
    },
    [isDrawer, getRelativePoint, isErasing, color, onLocalStroke]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDrawer || !isDrawingRef.current) return;
      e.preventDefault();
      const point = getRelativePoint(e);
      const strokeColor = isErasing ? '#ffffff' : color;
      drawSegment(lastPointRef.current, point, strokeColor, brushSize);
      const currentPath = localHistoryRef.current[localHistoryRef.current.length - 1];
      currentPath?.push({ from: lastPointRef.current, to: point, color: strokeColor, size: brushSize });
      lastPointRef.current = point;

      const now = Date.now();
      if (now - lastEmitRef.current > THROTTLE_MS) {
        lastEmitRef.current = now;
        onLocalStroke?.({ type: 'move', x: point.x, y: point.y, color: strokeColor, size: brushSize });
      }
    },
    [isDrawer, getRelativePoint, isErasing, color, brushSize, drawSegment, onLocalStroke]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDrawer || !isDrawingRef.current) return;
      e?.preventDefault?.();
      isDrawingRef.current = false;
      lastPointRef.current = null;
      onLocalStroke?.({ type: 'end' });
    },
    [isDrawer, onLocalStroke]
  );

  const clearLocalCanvas = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    localHistoryRef.current = [];
  }, [getCtx]);

  // Playback of a remote drawer's strokes (received over the socket)
  const remoteFirstPoint = useRef(null);
  const applyRemoteEvent = useCallback(
    (evt) => {
      if (evt.type === 'start') {
        remoteFirstPoint.current = null;
        return;
      }
      if (evt.type === 'end') {
        remoteFirstPoint.current = null;
        return;
      }
      const point = { x: evt.x, y: evt.y };
      if (remoteFirstPoint.current) {
        drawSegment(remoteFirstPoint.current, point, evt.color, evt.size);
      }
      remoteFirstPoint.current = point;
    },
    [drawSegment]
  );

  useEffect(() => {
    clearLocalCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
    resizeCanvas,
  };
}
