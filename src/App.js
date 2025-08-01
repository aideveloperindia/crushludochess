import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('blue');
  const [playerPoints, setPlayerPoints] = useState({
    blue: 0, red: 0, yellow: 0, green: 0
  });
  const [kingPositions, setKingPositions] = useState({
    blue: 1, red: 9, yellow: 17, green: 25
  });
  const [kingProgress, setKingProgress] = useState({
    blue: 0, red: 0, yellow: 0, green: 0
  });
  const [turn, setTurn] = useState(1);
  const [gamePhase, setGamePhase] = useState('playing');
  const [isCascading, setIsCascading] = useState(false);
  const [cascadeHighlights, setCascadeHighlights] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  // Initialize the game board
  useEffect(() => {
    initializeBoard();
  }, []);

  const initializeBoard = () => {
    const newBoard = [];
    const pieces = generateRandomPieces();
    
    console.log('Initializing board with', pieces.length, 'pieces');
    
    for (let row = 0; row < 8; row++) {
      const boardRow = [];
      for (let col = 0; col < 8; col++) {
        const pieceIndex = row * 8 + col;
        const piece = pieces[pieceIndex];
        
        if (!piece) {
          console.error(`ERROR: No piece at index ${pieceIndex} (row ${row}, col ${col})`);
        }
        
        boardRow.push(piece);
      }
      newBoard.push(boardRow);
    }
    
    console.log('Board initialized with', newBoard.flat().filter(p => p).length, 'pieces');
    setBoard(newBoard);
  };

  const generateRandomPieces = () => {
    const teams = ['blue', 'red', 'yellow', 'green'];
    const pieceTypes = ['king', 'queen', 'rook', 'rook', 'bishop', 'bishop', 'knight', 'knight', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'];
    
    const allPieces = [];
    
    teams.forEach(team => {
      pieceTypes.forEach(type => {
        allPieces.push({
          type: type,
          team: team,
          id: `${team}-${type}-${Math.random().toString(36).substr(2, 9)}`
        });
      });
    });
    
    // Ensure we have exactly 64 pieces
    console.log('Generated pieces count:', allPieces.length);
    
    // Shuffle pieces randomly
    for (let i = allPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPieces[i], allPieces[j]] = [allPieces[j], allPieces[i]];
    }
    
    // Double-check we have 64 pieces
    if (allPieces.length !== 64) {
      console.error('ERROR: Not enough pieces! Expected 64, got', allPieces.length);
    }
    
    return allPieces;
  };

  // Chess movement validation
  const isValidMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Check if destination is within board bounds
    if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
    
    // Check if destination has own piece
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.team === piece.team) return false;
    
    switch (piece.type) {
      case 'pawn':
        return isValidPawnMove(fromRow, fromCol, toRow, toCol, board, piece.team);
      case 'rook':
        return isValidRookMove(fromRow, fromCol, toRow, toCol, board);
      case 'bishop':
        return isValidBishopMove(fromRow, fromCol, toRow, toCol, board);
      case 'queen':
        return isValidQueenMove(fromRow, fromCol, toRow, toCol, board);
      case 'king':
        return isValidKingMove(fromRow, fromCol, toRow, toCol);
      case 'knight':
        return isValidKnightMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  };

  const isValidPawnMove = (fromRow, fromCol, toRow, toCol, board, team) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Team-specific forward direction
    let forwardDirection;
    switch (team) {
      case 'blue': forwardDirection = -1; break; // up
      case 'red': forwardDirection = -1; break; // left (but we'll handle this differently)
      case 'yellow': forwardDirection = 1; break; // down
      case 'green': forwardDirection = 1; break; // right (but we'll handle this differently)
      default: return false;
    }
    
    // For red and green, we need to handle horizontal movement
    if (team === 'red' || team === 'green') {
      const colDirection = team === 'red' ? -1 : 1;
      
      // Forward move (no capture)
      if (rowDiff === 0 && colDiff === colDirection && !board[toRow][toCol]) {
        return true;
      }
      
      // Capture move (diagonal)
      if (Math.abs(rowDiff) === 1 && colDiff === colDirection && board[toRow][toCol]) {
        return true;
      }
    } else {
      // Blue and Yellow move vertically
      // Forward move (no capture)
      if (colDiff === 0 && rowDiff === forwardDirection && !board[toRow][toCol]) {
        return true;
      }
      
      // Capture move (diagonal)
      if (Math.abs(colDiff) === 1 && rowDiff === forwardDirection && board[toRow][toCol]) {
        return true;
      }
    }
    
    return false;
  };

  const isValidRookMove = (fromRow, fromCol, toRow, toCol, board) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Rook moves in straight lines
    if (rowDiff !== 0 && colDiff !== 0) return false;
    
    const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const isValidBishopMove = (fromRow, fromCol, toRow, toCol, board) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Bishop moves diagonally
    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
    
    const rowStep = rowDiff / Math.abs(rowDiff);
    const colStep = colDiff / Math.abs(colDiff);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow && currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const isValidQueenMove = (fromRow, fromCol, toRow, toCol, board) => {
    return isValidRookMove(fromRow, fromCol, toRow, toCol, board) || 
           isValidBishopMove(fromRow, fromCol, toRow, toCol, board);
  };

  const isValidKingMove = (fromRow, fromCol, toRow, toCol) => {
    return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
  };

  const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  const getPieceValue = (pieceType) => {
    const values = {
      'queen': 6,
      'rook': 5,
      'bishop': 4,
      'knight': 3,
      'pawn': 2,
      'king': 1
    };
    return values[pieceType] || 1;
  };

  const getNextPlayer = (currentPlayer) => {
    const players = ['blue', 'red', 'yellow', 'green'];
    const currentIndex = players.indexOf(currentPlayer);
    return players[(currentIndex + 1) % 4];
  };

  const applyTeamSpecificGravity = (board, capturingTeam) => {
    const newBoard = board.map(row => [...row]);
    
    // Team-specific gravity directions
    const gravityDirections = {
      'blue': { row: 1, col: 0 }, // down
      'red': { row: 0, col: 1 }, // right
      'yellow': { row: -1, col: 0 }, // up
      'green': { row: 0, col: -1 } // left
    };
    
    const direction = gravityDirections[capturingTeam];
    
    // Apply gravity
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (newBoard[row][col]) {
          const newRow = row + direction.row;
          const newCol = col + direction.col;
          
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !newBoard[newRow][newCol]) {
            newBoard[newRow][newCol] = newBoard[row][col];
            newBoard[row][col] = null;
          }
        }
      }
    }
    
    return newBoard;
  };

  const spawnPawnsFromOppositeSide = (board, capturingTeam) => {
    const newBoard = board.map(row => [...row]);
    
    // Find empty squares on the opposite side
    const oppositeSide = {
      'blue': { row: 7, col: 0 }, // bottom row
      'red': { row: 0, col: 7 }, // right column
      'yellow': { row: 0, col: 0 }, // top row
      'green': { row: 0, col: 0 } // left column
    };
    
    const side = oppositeSide[capturingTeam];
    const pawnsToSpawn = 3; // Spawn 3 pawns
    
    for (let i = 0; i < pawnsToSpawn; i++) {
      let spawnRow, spawnCol;
      
      if (capturingTeam === 'blue' || capturingTeam === 'yellow') {
        // Spawn on top or bottom row
        spawnRow = side.row;
        spawnCol = i;
      } else {
        // Spawn on left or right column
        spawnRow = i;
        spawnCol = side.col;
      }
      
      if (spawnRow < 8 && spawnCol < 8 && !newBoard[spawnRow][spawnCol]) {
        newBoard[spawnRow][spawnCol] = {
          type: 'pawn',
          team: capturingTeam,
          id: `${capturingTeam}-pawn-${Math.random().toString(36).substr(2, 9)}`
        };
      }
    }
    
    return newBoard;
  };

  const performSingleAutoCapture = (board, nextPlayer) => {
    const newBoard = board.map(row => [...row]);
    let captured = false;
    
    // Priority order: Pawn > Knight > Bishop > Rook > Queen
    const priorityOrder = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
    
    for (const pieceType of priorityOrder) {
      if (captured) break;
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = newBoard[row][col];
          if (piece && piece.type === pieceType && piece.team === nextPlayer) {
            // Check if this piece can capture any enemy piece
            for (let targetRow = 0; targetRow < 8; targetRow++) {
              for (let targetCol = 0; targetCol < 8; targetCol++) {
                const targetPiece = newBoard[targetRow][targetCol];
                if (targetPiece && targetPiece.team !== nextPlayer) {
                  if (isValidMove(piece, row, col, targetRow, targetCol, newBoard)) {
                    // Perform auto-capture
                    newBoard[targetRow][targetCol] = piece;
                    newBoard[row][col] = null;
                    captured = true;
                    break;
                  }
                }
              }
              if (captured) break;
            }
          }
        }
      }
    }
    
    return newBoard;
  };

  const getCascadeHighlights = (board, capturingTeam) => {
    const highlights = [];
    
    // Find squares that will be affected by gravity
    const gravityDirections = {
      'blue': { row: 1, col: 0 },
      'red': { row: 0, col: 1 },
      'yellow': { row: -1, col: 0 },
      'green': { row: 0, col: -1 }
    };
    
    const direction = gravityDirections[capturingTeam];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col]) {
          const newRow = row + direction.row;
          const newCol = col + direction.col;
          
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !board[newRow][newCol]) {
            highlights.push({ row: newRow, col: newCol, type: 'gravity' });
            highlights.push({ row: row, col: col, type: 'moving' });
          }
        }
      }
    }
    
    return highlights;
  };

  const performCascade = async (board, capturingTeam) => {
    setIsCascading(true);
    
    // Get cascade highlights
    const highlights = getCascadeHighlights(board, capturingTeam);
    setCascadeHighlights(highlights);
    
    // Wait to show highlights
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Apply gravity
    let newBoard = applyTeamSpecificGravity(board, capturingTeam);
    setBoard(newBoard);
    
    // Wait between cascade steps
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Spawn pawns
    newBoard = spawnPawnsFromOppositeSide(newBoard, capturingTeam);
    setBoard(newBoard);
    
    // Wait between cascade steps
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Perform single auto-capture by next player
    const nextPlayer = getNextPlayer(capturingTeam);
    newBoard = performSingleAutoCapture(newBoard, nextPlayer);
    setBoard(newBoard);
    
    // Clear highlights and finish cascading
    setCascadeHighlights([]);
    setIsCascading(false);
  };

  const handleSquareClick = (row, col) => {
    if (isCascading) return;
    
    if (!selectedPiece) {
      // Select piece if it belongs to current player
      const piece = board[row][col];
      if (piece && piece.team === currentPlayer) {
        setSelectedPiece({ row, col, piece });
        // Calculate valid moves for this piece
        calculateValidMoves(piece, row, col);
      }
    } else {
      // Check if the clicked square is a valid move
      const isValidMove = validMoves.some(move => move.row === row && move.col === col);
      
      if (isValidMove) {
        // Move piece
        performMove(selectedPiece.row, selectedPiece.col, row, col);
        setSelectedPiece(null);
        setValidMoves([]);
      } else {
        // Try to select a different piece
        const piece = board[row][col];
        if (piece && piece.team === currentPlayer) {
          setSelectedPiece({ row, col, piece });
          calculateValidMoves(piece, row, col);
        } else {
          setSelectedPiece(null);
          setValidMoves([]);
        }
      }
    }
  };

  const calculateValidMoves = (piece, fromRow, fromCol) => {
    const moves = [];
    
    // Check all possible destinations
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (isValidMove(piece, fromRow, fromCol, toRow, toCol, board)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    
    setValidMoves(moves);
  };

  const performMove = async (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    if (!piece || piece.team !== currentPlayer) return;
    
    const newBoard = board.map(row => [...row]);
    const targetPiece = newBoard[toRow][toCol];
    
    // Handle capture
    if (targetPiece && targetPiece.team !== currentPlayer) {
      const points = getPieceValue(targetPiece.type);
      
      // Update points and king progress
      setPlayerPoints(prev => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + points
      }));
      
      setKingProgress(prev => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + points
      }));
      
      // Update king position based on progress
      const newProgress = kingProgress[currentPlayer] + points;
      
      // Calculate king position based on team's path
      let newKingPosition;
      if (currentPlayer === 'blue') {
        newKingPosition = Math.min(8, newProgress + 1); // Blue: 1-8
      } else if (currentPlayer === 'red') {
        newKingPosition = Math.min(16, 9 + newProgress); // Red: 9-16
      } else if (currentPlayer === 'yellow') {
        newKingPosition = Math.min(24, 17 + newProgress); // Yellow: 17-24
      } else if (currentPlayer === 'green') {
        newKingPosition = Math.min(32, 25 + newProgress); // Green: 25-32
      }
      
      // Update both king progress and position
      setKingProgress(prev => ({
        ...prev,
        [currentPlayer]: newProgress
      }));
      
      setKingPositions(prev => ({
        ...prev,
        [currentPlayer]: newKingPosition
      }));
      
      // Check for victory (40 moves to complete the path)
      if (newProgress >= 40) {
        setGamePhase('finished');
        return;
      }
    }
    
    // Move piece
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    setBoard(newBoard);
    
    // Start cascading after a short delay
    if (targetPiece && targetPiece.team !== currentPlayer) {
      setTimeout(() => {
        setIsCascading(true);
        performCascade(newBoard, currentPlayer);
      }, 300);
    }
    
    // Next player's turn
    setCurrentPlayer(getNextPlayer(currentPlayer));
    setTurn(prev => prev + 1);
  };

  const getPieceSymbol = (type) => {
    const symbols = {
      'king': '♔',
      'queen': '♕',
      'rook': '♖',
      'bishop': '♗',
      'knight': '♘',
      'pawn': '♙'
    };
    return symbols[type] || '?';
  };

  const getTeamColor = (team) => {
    const colors = {
      'blue': '#0066cc',
      'red': '#cc0000',
      'yellow': '#ccaa00',
      'green': '#00aa00'
    };
    return colors[team] || '#000000';
  };

  const getKingPathPosition = (team, index) => {
    // Each team has 8 positions on their path
    // Blue: 1-8, Red: 9-16, Yellow: 17-24, Green: 25-32
    const positions = {
      'blue': { start: 1, end: 8 },
      'red': { start: 9, end: 16 },
      'yellow': { start: 17, end: 24 },
      'green': { start: 25, end: 32 }
    };
    
    const pos = positions[team];
    if (team === 'blue') {
      return pos.start + index; // 1, 2, 3, 4, 5, 6, 7, 8
    } else if (team === 'red') {
      return pos.start + index; // 9, 10, 11, 12, 13, 14, 15, 16
    } else if (team === 'yellow') {
      return pos.start + index; // 17, 18, 19, 20, 21, 22, 23, 24
    } else if (team === 'green') {
      return pos.start + index; // 25, 26, 27, 28, 29, 30, 31, 32
    }
    return index + 1;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 CRUSHLUDOCHESS</h1>
        <p>The Ultimate 4-Player Chess-Puzzle Hybrid</p>
        {isCascading && <div className="cascading-indicator">🔄 Cascading...</div>}
      </header>
      
      <main className="game-container">
                 {/* King Paths */}
         <div className="king-paths">
           {/* Blue King Path (Left) */}
           <div className="king-path-left">
             {Array.from({ length: 8 }, (_, i) => {
               const pathNumber = getKingPathPosition('blue', i);
               const isKingPresent = kingPositions.blue === pathNumber;
               return (
                 <div key={i} className={`king-path-square ${isKingPresent ? 'king-present' : ''}`}>
                   {isKingPresent && <div className="king-piece blue">♔</div>}
                   <span className="path-number">{pathNumber}</span>
                 </div>
               );
             })}
           </div>
           
           {/* Yellow King Path (Top) */}
           <div className="king-path-top">
             {Array.from({ length: 8 }, (_, i) => {
               const pathNumber = getKingPathPosition('yellow', i);
               const isKingPresent = kingPositions.yellow === pathNumber;
               return (
                 <div key={i} className={`king-path-square ${isKingPresent ? 'king-present' : ''}`}>
                   {isKingPresent && <div className="king-piece yellow">♔</div>}
                   <span className="path-number">{pathNumber}</span>
                 </div>
               );
             })}
           </div>
           
           {/* Red King Path (Right) */}
           <div className="king-path-right">
             {Array.from({ length: 8 }, (_, i) => {
               const pathNumber = getKingPathPosition('red', i);
               const isKingPresent = kingPositions.red === pathNumber;
               return (
                 <div key={i} className={`king-path-square ${isKingPresent ? 'king-present' : ''}`}>
                   {isKingPresent && <div className="king-piece red">♔</div>}
                   <span className="path-number">{pathNumber}</span>
                 </div>
               );
             })}
           </div>
           
           {/* Green King Path (Bottom) */}
           <div className="king-path-bottom">
             {Array.from({ length: 8 }, (_, i) => {
               const pathNumber = getKingPathPosition('green', i);
               const isKingPresent = kingPositions.green === pathNumber;
               return (
                 <div key={i} className={`king-path-square ${isKingPresent ? 'king-present' : ''}`}>
                   {isKingPresent && <div className="king-piece green">♔</div>}
                   <span className="path-number">{pathNumber}</span>
                 </div>
               );
             })}
           </div>
         </div>
        
        {/* Main Chess Board */}
        <div className="chess-board">
          <div className="board-grid">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((piece, colIndex) => {
                  const isLightSquare = (rowIndex + colIndex) % 2 === 0;
                  const isHighlighted = cascadeHighlights.some(h => h.row === rowIndex && h.col === colIndex);
                  const isSelected = selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex;
                  const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex);
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`board-square ${isLightSquare ? 'light' : 'dark'} ${isHighlighted ? 'cascade-highlight' : ''} ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''}`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <div 
                          className="chess-piece"
                          style={{ 
                            color: getTeamColor(piece.team),
                            borderColor: piece.team === currentPlayer ? '#ffff00' : 'transparent'
                          }}
                        >
                          {getPieceSymbol(piece.type)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Player Stats */}
        <div className="player-stats">
          {Object.entries(playerPoints).map(([team, points]) => (
            <div key={team} className={`player-stat ${team} ${team === currentPlayer ? 'current' : ''}`}>
              <div className="player-header">
                <div className="player-color" style={{ backgroundColor: getTeamColor(team) }}></div>
                <span className="player-name">{team.toUpperCase()}</span>
              </div>
              <div className="player-info">
                <div className="points">Points: {points}</div>
                <div className="king-progress">King: {kingPositions[team]}/32</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(kingProgress[team] / 40) * 100}%`,
                      backgroundColor: getTeamColor(team)
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Game Info */}
      <div className="game-info">
        <div className="turn-info">
          <span>Turn: {turn}</span>
          <span>Current Player: <span style={{ color: getTeamColor(currentPlayer) }}>{currentPlayer.toUpperCase()}</span></span>
        </div>
      </div>
      
      {gamePhase === 'finished' && (
        <div className="victory-modal">
          <h2>🎉 Victory!</h2>
          <p>Team {currentPlayer} has won!</p>
          <button onClick={initializeBoard}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default App; 