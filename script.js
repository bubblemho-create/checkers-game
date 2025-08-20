document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.getElementById('board');
  const turnDisplay = document.getElementById('current-turn');
  const resetBtn = document.getElementById('reset-btn');

  let boardState = [];
  let selectedChecker = null;
  let turn = 1; // 1 = Player (Red), 2 = Bot (Black)
  let isBotTurn = false;

  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const isPlayerPiece = (cell, player) => (player === 1 ? (cell === 1 || cell === 3) : (cell === 2 || cell === 4));
  const isKing = (cell) => cell === 3 || cell === 4;
  const baseOf = (cell) => (cell === 3 ? 1 : cell === 4 ? 2 : cell);

  function createBoard() {
    boardElement.innerHTML = '';
    boardState = [];
    for (let row = 0; row < 8; row++) {
      boardState[row] = [];
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.classList.add('square', (row + col) % 2 === 0 ? 'white' : 'black');
        square.dataset.row = row;
        square.dataset.col = col;
        boardElement.appendChild(square);
        boardState[row][col] = 0;
      }
    }
  }

  function createChecker(row, col, val) {
    const checker = document.createElement('div');
    checker.classList.add('checker');
    const player = baseOf(val);
    checker.classList.add(player === 1 ? 'red' : 'black');
    if (isKing(val)) checker.classList.add('king');
    checker.dataset.row = row;
    checker.dataset.col = col;
    checker.dataset.value = String(val);
    checker.addEventListener('click', handleCheckerClick);
    const square = boardElement.querySelector(`[data-row='${row}'][data-col='${col}']`);
    square && square.appendChild(checker);
  }

  function placeCheckers() {
    document.querySelectorAll('.checker').forEach(n => n.remove());
    boardState = boardState.map(row => row.map(() => 0));

    let blackPlaced = 0;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 !== 0 && blackPlaced < 8) {
          createChecker(row, col, 2);
          boardState[row][col] = 2;
          blackPlaced++;
        }
      }
    }

    let redPlaced = 0;
    for (let row = 6; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 !== 0 && redPlaced < 8) {
          createChecker(row, col, 1);
          boardState[row][col] = 1;
          redPlaced++;
        }
      }
    }
    turn = 1;
    updateTurnUI();
  }

  function updateTurnUI() {
    if (turnDisplay) turnDisplay.textContent = (turn === 1 ? 'ผู้เล่น' : 'บอท');
  }

  function handleCheckerClick(e) {
    if (isBotTurn) return;
    const checker = e.currentTarget;
    const val = parseInt(checker.dataset.value, 10);
    const player = baseOf(val);
    if (player !== turn) return;

    if (selectedChecker) {
      selectedChecker.classList.remove('selected');
      clearHighlights();
    }
    selectedChecker = checker;
    checker.classList.add('selected');
    highlightPossibleMovesForDomChecker(checker);
  }

  function clearHighlights() {
    document.querySelectorAll('.highlight-move,.highlight-jump').forEach(sq => {
      sq.classList.remove('highlight-move', 'highlight-jump');
      sq.removeEventListener('click', handleMove);
      delete sq.dataset.isJump;
      delete sq.dataset.fromRow;
      delete sq.dataset.fromCol;
    });
  }

  function highlightSquare(row, col, isJump, fromRow, fromCol) {
    const sq = boardElement.querySelector(`[data-row='${row}'][data-col='${col}']`);
    if (!sq) return;
    sq.classList.add(isJump ? 'highlight-jump' : 'highlight-move');
    sq.dataset.isJump = String(!!isJump);
    sq.dataset.fromRow = String(fromRow);
    sq.dataset.fromCol = String(fromCol);
    sq.addEventListener('click', handleMove);
  }

  function highlightPossibleMovesForDomChecker(checker) {
    const row = parseInt(checker.dataset.row, 10);
    const col = parseInt(checker.dataset.col, 10);
    const val = parseInt(checker.dataset.value, 10);
    const player = baseOf(val);
    const moves = getPossibleMoves(boardState, player, false)
      .filter(m => m.fromRow === row && m.fromCol === col);
    const hasJump = moves.some(m => m.isJump);
    moves
      .filter(m => !hasJump || m.isJump)
      .forEach(m => highlightSquare(m.toRow, m.toCol, m.isJump, row, col));
  }

  function handleMove(e) {
    if (!selectedChecker) return;
    const targetSquare = e.currentTarget;
    const isJump = targetSquare.dataset.isJump === 'true';
    const fromRow = parseInt(targetSquare.dataset.fromRow, 10);
    const fromCol = parseInt(targetSquare.dataset.fromCol, 10);
    const newRow = parseInt(targetSquare.dataset.row, 10);
    const newCol = parseInt(targetSquare.dataset.col, 10);

    const checkerToMove = boardElement.querySelector(`[data-row='${fromRow}'][data-col='${fromCol}'] .checker`);
    if (!checkerToMove) return;
    const val = parseInt(checkerToMove.dataset.value, 10);

    boardState[fromRow][fromCol] = 0;
    if (isJump) {
      const jumpedRow = (fromRow + newRow) / 2;
      const jumpedCol = (fromCol + newCol) / 2;
      const jumpedPieceEl = boardElement.querySelector(`[data-row='${jumpedRow}'][data-col='${jumpedCol}'] .checker`);
      if (jumpedPieceEl) {
        boardState[jumpedRow][jumpedCol] = 0;
        jumpedPieceEl.remove();
      }
    }

    let newVal = val;
    if ((baseOf(val) === 1 && newRow === 0) || (baseOf(val) === 2 && newRow === 7)) {
      newVal = (baseOf(val) === 1 ? 3 : 4);
    }
    boardState[newRow][newCol] = newVal;

    const square = boardElement.querySelector(`[data-row='${newRow}'][data-col='${newCol}']`);
    square.appendChild(checkerToMove);
    checkerToMove.dataset.row = newRow;
    checkerToMove.dataset.col = newCol;
    checkerToMove.dataset.value = String(newVal);
    if (isKing(newVal)) checkerToMove.classList.add('king');

    clearHighlights();
    selectedChecker.classList.remove('selected');
    selectedChecker = null;

    if (checkWin()) return;

    switchTurn();
  }

  function switchTurn() {
    turn = (turn === 1 ? 2 : 1);
    updateTurnUI();
    if (turn === 2) {
      isBotTurn = true;
      setTimeout(botMove, 500);
    } else {
      isBotTurn = false;
    }
  }

  // ✅ บอทง่าย ๆ
  function botMove() {
    const allMoves = getPossibleMoves(boardState, 2, false);
    if (allMoves.length === 0) {
      turn = 1;
      updateTurnUI();
      isBotTurn = false;
      return;
    }

    // heuristic: ถ้ามี move กิน เลือกอันนั้นก่อน
    const jumpMoves = allMoves.filter(m => m.isJump);
    const move = jumpMoves.length > 0
      ? jumpMoves[Math.floor(Math.random() * jumpMoves.length)]
      : allMoves[Math.floor(Math.random() * allMoves.length)];

    executeMove(move);

    if (checkWin()) return;

    switchTurn();
  }

  function executeMove(move) {
    const checkerToMove = boardElement.querySelector(
      `[data-row='${move.fromRow}'][data-col='${move.fromCol}'] .checker`
    );
    const targetSquare = boardElement.querySelector(
      `[data-row='${move.toRow}'][data-col='${move.toCol}']`
    );

    if (move.isJump && move.jumped) {
      const jumpedPiece = boardElement.querySelector(
        `[data-row='${move.jumped.r}'][data-col='${move.jumped.c}'] .checker`
      );
      if (jumpedPiece) {
        jumpedPiece.remove();
        boardState[move.jumped.r][move.jumped.c] = 0;
      }
    }

    const fromVal = parseInt(checkerToMove.dataset.value, 10);
    boardState[move.fromRow][move.fromCol] = 0;
    let toVal = fromVal;
    if (move.toRow === 7) toVal = 4;
    boardState[move.toRow][move.toCol] = toVal;

    targetSquare.appendChild(checkerToMove);
    checkerToMove.dataset.row = String(move.toRow);
    checkerToMove.dataset.col = String(move.toCol);
    checkerToMove.dataset.value = String(toVal);
    if (isKing(toVal)) checkerToMove.classList.add('king');
  }

  function checkWin() {
    const redLeft = boardState.flat().filter(v => v === 1 || v === 3).length;
    const blackLeft = boardState.flat().filter(v => v === 2 || v === 4).length;

    if (blackLeft === 0) {
      setTimeout(() => {
        alert("🎉 คุณชนะ!");
        createBoard();
        placeCheckers();
      }, 200);
      return true;
    }
    if (redLeft === 0) {
      setTimeout(() => {
        alert("😢 คุณแพ้!");
        createBoard();
        placeCheckers();
      }, 200);
      return true;
    }
    return false;
  }

  function getPossibleMoves(board, player, onlyJumps = false) {
    const moves = [];
    const manDirs = (player === 1) ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (!isPlayerPiece(cell, player)) continue;
        if (isKing(cell)) {
          for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            let r1 = r + dr, c1 = c + dc;
            let jumped = false, enemyPos = null;
            while (inBounds(r1, c1)) {
              if (board[r1][c1] === 0) {
                if (!onlyJumps) {
                  if (!jumped) {
                    moves.push({ fromRow: r, fromCol: c, toRow: r1, toCol: c1, isJump: false });
                  } else {
                    moves.push({ fromRow: r, fromCol: c, toRow: r1, toCol: c1, isJump: true, jumped: enemyPos });
                  }
                } else if (jumped) {
                  moves.push({ fromRow: r, fromCol: c, toRow: r1, toCol: c1, isJump: true, jumped: enemyPos });
                }
              } else {
                if (!jumped && !isPlayerPiece(board[r1][c1], player)) {
                  enemyPos = { r: r1, c: c1 };
                  jumped = true;
                } else {
                  break;
                }
              }
              r1 += dr; c1 += dc;
            }
          }
        } else {
          for (const [dr, dc] of manDirs) {
            const r1 = r + dr, c1 = c + dc;
            if (inBounds(r1, c1) && board[r1][c1] === 0) {
              moves.push({ fromRow: r, fromCol: c, toRow: r1, toCol: c1, isJump: false });
            }
            const r2 = r + 2 * dr, c2 = c + 2 * dc;
            if (inBounds(r2, c2) && board[r2][c2] === 0 && board[r1][c1] !== 0 && !isPlayerPiece(board[r1][c1], player)) {
              moves.push({ fromRow: r, fromCol: c, toRow: r2, toCol: c2, isJump: true, jumped: { r: r1, c: c1 } });
            }
          }
        }
      }
    }
    return moves;
  }

  resetBtn && resetBtn.addEventListener('click', () => { createBoard(); placeCheckers(); });

  createBoard();
  placeCheckers();
});
