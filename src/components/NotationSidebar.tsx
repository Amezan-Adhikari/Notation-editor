//@ts-nocheck
"use client"


import { useState, useEffect, useRef } from "react";
import { Copy, Check, Keyboard, Move, Maximize2, ArrowDown } from "lucide-react";

// Simple array of Swaras (notes) with category organization
const SWARA_CATEGORIES = [
  {
    name: "Base Notes",
    swaras: ["सा", "रे", "ग", "म", "प", "ध", "नि","-"]
  },
  {
    name: "Higher Octave",
    swaras: ["सां", "रें", "गं", "मं", "पं"]
  },
  {
    name: "Lower Octave",
    swaras: ["प़", "ध़", "ऩि"]
  }
];

// Flatten the swaras for search functionality
const ALL_SWARAS = SWARA_CATEGORIES.flatMap(category => category.swaras);

export default function NotationSidebar({ onNotationSelect, isShiftHeld }:any) {
  const [copiedNotation, setCopiedNotation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  // State for draggable functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // State for resizable functionality
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 280, height: 500 });
  const [minimized, setMinimized] = useState(false);
  
  // Reference to the sidebar element
  const sidebarRef = useRef(null);
  
  // Set initial position after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ 
        x: window.innerWidth - 300, 
        y: window.innerHeight / 2 - 250 
      });
    }
  }, []);

  // Load position from localStorage on initial render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedPosition = localStorage.getItem('notationSidebarPosition');
      const savedSize = localStorage.getItem('notationSidebarSize');
      
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      }
      
      if (savedSize) {
        setSize(JSON.parse(savedSize));
      }
    } catch (error) {
      console.error('Error loading sidebar settings:', error);
    }
  }, []);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('notationSidebarPosition', JSON.stringify(position));
    } catch (error) {
      console.error('Error saving sidebar position:', error);
    }
  }, [position]);

  // Save size to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('notationSidebarSize', JSON.stringify(size));
    } catch (error) {
      console.error('Error saving sidebar size:', error);
    }
  }, [size]);

  // Handle start dragging
  const handleMouseDown = (e) => {
    if (isResizing) return; // Don't initiate drag if resizing
    if (e.button !== 0) return; // Only left mouse button
    if (e.target.closest('.resize-handle')) return; // Don't initiate drag if resizing
    
    setIsDragging(true);
    const rect = sidebarRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Prevent text selection while dragging
    e.preventDefault();
  };

  // Handle start resizing
  const handleResizeMouseDown = (e) => {
    setIsResizing(true);
    e.stopPropagation();
    e.preventDefault();
  };

  // Handle mouse movement for both dragging and resizing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep within window bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - (minimized ? 40 : size.height);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
      
      if (isResizing) {
        const newWidth = Math.max(200, e.clientX - position.x);
        const newHeight = Math.max(200, e.clientY - position.y);
        
        setSize({
          width: Math.min(newWidth, window.innerWidth - position.x),
          height: Math.min(newHeight, window.innerHeight - position.y)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position, size, minimized]);

  // Function to handle copying notation
  const handleCopy = (notation) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(notation);
      setCopiedNotation(notation);

      // Automatically reset copied state after 2 seconds
      setTimeout(() => setCopiedNotation(null), 2000);
    }
  };

  // Function to handle notation selection
  const handleSelection = (swara) => {
    // Pass the notation and whether to append it (based on shift state)
    onNotationSelect(swara, isShiftHeld);
    
    // Add to recently used if not already in the first 5 positions
    setRecentlyUsed(prev => {
      const newRecent = prev.filter(item => item !== swara);
      return [swara, ...newRecent].slice(0, 5);
    });
  };

  // Toggle minimized state
  const toggleMinimize = (e) => {
    e.stopPropagation();
    setMinimized(!minimized);
  };

  // Filter swaras based on search term
  const filteredSwaras = searchTerm 
    ? ALL_SWARAS.filter(swara => 
        swara.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div 
      ref={sidebarRef}
      className={`fixed bg-white shadow-xl border-2 border-blue-500 rounded-lg overflow-hidden z-50 transition-all duration-300 ${isDragging || isResizing ? 'cursor-grabbing select-none' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${minimized ? 280 : size.width}px`,
        height: `${minimized ? '40px' : `${size.height}px`}`,
      }}
    >
      {/* Header/Title bar - also functions as drag handle */}
      <div 
        className="bg-blue-600 text-white p-2 cursor-grab flex justify-between items-center"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center">
          <Move size={16} className="mr-2" />
          <h3 className="font-bold text-lg">Notation Panel</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleMinimize}
            className="p-1 hover:bg-blue-700 rounded"
          >
            {minimized ? <Maximize2 size={16} /> : <ArrowDown size={16} />}
          </button>
        </div>
      </div>
      
      {/* Content - only shown when not minimized */}
      {!minimized && (
        <div className="p-4 overflow-y-auto" style={{ height: `${size.height - 40}px` }}>
          {/* Search box */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded focus:outline-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Search results */}
          {searchTerm && (
            <div className="mb-4">
              <h4 className="text-sm text-gray-600 mb-2">Search Results:</h4>
              <div className="grid grid-cols-3 gap-2">
                {filteredSwaras.map((swara) => (
                  <button 
                    key={`search-${swara}`}
                    onClick={() => handleSelection(swara)}
                    className="p-3 bg-blue-100 hover:bg-blue-300 rounded text-center text-lg transition-colors"
                  >
                    {swara}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Recently used notes */}
          {recentlyUsed.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm text-gray-600 mb-2">Recently Used:</h4>
              <div className="flex flex-wrap gap-2">
                {recentlyUsed.map((swara) => (
                  <button 
                    key={`recent-${swara}`}
                    onClick={() => handleSelection(swara)}
                    className="p-2 bg-green-100 hover:bg-green-200 rounded text-center text-lg flex-1"
                  >
                    {swara}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* All swaras by category */}
          {!searchTerm && SWARA_CATEGORIES.map((category) => (
            <div key={category.name} className="mb-4">
              <h4 className="text-sm text-gray-600 mb-2">{category.name}:</h4>
              <div className="grid grid-cols-3 gap-3">
                {category.swaras.map((swara) => (
                  <button 
                    key={swara}
                    onClick={() => handleSelection(swara)}
                    className="p-3 bg-blue-100 hover:bg-blue-300 text-blue-900 rounded text-center text-lg transition-colors"
                  >
                    {swara}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Keyboard shortcuts toggle */}
          <div className="mt-6 border-t pt-4">
            <button 
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="flex items-center justify-center w-full text-blue-600 hover:text-blue-800"
            >
              <Keyboard size={16} className="mr-1" />
              {showKeyboardShortcuts ? "Hide Shortcuts" : "Show Shortcuts"}
            </button>
            
            {showKeyboardShortcuts && (
              <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                <p><strong>Shift + Click:</strong> Add to current note</p>
                <p><strong>Click:</strong> Replace note & move to next</p>
                <p><strong>Shift (release):</strong> Move to next after multi-note</p>
                <p><strong>Drag header:</strong> Move panel</p>
                <p><strong>Drag corner:</strong> Resize panel</p>
              </div>
            )}
          </div>
          
          {/* Indicator for Shift key state */}
          {isShiftHeld && (
            <div className="mt-4 text-center text-sm text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
              <strong>Shift Mode:</strong> Adding to current note
            </div>
          )}
        </div>
      )}
      
      {/* Resize handle */}
      {!minimized && (
        <div 
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleResizeMouseDown}
          style={{
            backgroundImage: 'linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)',
          }}
        />
      )}
    </div>
  );
}