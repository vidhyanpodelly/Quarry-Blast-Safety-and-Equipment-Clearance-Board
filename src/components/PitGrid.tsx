import React, { useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useSafety } from '../safety/SafetyContext';
import { RED_ZONE, isCoordinateInRedZone } from '../safety/engine';
import type { Asset, Operator } from '../safety/types';

export const PitGrid: React.FC = () => {
  const { state, dispatchAction } = useSafety();
  
  // Dragging state
  const [draggingEntity, setDraggingEntity] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return; // Only accept left mouse button or touch
    if (svgRef.current) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
    setDraggingEntity(id);
    
    // Initialize local drag pos
    const entity = state.vehicles.find(v => v.id === id) || state.operators.find(o => o.id === id);
    if (entity) setDragPos({ x: entity.x, y: entity.y });
    
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingEntity || !svgRef.current) return;
    
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    let x = (e.clientX - CTM.e) / CTM.a;
    let y = (e.clientY - CTM.f) / CTM.d;

    // Clamp coordinates to 500x300 bounding box
    x = Math.max(10, Math.min(x, 490));
    y = Math.max(10, Math.min(y, 290));

    // Update transient local state instead of firing global state updates constantly
    setDragPos({ x, y });

    // ONLY dispatch immediately if it's a safety-critical countdown abort
    if (state.blastState === 'COUNTDOWN' && isCoordinateInRedZone(x, y)) {
      dispatchAction('UPDATE_ASSET_POSITION', { id: draggingEntity, x, y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingEntity && dragPos) {
      // Authoritative state update on pointer release
      dispatchAction('UPDATE_ASSET_POSITION', { id: draggingEntity, x: dragPos.x, y: dragPos.y });
    }
    if (svgRef.current && svgRef.current.hasPointerCapture(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    setDraggingEntity(null);
    setDragPos(null);
  };

  const renderEntity = (entity: Asset | Operator, isOperator: boolean) => {
    // Use local drag position if this is the currently dragged entity
    const currentX = (draggingEntity === entity.id && dragPos) ? dragPos.x : entity.x;
    const currentY = (draggingEntity === entity.id && dragPos) ? dragPos.y : entity.y;

    const isRed = isCoordinateInRedZone(currentX, currentY);
    const color = isRed ? 'fill-red-500' : (isOperator ? 'fill-blue-500' : 'fill-orange-500');

    return (
      <g 
        key={entity.id} 
        transform={`translate(${currentX}, ${currentY})`}
        onPointerDown={(e) => handlePointerDown(e, entity.id)}
        className="cursor-pointer"
        data-testid={`entity-${entity.id}`}
        style={{ touchAction: 'none' }}
      >
        <circle r="12" className={`${color} stroke-white stroke-2`} />
        <text y="-18" textAnchor="middle" className="text-[10px] font-bold fill-gray-800 select-none pointer-events-none">
          {entity.id}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">Pit Sector Grid</h3>
      <div className="w-full overflow-hidden border-2 border-gray-400 bg-gray-50 touch-none">
        <svg 
          ref={svgRef}
          viewBox="0 0 500 300"
          className="w-full h-auto"
          style={{ touchAction: 'none' }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Sectors Backgrounds */}
          <rect x="0" y="0" width="166" height="300" fill="#f3f4f6" stroke="#d1d5db" />
          <text x="83" y="20" textAnchor="middle" className="text-sm font-bold fill-gray-400">SECTOR A</text>
          
          <rect x="166" y="0" width="167" height="300" fill="#f9fafb" stroke="#d1d5db" />
          <text x="250" y="20" textAnchor="middle" className="text-sm font-bold fill-gray-400">SECTOR B</text>
          
          <rect x="333" y="0" width="167" height="300" fill="#f3f4f6" stroke="#d1d5db" />
          <text x="416" y="20" textAnchor="middle" className="text-sm font-bold fill-gray-400">SECTOR C</text>

          {/* Red Zone */}
          <rect 
            x={RED_ZONE.x1} 
            y={RED_ZONE.y1} 
            width={RED_ZONE.x2 - RED_ZONE.x1} 
            height={RED_ZONE.y2 - RED_ZONE.y1} 
            fill="rgba(239, 68, 68, 0.2)" 
            stroke="red" 
            strokeWidth="2" 
            strokeDasharray="4" 
            data-testid="red-zone-area"
          />
          <text x="250" y="155" textAnchor="middle" className="text-sm font-bold fill-red-700 pointer-events-none">
            BLAST RED ZONE
          </text>

          {/* Entities */}
          {state.vehicles.map(v => renderEntity(v, false))}
          {state.operators.map(o => renderEntity(o, true))}

        </svg>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Drag entities to change location. Moving into the Red Zone will immediately trigger safety aborts.
      </p>
    </div>
  );
};
