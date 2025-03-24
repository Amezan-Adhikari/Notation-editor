//@ts-nocheck
"use client"

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

// Simple array of Swaras (notes)
const SWARAS = ['स', 'रे', 'ग', 'म', 'प', 'ध', 'नि'];

export default function NotationSidebar({ onNotationSelect }) {
  const [copiedNotation, setCopiedNotation] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);

  // Effect to handle keyboard events for Shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setIsShiftHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Function to handle copying notation
  const handleCopy = (notation: string) => {
    navigator.clipboard.writeText(notation);
    setCopiedNotation(notation);

    // Automatically reset copied state after 2 seconds
    setTimeout(() => setCopiedNotation(null), 2000);
  };

  // Function to track the active input element
  const handleTrackInput = (input: HTMLInputElement) => {
    setActiveInput(input);
  };

  // Function to handle notation selection
  const handleSelection = (swara: string) => {
    // If Shift is held, add to existing notation
    if (isShiftHeld) {
      onNotationSelect(swara, true);
    } else {
      // Normal selection behavior
      onNotationSelect(swara, false);
    }
  };

  return (
    <div className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg p-4 rounded-l-lg">
      <h3 className="text-center font-bold mb-4">Swaras</h3>
      <div className="grid grid-cols-1 gap-2">
        {SWARAS.map((swara) => (
          <button 
            key={swara}
            onClick={() => handleSelection(swara)}
            className="relative p-2 bg-blue-100 hover:bg-blue-200 rounded text-center text-lg"
          >
            {swara}
          </button>
        ))}
      </div>
      
      {/* Optional: Indicator for Shift key state */}
      {isShiftHeld && (
        <div className="mt-4 text-center text-sm text-blue-600">
          Shift held: Multiple notes mode
        </div>
      )}
    </div>
  );
}