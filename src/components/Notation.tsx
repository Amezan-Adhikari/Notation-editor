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
  beat: string;
  columns: number;
  bpm: number;
  Song: ColumnData[][];
}

export default function Notation() {
  const [beat, setBeat] = useState("2/4");
  const [bpm, setBpm] = useState(180);
  const [columns, setColumns] = useState(4);
  const [songComposition, setSongComposition] = useState<SongComposition>({
    beat: "2/4",
    columns: 1,
    bpm: 180,
    Song: []
  });
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number | null>(null);
  const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);

  const WIDTH_CYCLE: ColumnData['lyricsWidth'][] = [undefined, '1/4', '1/2', '3/4', 'full'];

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
      beat,
      columns,
      bpm,
      Song: [...prev.Song, newLine]
    }));
  }

  function updateLineNotation(
    lineIndex: number, 
    columnIndex: number, 
    boxIndex: number, 
    value: string,
    appendMode: boolean = false
  ) {
    const updatedSong = [...songComposition.Song];
    const currentNote = updatedSong[lineIndex][columnIndex].column[boxIndex].notation[0].note;
    
    // If in append mode, add the new note to existing notes
    const newNote = appendMode 
      ? (currentNote ? `${currentNote} ${value}` : value)
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

  function handleNotationSelect(notation: string, appendMode: boolean = false) {
    if (activeLineIndex !== null && 
        activeColumnIndex !== null && 
        activeBoxIndex !== null) {
      updateLineNotation(
        activeLineIndex, 
        activeColumnIndex, 
        activeBoxIndex, 
        notation,
        appendMode
      );
    }
  }

  function trackActiveInput(
    lineIndex: number, 
    columnIndex: number, 
    boxIndex?: number
  ) {
    setActiveLineIndex(lineIndex);
    setActiveColumnIndex(columnIndex);
    if (boxIndex !== undefined) {
      setActiveBoxIndex(boxIndex);
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
  }

  function exportToJson() {
    const jsonData = JSON.stringify(songComposition, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'song_composition.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="md:px-20 px-5 relative">
      <h1 className="my-20 text-center text-3xl text-blue-900 font-bold">Notation Editor</h1>
      <div>
        <textarea placeholder="paste your lyrics here for easy copy paste" className="w-1/2 p-2  bg-gray-100" rows={7}></textarea>
      </div>

      <div className="flex items-center space-x-4 mb-6">
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
      </div>

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
                      onClick={() => trackActiveInput(lineIndex, columnIndex, boxIndex)}
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
                    trackActiveInput(lineIndex, columnIndex);
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

      <NotationSidebar onNotationSelect={handleNotationSelect} />
    </div>
  );
}