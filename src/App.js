import React, { useState, useEffect } from 'react';
import './App.css';
import GameInfo from './components/GameInfo';
import GameModeSelection from './components/GameModeSelection';

// Piece types and their values
const PIECE_VALUES = {
  'queen': 6,
  'rook': 5,
  'bishop': 4,
  'knight': 3,
  'pawn': 2, // First pawn capture = 2 points
  'king': 0 // Kings don't have capture value
};

// Team colors and positions
const TEAMS = ['blue', 'red', 'yellow', 'green'];
const TEAM_COLORS = ['#0066cc', '#cc0000', '#ccaa00', '#00aa00'];

function App() {
  // Game flow states
  const [appPhase, setAppPhase] = useState('mode-selection'); // 'mode-selection', 'game'
  const [selectedGameMode, setSelectedGameMode] = useState(null);
  
  // Game states
  const [board, setBoard] = useState([]);
  const [kingPositions, setKingPositions] = useState([0, 8, 16, 24]); // B1, B9, B17, B25
  const [cascadeHighlights, setCascadeHighlights] = useState([]); // For showing cascade boxes
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [playerPoints, setPlayerPoints] = useState([0, 0, 0, 0]);
  const [kingProgress, setKingProgress] = useState([0, 0, 0, 0]);
  const [pawnCaptures, setPawnCaptures] = useState([0, 0, 0, 0]); // Track pawn captures per player
  const [gamePhase, setGamePhase] = useState('setup');
  const [turnNumber, setTurnNumber] = useState(1);
  const [isCascading, setIsCascading] = useState(false);

  // Initialize the game board when game starts
  useEffect(() => {
    if (appPhase === 'game') {
      initializeBoard();
    }
  }, [appPhase]);

  const initializeBoard = () => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Create all pieces for each team (excluding kings - they're on outer path)
    const allPieces = [];
    TEAMS.forEach((team, teamIndex) => {
      // Each team gets: 1 Queen, 2 Rooks, 2 Bishops, 2 Knights, 9 Pawns (no kings on main board)
      // We add 1 extra pawn per team to compensate for removing 4 kings (60 pieces total)
      const teamPieces = [
        { type: 'queen', team, teamIndex },
        { type: 'rook', team, teamIndex },
        { type: 'rook', team, teamIndex },
        { type: 'bishop', team, teamIndex },
        { type: 'bishop', team, teamIndex },
        { type: 'knight', team, teamIndex },
        { type: 'knight', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex },
        { type: 'pawn', team, teamIndex } // Extra pawn to compensate for king removal
      ];
      allPieces.push(...teamPieces);
    });

    // Fill the board with 60 pieces (4 empty squares)
    const shuffledPieces = allPieces.sort(() => Math.random() - 0.5);
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pieceIndex = row * 8 + col;
        if (pieceIndex < shuffledPieces.length) {
          newBoard[row][col] = shuffledPieces[pieceIndex];
        }
        // Last 4 squares remain empty (60 pieces total)
      }
    }

    setBoard(newBoard);
    // Set kings at their starting positions: Blue=B1, Red=B9, Yellow=B17, Green=B25
    setKingPositions([0, 8, 16, 24]); // B1, B9, B17, B25
    setKingProgress([0, 0, 0, 0]); // Initialize progress to 0 (not position)
    setPlayerPoints([0, 0, 0, 0]);
    setPawnCaptures([0, 0, 0, 0]);
    setCurrentPlayer(0); // Always start with Blue player (index 0)
    setTurnNumber(1);
    setGamePhase('playing');
  };

  // NEW PAWN MOVEMENT LOGIC
  const isValidPawnMove = (fromRow, fromCol, toRow, toCol, piece) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Team-specific pawn movement directions
    let forwardDirection;
    
    switch (piece.teamIndex) {
      case 0: // Blue - move upward towards Yellow
        forwardDirection = { row: -1, col: 0 };
        break;
      case 1: // Red - move leftward towards Green
        forwardDirection = { row: 0, col: -1 };
        break;
      case 2: // Yellow - move downward towards Blue
        forwardDirection = { row: 1, col: 0 };
        break;
      case 3: // Green - move rightward towards Red
        forwardDirection = { row: 0, col: 1 };
        break;
      default:
        return false;
    }
    
    // Forward move (no capture)
    if (rowDiff === forwardDirection.row && colDiff === forwardDirection.col && !board[toRow][toCol]) {
      return true;
    }
    
    // Diagonal capture (in forward direction)
    const diagonalMoves = [];
    if (forwardDirection.row !== 0) {
      // Vertical movement - diagonal is horizontal
      diagonalMoves.push({ row: forwardDirection.row, col: -1 });
      diagonalMoves.push({ row: forwardDirection.row, col: 1 });
    } else {
      // Horizontal movement - diagonal is vertical
      diagonalMoves.push({ row: -1, col: forwardDirection.col });
      diagonalMoves.push({ row: 1, col: forwardDirection.col });
    }
    
    for (const diagonal of diagonalMoves) {
      if (rowDiff === diagonal.row && colDiff === diagonal.col && board[toRow][toCol]) {
        return true;
      }
    }
    
    return false;
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol, piece) => {
    if (!piece) return false;
    
    // Can only move own pieces
    if (piece.teamIndex !== currentPlayer) return false;
    
    // Can't move to same position
    if (fromRow === toRow && fromCol === toCol) return false;
    
    // Can't capture own pieces
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.teamIndex === currentPlayer) return false;

    // Implement chess movement rules based on piece type
    switch (piece.type) {
      case 'pawn':
        return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
      case 'rook':
        return isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'bishop':
        return isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'queen':
        return isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'knight':
        return isValidKnightMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  };

  const isValidRookMove = (fromRow, fromCol, toRow, toCol) => {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
    // Check if path is clear
    const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const isValidBishopMove = (fromRow, fromCol, toRow, toCol) => {
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
    
    const rowStep = (toRow - fromRow) / Math.abs(toRow - fromRow);
    const colStep = (toCol - fromCol) / Math.abs(toCol - fromCol);
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow && currentCol !== toCol) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const isValidQueenMove = (fromRow, fromCol, toRow, toCol) => {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
  };

  const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };

  // NEW CASCADING LOGIC
  const performCascade = async (currentBoard, capturingPlayer) => {
    let newBoard = currentBoard.map(row => [...row]);
    let hasChanges = true;
    let iterations = 0;
    
    console.log(`Starting cascade for ${TEAMS[capturingPlayer]} player...`);
    
    while (hasChanges && iterations < 10) {
      hasChanges = false;
      iterations++;
      
      // Show cascade highlights before each step
      const highlights = getCascadeHighlights(newBoard, capturingPlayer);
      setCascadeHighlights(highlights);
      
      // Wait to show highlights
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 1. TEAM-SPECIFIC GRAVITY
      hasChanges = applyTeamSpecificGravity(newBoard, capturingPlayer) || hasChanges;
      
      // 2. PAWN SPAWNING from opposite side
      hasChanges = spawnPawnsFromOppositeSide(newBoard, capturingPlayer) || hasChanges;
      
      // 3. SINGLE AUTO-CAPTURE by next player
      const nextPlayer = (capturingPlayer + 1) % 4;
      const autoCaptureHappened = performSingleAutoCapture(newBoard, nextPlayer);
      hasChanges = autoCaptureHappened || hasChanges;
      
      // Update board state
      setBoard([...newBoard]);
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Cascade completed in ${iterations} iterations`);
    setCascadeHighlights([]); // Clear highlights
    setIsCascading(false);
    nextTurn();
  };

  const applyTeamSpecificGravity = (board, capturingPlayer) => {
    let hasChanges = false;
    
    switch (capturingPlayer) {
      case 0: // Blue - pieces fall downward
        for (let col = 0; col < 8; col++) {
          for (let row = 7; row > 0; row--) {
            if (!board[row][col] && board[row - 1][col]) {
              board[row][col] = board[row - 1][col];
              board[row - 1][col] = null;
              hasChanges = true;
            }
          }
        }
        break;
      case 1: // Red - pieces fall rightward
        for (let row = 0; row < 8; row++) {
          for (let col = 7; col > 0; col--) {
            if (!board[row][col] && board[row][col - 1]) {
              board[row][col] = board[row][col - 1];
              board[row][col - 1] = null;
              hasChanges = true;
            }
          }
        }
        break;
      case 2: // Yellow - pieces fall upward
        for (let col = 0; col < 8; col++) {
          for (let row = 0; row < 7; row++) {
            if (!board[row][col] && board[row + 1][col]) {
              board[row][col] = board[row + 1][col];
              board[row + 1][col] = null;
              hasChanges = true;
            }
          }
        }
        break;
      case 3: // Green - pieces fall leftward
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 7; col++) {
            if (!board[row][col] && board[row][col + 1]) {
              board[row][col] = board[row][col + 1];
              board[row][col + 1] = null;
              hasChanges = true;
            }
          }
        }
        break;
    }
    
    return hasChanges;
  };

  const spawnPawnsFromOppositeSide = (board, capturingPlayer) => {
    let hasChanges = false;
    
    switch (capturingPlayer) {
      case 0: // Blue captures - pawns spawn from TOP
        for (let col = 0; col < 8; col++) {
          if (!board[0][col]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[0][col] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
      case 1: // Red captures - pawns spawn from LEFT
        for (let row = 0; row < 8; row++) {
          if (!board[row][0]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[row][0] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
      case 2: // Yellow captures - pawns spawn from BOTTOM
        for (let col = 0; col < 8; col++) {
          if (!board[7][col]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[7][col] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
      case 3: // Green captures - pawns spawn from RIGHT
        for (let row = 0; row < 8; row++) {
          if (!board[row][7]) {
            const randomTeam = Math.floor(Math.random() * 4);
            board[row][7] = { type: 'pawn', team: TEAMS[randomTeam], teamIndex: randomTeam };
            hasChanges = true;
          }
        }
        break;
    }
    
    return hasChanges;
  };

  const getCascadeHighlights = (board, capturingPlayer) => {
    const highlights = [];
    
    // Find empty spaces that will be filled by gravity
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!board[row][col]) {
          // Check if this empty space will be filled by gravity
          let willBeFilled = false;
          
          switch (capturingPlayer) {
            case 0: // Blue - check if piece above will fall down
              if (row > 0 && board[row - 1][col]) willBeFilled = true;
              break;
            case 1: // Red - check if piece to left will fall right
              if (col > 0 && board[row][col - 1]) willBeFilled = true;
              break;
            case 2: // Yellow - check if piece below will fall up
              if (row < 7 && board[row + 1][col]) willBeFilled = true;
              break;
            case 3: // Green - check if piece to right will fall left
              if (col < 7 && board[row][col + 1]) willBeFilled = true;
              break;
          }
          
          if (willBeFilled) {
            highlights.push({ row, col, type: 'gravity' });
          }
        }
      }
    }
    
    // Find pawn spawning positions
    switch (capturingPlayer) {
      case 0: // Blue captures - pawns spawn from TOP
        for (let col = 0; col < 8; col++) {
          if (!board[0][col]) {
            highlights.push({ row: 0, col, type: 'spawn' });
          }
        }
        break;
      case 1: // Red captures - pawns spawn from LEFT
        for (let row = 0; row < 8; row++) {
          if (!board[row][0]) {
            highlights.push({ row, col: 0, type: 'spawn' });
          }
        }
        break;
      case 2: // Yellow captures - pawns spawn from BOTTOM
        for (let col = 0; col < 8; col++) {
          if (!board[7][col]) {
            highlights.push({ row: 7, col, type: 'spawn' });
          }
        }
        break;
      case 3: // Green captures - pawns spawn from RIGHT
        for (let row = 0; row < 8; row++) {
          if (!board[row][7]) {
            highlights.push({ row, col: 7, type: 'spawn' });
          }
        }
        break;
    }
    
    return highlights;
  };

  const performSingleAutoCapture = (board, nextPlayer) => {
    // Find all pieces that can be captured by next player
    const captureOpportunities = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const targetPiece = board[row][col];
        if (targetPiece && targetPiece.teamIndex !== nextPlayer) {
          // Check if any of next player's pieces can capture this
          for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
              const attackingPiece = board[fromRow][fromCol];
              if (attackingPiece && attackingPiece.teamIndex === nextPlayer) {
                if (isValidMove(fromRow, fromCol, row, col, attackingPiece)) {
                  captureOpportunities.push({
                    fromRow, fromCol, toRow: row, toCol: col,
                    attackingPiece, targetPiece
                  });
                }
              }
            }
          }
        }
      }
    }
    
    if (captureOpportunities.length === 0) return false;
    
    // Find the capture with highest priority piece
    const priorityOrder = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
    let bestCapture = captureOpportunities[0];
    
    for (const capture of captureOpportunities) {
      const currentPriority = priorityOrder.indexOf(capture.attackingPiece.type);
      const bestPriority = priorityOrder.indexOf(bestCapture.attackingPiece.type);
      if (currentPriority < bestPriority) {
        bestCapture = capture;
      }
    }
    
    // Perform the single auto-capture
    board[bestCapture.toRow][bestCapture.toCol] = bestCapture.attackingPiece;
    board[bestCapture.fromRow][bestCapture.fromCol] = null;
    
    // Update points for next player
    const points = getCapturePoints(bestCapture.targetPiece.type, nextPlayer);
    const newPoints = [...playerPoints];
    newPoints[nextPlayer] += points;
    setPlayerPoints(newPoints);
    
    // Update pawn capture count if it's a pawn
    if (bestCapture.targetPiece.type === 'pawn') {
      const newPawnCaptures = [...pawnCaptures];
      newPawnCaptures[nextPlayer]++;
      setPawnCaptures(newPawnCaptures);
    }
    
    // Move king based on points earned from auto-capture
    const victoryAchieved = moveKingBasedOnPoints(nextPlayer, points);
    
    console.log(`Auto-capture: ${bestCapture.attackingPiece.type} captured ${bestCapture.targetPiece.type}, ${TEAMS[nextPlayer]} king moved`);
    
    return true;
  };

  const handlePieceMove = (fromRow, fromCol, toRow, toCol) => {
    if (isCascading) return;
    
    const piece = board[fromRow][fromCol];
    if (!isValidMove(fromRow, fromCol, toRow, toCol, piece)) return;

    const newBoard = board.map(row => [...row]);
    const capturedPiece = newBoard[toRow][toCol];
    
    // Move piece
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    // Handle capture
    if (capturedPiece) {
      const points = getCapturePoints(capturedPiece.type, currentPlayer);
      console.log(`Capture! ${TEAMS[currentPlayer]} captured ${capturedPiece.type} worth ${points} points`);
      
      const newPoints = [...playerPoints];
      newPoints[currentPlayer] += points;
      setPlayerPoints(newPoints);
      
      // Update pawn capture count if it's a pawn
      if (capturedPiece.type === 'pawn') {
        const newPawnCaptures = [...pawnCaptures];
        newPawnCaptures[currentPlayer]++;
        setPawnCaptures(newPawnCaptures);
        console.log(`Pawn captures for ${TEAMS[currentPlayer]}: ${newPawnCaptures[currentPlayer]}`);
      }
      
      console.log(`Updated player points:`, newPoints);
      console.log(`Current king positions before move:`, kingPositions);
      
      // Move king immediately based on points earned
      const victoryAchieved = moveKingBasedOnPoints(currentPlayer, points);
      
      if (victoryAchieved) {
        setBoard(newBoard);
        return; // Game ends
      }
      
      // Reset points for this player after king has moved
      newPoints[currentPlayer] = 0;
      setPlayerPoints(newPoints);
      
      // Update board first, then trigger cascading
      setBoard(newBoard);
      
      // Trigger cascading after a short delay
      setTimeout(() => {
        setIsCascading(true);
        performCascade(newBoard, currentPlayer);
      }, 300);
    } else {
      setBoard(newBoard);
      nextTurn();
    }
  };

  // NEW FUNCTION: Move king step by step like Ludo
  const moveKingStepByStep = (playerIndex, startPosition, endPosition, finalProgress) => {
    // Calculate the actual path the king should take
    const path = [];
    let currentPos = startPosition;
    let currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
    
    // Build the path step by step
    while (currentPos !== endPosition && currentProgress < finalProgress) {
      let nextPos;
      
      if (currentProgress < 31) {
        // Still in full round - move forward on 32-box path
        nextPos = (currentPos + 1) % 32;
      } else if (currentProgress === 31) {
        // Transition from 32-box path to home stretch (Box 1)
        nextPos = 1; // Box 1 (position 1)
      } else {
        // In home stretch - move towards home position
        const homeStretchMoves = currentProgress - 31;
        nextPos = homeStretchMoves + 1; // Box 1 (position 1), Box 2 (position 2), etc.
      }
      
      path.push(nextPos);
      currentPos = nextPos;
      currentProgress = calculateProgressFromPosition(playerIndex, currentPos);
      
      // Safety check to prevent infinite loop
      if (path.length > 50) break;
    }
    
    let currentStep = 0;
    
    const moveOneStep = () => {
      if (currentStep < path.length) {
        // Move to next position in path
        const newKingPositions = [...kingPositions];
        newKingPositions[playerIndex] = path[currentStep];
        setKingPositions(newKingPositions);
        
        currentStep++;
        
        // Continue to next step after a short delay
        setTimeout(moveOneStep, 300); // 300ms delay between steps
      } else {
        // Final step - set to exact target position and progress
        const newKingPositions = [...kingPositions];
        const newKingProgress = [...kingProgress];
        
        newKingPositions[playerIndex] = endPosition;
        newKingProgress[playerIndex] = finalProgress;
        
        setKingPositions(newKingPositions);
        setKingProgress(newKingProgress);
        
        // Check for victory
        if (finalProgress >= 40) {
          setGamePhase('victory');
        }
      }
    };
    
    // Start the step-by-step movement
    moveOneStep();
  };

  // Helper function to calculate progress from position
  const calculateProgressFromPosition = (playerIndex, position) => {
    const startingPosition = getKingStartingPosition(playerIndex);
    const homePosition = getKingHomePosition(playerIndex);
    
    if (position >= homePosition) {
      // In home stretch
      return 32 + (position - homePosition);
    } else {
      // In full round
      if (position >= startingPosition) {
        return position - startingPosition;
      } else {
        // Wrapped around
        return (32 - startingPosition) + position;
      }
    }
  };

  // FIXED: Hard coded king movement logic
  const moveKingBasedOnPoints = (playerIndex, pointsEarned) => {
    console.log(`Moving king for ${TEAMS[playerIndex]}, points earned: ${pointsEarned}`);
    
    const newKingPositions = [...kingPositions];
    const newKingProgress = [...kingProgress];
    
    // LUDO-STYLE KING MOVEMENT: Points = Steps
    const stepsToMove = pointsEarned;
    
    console.log(`Steps to move: ${stepsToMove}`);
    
    if (stepsToMove > 0) {
      const currentPosition = kingPositions[playerIndex];
      const startingPosition = getKingStartingPosition(playerIndex);
      const homePosition = getKingHomePosition(playerIndex);
      
      // Calculate new progress (total moves made)
      const newProgress = newKingProgress[playerIndex] + stepsToMove;
      
      let newPosition;
      
      if (newProgress < 32) {
        // Still in full round phase (0-31 moves)
        // Calculate position on the 32-box path
        newPosition = (startingPosition + newProgress) % 32;
      } else if (newProgress < 40) {
        // Home stretch phase (32-39 moves)
        // After 32 boxes, continue from Box 1 onwards
        const homeStretchMoves = newProgress - 32;
        newPosition = homeStretchMoves + 1; // Box 1 (position 1), Box 2 (position 2), etc.
      } else {
        // Victory! (40 moves)
        newPosition = homePosition;
      }
      
      console.log(`King moving from position ${currentPosition} to ${newPosition}, progress: ${newProgress}`);
      
      // Check if new position conflicts with another king
      const conflictingKing = newKingPositions.findIndex((pos, index) => 
        index !== playerIndex && pos === newPosition
      );
      
      if (conflictingKing !== -1) {
        // King collision! ONLY the ARRIVING king gets killed and respawns at starting position
        console.log(`King collision! ${TEAMS[playerIndex]} king killed by ${TEAMS[conflictingKing]} king`);
        newKingPositions[playerIndex] = startingPosition;
        newKingProgress[playerIndex] = 0; // Reset progress when killed
      } else {
        // Safe move - move step by step
        moveKingStepByStep(playerIndex, currentPosition, newPosition, newProgress);
        return false; // Don't continue with normal flow
      }
    }
    
    setKingPositions(newKingPositions);
    setKingProgress(newKingProgress);
    
    console.log(`Updated king positions:`, newKingPositions);
    console.log(`Updated king progress:`, newKingProgress);
    
    // Check for victory (40 total moves: 32 full round + 8 home stretch)
    if (newKingProgress[playerIndex] >= 40) {
      setGamePhase('victory');
      return true; // Victory achieved
    }
    
    return false; // No victory
  };

  const nextTurn = () => {
    // Don't reset points here - they should accumulate for king movement
    // Points will be reset when the king actually moves
    
    setCurrentPlayer((prev) => (prev + 1) % 4);
    setTurnNumber(prev => prev + 1);
    setSelectedPiece(null);
  };

  const handleSquareClick = (row, col) => {
    if (isCascading) return;
    
    const piece = board[row][col];
    
    if (selectedPiece) {
      // Attempt to move
      handlePieceMove(selectedPiece.row, selectedPiece.col, row, col);
    } else if (piece && piece.teamIndex === currentPlayer) {
      // Select piece
      setSelectedPiece({ row, col, piece });
    }
  };

  const getPieceSymbol = (piece) => {
    const symbols = {
      'king': '♔',
      'queen': '♕',
      'rook': '♖',
      'bishop': '♗',
      'knight': '♘',
      'pawn': '♙'
    };
    return symbols[piece.type] || '?';
  };

  // Calculate points for captured piece (Ludo-style)
  const getCapturePoints = (pieceType, playerIndex) => {
    if (pieceType === 'pawn') {
      // First pawn capture = 2 points, subsequent = 1 point
      return pawnCaptures[playerIndex] === 0 ? 2 : 1;
    } else {
      // Other pieces: Queen=6, Rook=5, Bishop=4, Knight=3
      return PIECE_VALUES[pieceType] || 0;
    }
  };

  // PIECE ROTATION LOGIC - All pieces face current player's direction
  const getPieceRotation = (pieceTeamIndex, currentPlayerIndex) => {
    // All pieces rotate to face the current player's direction
    // Blue=0 (upward), Red=1 (rightward), Yellow=2 (downward), Green=3 (leftward)
    switch (currentPlayerIndex) {
      case 0: return 0;    // Blue's turn - pieces face upward (0°)
      case 1: return 270;  // Red's turn - pieces face rightward (270°)
      case 2: return 180;  // Yellow's turn - pieces face downward (180°)
      case 3: return 90;   // Green's turn - pieces face leftward (90°)
      default: return 0;
    }
  };

  // KING PATH LOGIC - FIXED SEQUENTIAL LAYOUT
  const getKingPathBox = (position) => {
    // 32-box outer path: B1-B32 in sequential order
    // Layout: Bottom (B1-B8) → Right (B9-B16) → Top (B17-B24) → Left (B25-B32)
    
    if (position < 8) {
      // Bottom row: B1-B8 (left to right)
      return { row: 7, col: position };
    } else if (position < 16) {
      // Right column: B9-B16 (bottom to top)
      return { row: 15 - position, col: 7 };
    } else if (position < 24) {
      // Top row: B17-B24 (right to left)
      return { row: 0, col: 23 - position };
    } else {
      // Left column: B25-B32 (top to bottom)
      return { row: position - 24, col: 0 };
    }
  };

  const getKingHomePosition = (teamIndex) => {
    // Home positions: Blue=B8, Red=B16, Yellow=B24, Green=B32
    switch (teamIndex) {
      case 0: return 7; // Blue: B8
      case 1: return 15; // Red: B16
      case 2: return 23; // Yellow: B24
      case 3: return 31; // Green: B32
      default: return 0;
    }
  };

  const getKingStartingPosition = (teamIndex) => {
    // Starting positions: Blue=B1, Red=B9, Yellow=B17, Green=B25
    switch (teamIndex) {
      case 0: return 0; // Blue: B1
      case 1: return 8; // Red: B9
      case 2: return 16; // Yellow: B17
      case 3: return 24; // Green: B25
      default: return 0;
    }
  };

  // Game flow handlers
  const handleModeSelect = (mode) => {
    setSelectedGameMode(mode);
    setAppPhase('game');
  };

  const handleBackToMenu = () => {
    setAppPhase('mode-selection');
    setSelectedGameMode(null);
  };

  // AI Player Logic
  const isAIPlayer = (playerIndex) => {
    if (!selectedGameMode) return false;
    
    switch (selectedGameMode.id) {
      case '1player':
        return playerIndex !== 0; // Blue (player 0) is human, others are AI
      case '2player':
        return playerIndex >= 2; // Blue and Red are human, Yellow and Green are AI
      case '3player':
        return playerIndex === 3; // Blue, Red, Yellow are human, Green is AI
      case '4player':
        return false; // All players are human
      default:
        return false;
    }
  };

  const makeAIMove = () => {
    if (!isAIPlayer(currentPlayer)) return;

    // Simple AI: Find a random valid move
    const validMoves = [];
    
    // Find all pieces belonging to current AI player
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.teamIndex === currentPlayer) {
          // Find all valid moves for this piece
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(row, col, toRow, toCol, piece)) {
                validMoves.push({ fromRow: row, fromCol: col, toRow, toCol });
              }
            }
          }
        }
      }
    }

    if (validMoves.length > 0) {
      // Choose a random valid move
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      // Add a small delay to make AI moves visible
      setTimeout(() => {
        handlePieceMove(randomMove.fromRow, randomMove.fromCol, randomMove.toRow, randomMove.toCol);
      }, 1000);
    } else {
      // No valid moves, skip turn
      nextTurn();
    }
  };

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (appPhase === 'game' && isAIPlayer(currentPlayer) && !isCascading) {
      makeAIMove();
    }
  }, [currentPlayer, appPhase, isCascading]);

  // Render based on app phase
  if (appPhase === 'mode-selection') {
    return <GameModeSelection onModeSelect={handleModeSelect} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <img src="/crushludochesslogo.png" alt="CRUSHLUDOCHESS Logo" className="game-logo" />
          <h1>🎮 CRUSHLUDOCHESS</h1>
          {selectedGameMode && (
            <div className="game-mode-indicator">
              {selectedGameMode.title}
            </div>
          )}
        </div>
        {isCascading && <div className="cascading-indicator">Cascading...</div>}
        <div className="game-info">
          <p>
            Turn: {turnNumber} | Current Player: 
            <span style={{color: TEAM_COLORS[currentPlayer]}}>
              {TEAMS[currentPlayer].toUpperCase()}
              {isAIPlayer(currentPlayer) && ' 🤖'}
            </span>
          </p>
          {selectedGameMode && (
            <div className="player-status">
              {TEAMS.map((team, index) => (
                <span key={team} style={{color: TEAM_COLORS[index], marginRight: '10px'}}>
                  {team.toUpperCase()}{isAIPlayer(index) ? ' 🤖' : ' 👤'}
                  {index === 0 && ' (You)'}
                </span>
              ))}
            </div>
          )}
        </div>
        <button className="back-to-menu-btn" onClick={handleBackToMenu}>
          ← Back to Menu
        </button>
      </header>

      <div className="game-container">

        {/* Main Game Board with King Path */}
        <div className="board-container">
          {/* Top King Path (B17-B24) */}
          <div className="king-path-top">
            {Array(8).fill(null).map((_, index) => {
              const pathPosition = 23 - index; // B17-B24 (right to left)
              // Check if ANY king is here (common path)
              const blueKingHere = kingPositions[0] === pathPosition;
              const redKingHere = kingPositions[1] === pathPosition;
              const yellowKingHere = kingPositions[2] === pathPosition;
              const greenKingHere = kingPositions[3] === pathPosition;
              
              return (
                <div key={`top-${index}`} className="king-path-square">
                  {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                  {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                  {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                  {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                  <span className="path-number">{pathPosition + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Main Board Section with Side Paths */}
          <div className="main-board-section">
            {/* Left King Path (B25-B32) */}
            <div className="king-path-left">
              {Array(8).fill(null).map((_, index) => {
                const pathPosition = 24 + index; // B25-B32 (sequential)
                // Check if ANY king is here (common path)
                const blueKingHere = kingPositions[0] === pathPosition;
                const redKingHere = kingPositions[1] === pathPosition;
                const yellowKingHere = kingPositions[2] === pathPosition;
                const greenKingHere = kingPositions[3] === pathPosition;
                
                return (
                  <div key={`left-${index}`} className="king-path-square">
                    {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                    {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                    {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                    {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                    <span className="path-number">{pathPosition + 1}</span>
                  </div>
                );
              })}
            </div>

            {/* Main 8x8 Chess Board */}
            <div className="chess-board">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                  {row.map((piece, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`board-square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'} ${
                        selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex ? 'selected' : ''
                      } ${
                        cascadeHighlights.some(h => h.row === rowIndex && h.col === colIndex) ? 'cascade-highlight' : ''
                      }`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <div 
                          className="piece"
                          style={{ 
                            color: TEAM_COLORS[piece.teamIndex],
                            transform: `rotate(${getPieceRotation(piece.teamIndex, currentPlayer)}deg)`
                          }}
                        >
                          {getPieceSymbol(piece)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Right King Path (B9-B16) */}
            <div className="king-path-right">
              {Array(8).fill(null).map((_, index) => {
                const pathPosition = 15 - index; // B9-B16 (bottom to top)
                // Check if ANY king is here (common path)
                const blueKingHere = kingPositions[0] === pathPosition;
                const redKingHere = kingPositions[1] === pathPosition;
                const yellowKingHere = kingPositions[2] === pathPosition;
                const greenKingHere = kingPositions[3] === pathPosition;
                
                return (
                  <div key={`right-${index}`} className="king-path-square">
                    {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                    {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                    {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                    {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                    <span className="path-number">{pathPosition + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom King Path (B1-B8) */}
          <div className="king-path-bottom">
            {Array(8).fill(null).map((_, index) => {
              const pathPosition = index; // B1-B8 (sequential)
              // Check if ANY king is here (common path)
              const blueKingHere = kingPositions[0] === pathPosition;
              const redKingHere = kingPositions[1] === pathPosition;
              const yellowKingHere = kingPositions[2] === pathPosition;
              const greenKingHere = kingPositions[3] === pathPosition;
              
              return (
                <div key={`bottom-${index}`} className="king-path-square">
                  {blueKingHere && <div className="king-piece" style={{color: TEAM_COLORS[0]}}>♔</div>}
                  {redKingHere && <div className="king-piece" style={{color: TEAM_COLORS[1]}}>♔</div>}
                  {yellowKingHere && <div className="king-piece" style={{color: TEAM_COLORS[2]}}>♔</div>}
                  {greenKingHere && <div className="king-piece" style={{color: TEAM_COLORS[3]}}>♔</div>}
                  <span className="path-number">{pathPosition + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="instructions-panel">
          <GameInfo 
            currentPlayer={currentPlayer}
            turnNumber={turnNumber}
            gamePhase={gamePhase}
            isCascading={isCascading}
            teams={TEAMS}
          />
        </div>
      </div>

      {gamePhase === 'victory' && (
        <div className="victory-modal">
          <div className="victory-content">
            <h2>🎉 VICTORY! 🎉</h2>
            <p>Player {TEAMS[currentPlayer].toUpperCase()} wins!</p>
            <button onClick={initializeBoard}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
