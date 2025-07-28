import React, { useState } from 'react';
import './ChessBoard.css';

const ChessBoard = ({ board, currentPlayer, onPieceMove, isCascading }) => {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const handleSquareClick = (row, col) => {
    if (isCascading) return; // Prevent moves during cascading
    
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
        onPieceMove(selectedPiece.row, selectedPiece.col, row, col);
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
        if (isValidMove(piece, fromRow, fromCol, toRow, toCol)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    
    setValidMoves(moves);
  };

  const isValidMove = (piece, fromRow, fromCol, toRow, toCol) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Check if destination is within board bounds
    if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
    
    // Check if destination has own piece
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.team === piece.team) return false;
    
    switch (piece.type) {
      case 'pawn':
        return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.team);
      case 'rook':
        return isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'bishop':
        return isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'queen':
        return isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'king':
        return isValidKingMove(fromRow, fromCol, toRow, toCol);
      case 'knight':
        return isValidKnightMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  };

  const isValidPawnMove = (fromRow, fromCol, toRow, toCol, team) => {
    const direction = team === 'blue' || team === 'red' ? 1 : -1;
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Forward move
    if (colDiff === 0 && rowDiff === direction && !board[toRow][toCol]) {
      return true;
    }
    
    // Capture move (diagonal)
    if (Math.abs(colDiff) === 1 && rowDiff === direction && board[toRow][toCol]) {
      return true;
    }
    
    return false;
  };

  const isValidRookMove = (fromRow, fromCol, toRow, toCol) => {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
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

  const isValidKingMove = (fromRow, fromCol, toRow, toCol) => {
    return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
  };

  const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
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

  const isSquareHighlighted = (row, col) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  return (
    <div className={`chess-board ${isCascading ? 'cascading' : ''}`}>
      <div className="board-grid">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((piece, colIndex) => {
              const isSelected = selectedPiece && 
                selectedPiece.row === rowIndex && 
                selectedPiece.col === colIndex;
              const isLightSquare = (rowIndex + colIndex) % 2 === 0;
              const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`board-square ${isLightSquare ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
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
      
      <div className="board-labels">
        <div className="file-labels">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => (
            <span key={letter} className="file-label">{letter}</span>
          ))}
        </div>
        <div className="rank-labels">
          {[8, 7, 6, 5, 4, 3, 2, 1].map(number => (
            <span key={number} className="rank-label">{number}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard; 