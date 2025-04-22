"use client"

import { useState, useRef, useEffect } from "react";
import NotationSidebar from "./NotationSidebar";

// Define types for better type safety
interface NotationBox {
  notation: { note: string }[];
}

interface ColumnData {
  column: NotationBox[];
  lyrics: string;
  lyricsWidth?: '1/4' | '1/2' | '3/4' | 'full';
  lyricsAlign?: 'center' | 'start' | 'end';
}

interface SongComposition {
  title: string;
  beat: string;
  columns: number;
  bpm: number;
  Song: ColumnData[][];
}

export default function Notation() {
  const [beat, setBeat] = useState("2/4");
  const [bpm, setBpm] = useState(180);
  const [songTitle, setSongTitle] = useState("Untitled Song");
  const [columns, setColumns] = useState(4);
  const [songComposition, setSongComposition] = useState<SongComposition>({
    title: "Untitled Song",
    beat: "2/4",
    columns: 1,
    bpm: 180,
    Song: []
  });
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number | null>(null);
  const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [lastEntryWithShift, setLastEntryWithShift] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState("");
  const [savedSongs, setSavedSongs] = useState<{id: string, title: string}[]>([]);
  const [showSavedSongsPanel, setShowSavedSongsPanel] = useState(false);

  // Refs to track all input elements for focus management
  const inputRefs = useRef<Array<Array<Array<HTMLInputElement | null>>>>([]);

  const WIDTH_CYCLE: ColumnData['lyricsWidth'][] = [undefined, '1/4', '1/2', '3/4', 'full'];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Handle keyboard events for Shift key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setIsShiftHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey && isShiftHeld) {
        setIsShiftHeld(false);
        
        // If the last entry was made with shift, move focus to next input
        if (lastEntryWithShift) {
          moveFocusToNextInput();
          setLastEntryWithShift(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Load saved songs from localStorage
    loadSavedSongs();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isShiftHeld, lastEntryWithShift]); // Added dependencies to ensure the effect updates

  // Load saved songs from localStorage
  function loadSavedSongs() {
    if (typeof window === 'undefined') return;
    
    try {
      const savedSongsData = localStorage.getItem('savedSongs');
      if (savedSongsData) {
        const songs = JSON.parse(savedSongsData);
        setSavedSongs(songs);
      }
    } catch (error) {
      console.error('Error loading saved songs:', error);
    }
  }

  // Save current song to localStorage
  function saveCurrentSong() {
    if (typeof window === 'undefined') return;
    
    try {
      // Generate a unique ID for the song if it doesn't have one
      const songId = songComposition.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      
      // Add the current song to localStorage
      const songData = JSON.stringify(songComposition);
      localStorage.setItem(`song-${songId}`, songData);
      
      // Update the saved songs list
      const updatedSavedSongs = [...savedSongs, { id: songId, title: songComposition.title }];
      setSavedSongs(updatedSavedSongs);
      localStorage.setItem('savedSongs', JSON.stringify(updatedSavedSongs));
      
      alert(`Song "${songComposition.title}" saved successfully!`);
    } catch (error) {
      console.error('Error saving song:', error);
      alert('Failed to save song. Please try again.');
    }
  }

  // Load a saved song from localStorage
  function loadSavedSong(songId: string) {
    if (typeof window === 'undefined') return;
    
    try {
      const songData = localStorage.getItem(`song-${songId}`);
      if (songData) {
        const loadedSong = JSON.parse(songData);
        setSongComposition(loadedSong);
        setBeat(loadedSong.beat);
        setBpm(loadedSong.bpm);
        setColumns(loadedSong.columns);
        setSongTitle(loadedSong.title);
        setShowSavedSongsPanel(false);
      }
    } catch (error) {
      console.error('Error loading song:', error);
      alert('Failed to load song. The saved data may be corrupted.');
    }
  }

  // Delete a saved song
  function deleteSavedSong(songId: string, event: React.MouseEvent) {
    if (typeof window === 'undefined') return;
    
    event.stopPropagation(); // Prevent triggering the parent click event
    try {
      // Remove song data
      localStorage.removeItem(`song-${songId}`);
      
      // Update saved songs list
      const updatedSavedSongs = savedSongs.filter(song => song.id !== songId);
      setSavedSongs(updatedSavedSongs);
      localStorage.setItem('savedSongs', JSON.stringify(updatedSavedSongs));
      
      alert('Song deleted successfully');
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Failed to delete song. Please try again.');
    }
  }

  // Import song from JSON
  function importSongFromJson() {
    try {
      setImportError("");
      const importedData = JSON.parse(importJsonText);
      
      // Validate the imported data has the required structure
      if (!importedData.beat || !importedData.columns || !importedData.bpm || !Array.isArray(importedData.Song)) {
        throw new Error("Invalid song data format");
      }
      
      // Add title if not present in imported data
      if (!importedData.title) {
        importedData.title = "Imported Song";
      }
      
      // Update state with imported data
      setSongComposition(importedData);
      setBeat(importedData.beat);
      setBpm(importedData.bpm);
      setColumns(importedData.columns);
      setSongTitle(importedData.title);
      
      // Close modal
      setShowImportModal(false);
      setImportJsonText("");
    } catch (error) {
      console.error('Error importing JSON:', error);
      setImportError("Invalid JSON format. Please check your data and try again.");
    }
  }

  // Handle adding a new line
  function handleAddLine() {
    // Determine number of boxes based on beat
    const configNumber = beat === "2/4" ? 4 : beat === "3/4" ? 3 : 4;

    // Create a new line with specified columns
    const newLine: ColumnData[] = Array(columns).fill(null).map(() => ({
      column: Array(configNumber).fill(null).map(() => ({
        notation: [{ note: "" }]
      })),
      lyrics: "",
      lyricsWidth: undefined,
      lyricsAlign: 'center'
    }));

    // Update song composition by adding the new line
    setSongComposition(prev => ({
      ...prev,
      title: songTitle,
      beat,
      columns,
      bpm,
      Song: [...prev.Song, newLine]
    }));
  }

  // Update notation with or without spaces based on append mode
  function updateLineNotation(
    lineIndex: number, 
    columnIndex: number, 
    boxIndex: number, 
    value: string,
    appendMode: boolean = false
  ) {
    const updatedSong = [...songComposition.Song];
    const currentNote = updatedSong[lineIndex][columnIndex].column[boxIndex].notation[0].note;
    
    // If in append mode, add the new note to existing notes (no spaces)
    const newNote = appendMode 
      ? (currentNote + value)  // No space between notes when appending
      : value;

    updatedSong[lineIndex][columnIndex].column[boxIndex].notation[0].note = newNote;
    
    setSongComposition(prev => ({
      ...prev,
      Song: updatedSong
    }));
  }

  function updateLineLyrics(lineIndex: number, columnIndex: number, value: string) {
    const updatedSong = [...songComposition.Song];
    updatedSong[lineIndex][columnIndex].lyrics = value;
    
    setSongComposition(prev => ({
      ...prev,
      Song: updatedSong
    }));
  }

  // Handle notation selection with focus movement
  function handleNotationSelect(notation: string, appendMode: boolean = false) {
    if (activeLineIndex !== null && 
        activeColumnIndex !== null && 
        activeBoxIndex !== null) {
      
      const usingShift = appendMode || isShiftHeld;
      
      // Update the notation
      updateLineNotation(
        activeLineIndex, 
        activeColumnIndex, 
        activeBoxIndex, 
        notation,
        usingShift // Use either explicit appendMode or shift key
      );
      
      // Track if we're using shift for this entry
      if (usingShift) {
        setLastEntryWithShift(true);
      } else {
        // Move focus to next input if not in append mode
        moveFocusToNextInput();
        setLastEntryWithShift(false);
      }
    }
  }

  // Function to move focus to the next input
  function moveFocusToNextInput() {
    if (activeLineIndex === null || 
        activeColumnIndex === null || 
        activeBoxIndex === null) return;
        
    const songData = songComposition.Song;
    
    // Calculate indices for next input
    let nextLine = activeLineIndex;
    let nextColumn = activeColumnIndex;
    let nextBox = activeBoxIndex + 1;
    
    // If at the end of the boxes in this column
    if (nextBox >= songData[nextLine][nextColumn].column.length) {
      nextBox = 0;
      nextColumn++;
      
      // If at the end of columns in this line
      if (nextColumn >= songData[nextLine].length) {
        nextColumn = 0;
        nextLine++;
        
        // If at the end of all lines, wrap back to the beginning
        if (nextLine >= songData.length) {
          nextLine = 0;
        }
      }
    }
    
    // Set active indices
    setActiveLineIndex(nextLine);
    setActiveColumnIndex(nextColumn);
    setActiveBoxIndex(nextBox);
    
    // Focus the next input element
    const nextInput = inputRefs.current[nextLine]?.[nextColumn]?.[nextBox];
    if (nextInput) {
      nextInput.focus();
    }
  }

  function trackActiveInput(
    lineIndex: number, 
    columnIndex: number, 
    boxIndex: number | undefined,
    inputElement: HTMLInputElement | null
  ) {
    setActiveLineIndex(lineIndex);
    setActiveColumnIndex(columnIndex);
    if (boxIndex !== undefined) {
      setActiveBoxIndex(boxIndex);
    }
    
    // Store the input reference
    if (inputElement && boxIndex !== undefined) {
      // Initialize the nested array structure if needed
      if (!inputRefs.current[lineIndex]) {
        inputRefs.current[lineIndex] = [];
      }
      if (!inputRefs.current[lineIndex][columnIndex]) {
        inputRefs.current[lineIndex][columnIndex] = [];
      }
      
      inputRefs.current[lineIndex][columnIndex][boxIndex] = inputElement;
    }
  }

  function handleLyricsContextMenu(
    e: React.MouseEvent<HTMLInputElement>, 
    lineIndex: number, 
    columnIndex: number
  ) {
    e.preventDefault();
    const updatedSong = [...songComposition.Song];
    const currentColumn = updatedSong[lineIndex][columnIndex];

    // Cycle through widths
    const currentWidthIndex = WIDTH_CYCLE.indexOf(currentColumn.lyricsWidth);
    const nextWidthIndex = (currentWidthIndex + 1) % WIDTH_CYCLE.length;
    currentColumn.lyricsWidth = WIDTH_CYCLE[nextWidthIndex];

    setSongComposition(prev => ({
      ...prev,
      Song: updatedSong
    }));
  }

  function handleLyricsSideClick(
    e: React.MouseEvent<HTMLInputElement>, 
    lineIndex: number, 
    columnIndex: number
  ) {
    const updatedSong = [...songComposition.Song];
    const currentColumn = updatedSong[lineIndex][columnIndex];

    // Determine click position
    const inputElement = e.currentTarget;
    const rect = inputElement.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;

    // Change alignment based on click position
    if (clickPosition < rect.width * 0.3) {
      currentColumn.lyricsAlign = 'start';
    } else if (clickPosition > rect.width * 0.7) {
      currentColumn.lyricsAlign = 'end';
    } else {
      currentColumn.lyricsAlign = 'center';
    }

    setSongComposition(prev => ({
      ...prev,
      Song: updatedSong
    }));
  }

  function clearColumn(lineIndex: number, columnIndex: number) {
    const updatedSong = [...songComposition.Song];
    const currentColumn = updatedSong[lineIndex][columnIndex];

    // Clear notation
    currentColumn.column.forEach(box => {
      box.notation[0].note = "";
    });

    // Clear lyrics
    currentColumn.lyrics = "";
    currentColumn.lyricsWidth = undefined;
    currentColumn.lyricsAlign = 'center';

    setSongComposition(prev => ({
      ...prev,
      Song: updatedSong
    }));
  }

  function deleteLine(lineIndex: number) {
    setSongComposition(prev => ({
      ...prev,
      Song: prev.Song.filter((_, index) => index !== lineIndex)
    }));
    
    // Update inputRefs array
    inputRefs.current = inputRefs.current.filter((_, index) => index !== lineIndex);
  }

  function exportToJson() {
    if (typeof window === 'undefined') return;
    
    const jsonData = JSON.stringify(songComposition, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${songComposition.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="md:px-20 px-5 relative">
      <h1 className="my-20 text-center text-3xl text-blue-900 font-bold">Notation Editor</h1>
      
      {/* New song title input */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Song Title:</label>
        <input 
          type="text" 
          className="shadow appearance-none border rounded w-2xl py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
        />
      </div>
      
      <div>
        <textarea placeholder="paste your lyrics here for easy copy paste" className="w-1/2 p-2 bg-gray-100" rows={7}></textarea>
      </div>

      <div className="flex flex-wrap items-center space-x-2 space-y-2 md:space-y-0 mb-6">
        <div>
          <label className="mr-2">Select Beat:</label>
          <select 
            className="p-2 border-2 border-gray-300 rounded-full" 
            value={beat}
            onChange={(e) => setBeat(e.target.value)}
          >
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4">4/4</option>
          </select>
        </div>

        <div>
          <label className="mr-2">BPM:</label>
          <input 
            type="number" 
            className="w-16 py-2 bg-blue-100 rounded-md px-1" 
            value={bpm} 
            onChange={(e) => setBpm(parseInt(e.target.value))}
          />
        </div>

        <div>
          <label className="mr-2">Beat Columns:</label>
          <select 
            className="p-2 border-2 border-gray-300 rounded-full"
            value={columns}
            onChange={(e) => setColumns(parseInt(e.target.value))}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        <button 
          className="p-3 bg-blue-600 text-white rounded-lg cursor-pointer" 
          onClick={handleAddLine}
        >
          Add Line
        </button>

        <button 
          className="p-3 bg-green-600 text-white rounded-lg cursor-pointer" 
          onClick={exportToJson}
        >
          Export JSON
        </button>

        <button 
          className="p-3 bg-indigo-600 text-white rounded-lg cursor-pointer" 
          onClick={() => setShowImportModal(true)}
        >
          Import JSON
        </button>

        <button 
          className="p-3 bg-purple-600 text-white rounded-lg cursor-pointer" 
          onClick={saveCurrentSong}
        >
          Save Song
        </button>

        <button 
          className="p-3 bg-amber-600 text-white rounded-lg cursor-pointer" 
          onClick={() => setShowSavedSongsPanel(!showSavedSongsPanel)}
        >
          {showSavedSongsPanel ? "Hide Saved Songs" : "Show Saved Songs"}
        </button>
      </div>

      {/* Saved Songs Panel */}
      {showSavedSongsPanel && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Saved Songs</h3>
          {savedSongs.length === 0 ? (
            <p className="text-gray-500">No saved songs found.</p>
          ) : (
            <ul className="divide-y divide-gray-300">
              {savedSongs.map(song => (
                <li 
                  key={song.id} 
                  className="py-2 flex justify-between items-center cursor-pointer hover:bg-gray-200"
                  onClick={() => loadSavedSong(song.id)}
                >
                  <span className="font-medium">{song.title}</span>
                  <button 
                    onClick={(e) => deleteSavedSong(song.id, e)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="p-10 flex flex-col space-y-4">
        {songComposition.Song.map((line, lineIndex) => (
          <div className="flex px-10 space-x-4 items-center" key={lineIndex}>
            {line.map((column, columnIndex) => (
              <div 
                className="flex flex-col gap-2 border-r-2 px-2 relative group" 
                key={columnIndex}
              >
                <div className="flex gap-2 justify-between relative">
                  {column.column.map((box, boxIndex) => (
                    <input 
                      type="text" 
                      key={boxIndex}
                      value={box.notation[0].note}
                      onChange={(e) => updateLineNotation(
                        lineIndex, 
                        columnIndex, 
                        boxIndex, 
                        e.target.value
                      )}
                      onClick={(e) => trackActiveInput(
                        lineIndex, 
                        columnIndex, 
                        boxIndex,
                        e.currentTarget
                      )}
                      ref={(el) => {
                        // Initialize the nested array structure if needed
                        if (!inputRefs.current[lineIndex]) {
                          inputRefs.current[lineIndex] = [];
                        }
                        if (!inputRefs.current[lineIndex][columnIndex]) {
                          inputRefs.current[lineIndex][columnIndex] = [];
                        }
                        
                        // Store the ref
                        inputRefs.current[lineIndex][columnIndex][boxIndex] = el;
                      }}
                      className="py-3 text-sm border-b-2 w-10 text-center" 
                    />
                  ))}
                  <button 
                    onClick={() => clearColumn(lineIndex, columnIndex)}
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 text-white text-xs p-1 rounded"
                  >
                    Clear
                  </button>
                </div>
                <input 
                  type="text" 
                  value={column.lyrics}
                  onChange={(e) => updateLineLyrics(
                    lineIndex, 
                    columnIndex, 
                    e.target.value
                  )}
                  onContextMenu={(e) => handleLyricsContextMenu(e, lineIndex, columnIndex)}
                  onClick={(e) => {
                    handleLyricsSideClick(e, lineIndex, columnIndex);
                    trackActiveInput(lineIndex, columnIndex, undefined, null);
                  }}
                  className={`
                    py-3 text-sm bg-gray-100 focus:outline-blue-700 
                    ${column.lyricsWidth === '1/4' ? 'w-1/4' : 
                      column.lyricsWidth === '1/2' ? 'w-1/2' : 
                      column.lyricsWidth === '3/4' ? 'w-3/4' : 
                      'w-full'}
                    ${column.lyricsAlign === 'start' 
                      ? 'self-start' 
                      : column.lyricsAlign === 'end' 
                      ? 'self-end' 
                      : 'self-center'}
                    text-center
                  `}
                />
              </div>
            ))}
            <button 
              onClick={() => deleteLine(lineIndex)}
              className="bg-red-600 text-white p-2 rounded"
            >
              Delete Line
            </button>
          </div>
        ))}
      </div>

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xl">
            <h3 className="text-xl font-bold mb-4">Import Song JSON</h3>
            <textarea 
              className="w-full h-64 p-2 border-2 border-gray-300 rounded mb-4"
              placeholder="Paste your song JSON here..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
            ></textarea>
            {importError && (
              <p className="text-red-500 mb-4">{importError}</p>
            )}
            <div className="flex justify-end space-x-2">
              <button 
                className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => {
                  setShowImportModal(false);
                  setImportJsonText("");
                  setImportError("");
                }}
              >
                Cancel
              </button>
              <button 
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={importSongFromJson}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <NotationSidebar 
        onNotationSelect={handleNotationSelect} 
        isShiftHeld={isShiftHeld} 
      />
    </div>
  );
}