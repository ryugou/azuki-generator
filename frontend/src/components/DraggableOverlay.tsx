import React from "react";

interface Position {
  x: number;
  y: number;
}

interface DraggableOverlayProps {
  baseImage: HTMLImageElement | null;
  itemImage: HTMLImageElement | null;
  itemPosition: Position;
  isDragging: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  handleTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchEnd: () => void;
}

const DraggableOverlay: React.FC<DraggableOverlayProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  baseImage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  itemImage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  itemPosition,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isDragging,
  canvasRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
}) => {
  return (
    <div className="flex justify-center mb-6">
      <canvas
        ref={canvasRef}
        className="border-2 border-slate-600 cursor-move touch-none rounded-lg shadow-2xl"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default DraggableOverlay;
