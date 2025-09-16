const ROWS = 6, COLS = 7;
const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const undoBtn = document.getElementById('undo');
const restartBtn = document.getElementById('restart');
const modeSelect = document.getElementById('mode');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
let board = [];
let currentPlayer = 1; 
let moves = []; 
let gameOver = false;
let scores = {1:0,2:0};

function init(){
  const s = localStorage.getItem('c4-scores');
  if(s) scores = JSON.parse(s);
  score1El.textContent = scores[1];
  score2El.textContent = scores[2];

  board = Array.from({length:ROWS},()=>Array(COLS).fill(0));
  moves = [];
  gameOver = false;
  currentPlayer = 1;
  renderBoard();
  updateTurn();
}

function renderBoard(){
  boardEl.innerHTML = '';
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role','gridcell');
      cell.setAttribute('aria-label',`row ${r+1} col ${c+1}`);
      const slot = document.createElement('div');
      slot.className = 'slot';
      cell.appendChild(slot);
      boardEl.appendChild(cell);
    }
  }
}


function lowestEmptyRow(col){
  for(let r=ROWS-1;r>=0;r--){
    if(board[r][col]===0) return r;
  }
  return -1;
}

function dropDisc(col, player, animate=true){
  if(gameOver) return null;
  const row = lowestEmptyRow(col);
  if(row<0) return null;
  board[row][col] = player;
  moves.push({row,col,player});

  
  const index = row*COLS + col;
  const cell = boardEl.children[index];
  const disc = document.createElement('div');
  disc.className = `disc player${player}`;
  cell.appendChild(disc);

  
  const winCells = checkWin(row,col,player);
  if(winCells){
    gameOver = true;
    highlightWin(winCells);
    scores[player]++;
    localStorage.setItem('c4-scores', JSON.stringify(scores));
    score1El.textContent = scores[1];
    score2El.textContent = scores[2];
    setTimeout(()=> showWin(player), 420);
  } else if(isBoardFull()){
    gameOver = true;
    setTimeout(()=> showDraw(), 420);
  } else {
    currentPlayer = 3 - currentPlayer; // toggle
    updateTurn();
    if(modeSelect.value === 'cpu' && currentPlayer === 2){
      
      setTimeout(cpuMove, 500 + Math.random()*400);
    }
  }
  return {row,col};
}

function isBoardFull(){
  return board[0].every(cell=>cell!==0);
}

function updateTurn(){
  if(gameOver) return;
  turnIndicator.textContent = currentPlayer===1 ? "Player 1's turn" : (modeSelect.value==='cpu' && currentPlayer===2 ? "CPU's turn" : "Player 2's turn");
}

function showWin(player){
  modalTitle.textContent = player===1 ? 'Player 1 wins!' : (modeSelect.value==='cpu' && player===2 ? 'CPU wins!' : 'Player 2 wins!');
  modalText.textContent = 'Nice connect four — celebrate!';
  modal.classList.remove('hidden');
}
function showDraw(){
  modalTitle.textContent = "It's a draw!";
  modalText.textContent = 'Nobody connected four — try again.';
  modal.classList.remove('hidden');
}

function highlightWin(cells){
  for(const {r,c} of cells){
    const idx = r*COLS + c;
    boardEl.children[idx].classList.add('win');
  }
}

function checkWin(r,c,player){
  const dirs = [ [0,1],[1,0],[1,1],[1,-1] ];
  for(const [dr,dc] of dirs){
    const cells = [{r,c}];
    let rr=r+dr, cc=c+dc; while(inBounds(rr,cc) && board[rr][cc]===player){ cells.push({r:rr,c:cc}); rr+=dr; cc+=dc; }
    rr=r-dr, cc=c-dc; while(inBounds(rr,cc) && board[rr][cc]===player){ cells.unshift({r:rr,c:cc}); rr-=dr; cc-=dc; }
    if(cells.length>=4) return cells;
  }
  return null;
}
function inBounds(r,c){return r>=0&&r<ROWS&&c>=0&&c<COLS}

boardEl.addEventListener('click', (e)=>{
  if(gameOver) return;
  const col = getColumnFromEvent(e);
  if(col===null) return;
  dropDisc(col,currentPlayer);
});

boardEl.addEventListener('mousemove', (e)=>{
  if(gameOver) return;
  const col = getColumnFromEvent(e);
  clearGhosts();
  if(col===null) return;
  const row = lowestEmptyRow(col);
  if(row<0) return;
  const idx = row*COLS + col;
  boardEl.children[idx].classList.add('ghost', currentPlayer===1? 'p1':'p2');
});
boardEl.addEventListener('mouseleave', clearGhosts);

function clearGhosts(){
  for(const el of boardEl.children){ el.classList.remove('ghost','p1','p2'); }
}

function getColumnFromEvent(e){
  let el = e.target;
  while(el && !el.dataset.col) el = el.parentElement;
  if(!el) return null;
  return Number(el.dataset.col);
}

undoBtn.addEventListener('click', ()=>{
  if(moves.length===0 || gameOver) return;
  const last = moves.pop();
  board[last.row][last.col] = 0;
  const idx = last.row*COLS + last.col;
  const cell = boardEl.children[idx];
  const disc = cell.querySelector('.disc');
  if(disc) disc.remove();
  currentPlayer = last.player; // revert turn back to who played
  gameOver = false;
  for(const el of boardEl.children) el.classList.remove('win');
  updateTurn();
});

restartBtn.addEventListener('click', ()=>{
  init();
});

document.getElementById('modalRestart').addEventListener('click', ()=>{ modal.classList.add('hidden'); init(); });
document.getElementById('modalClose').addEventListener('click', ()=>{ modal.classList.add('hidden'); });

function cpuMove(){
  if(gameOver) return;
  const avail = [];
  for(let c=0;c<COLS;c++){ if(lowestEmptyRow(c)>=0) avail.push(c); }
  if(avail.length===0) return;

  for(const c of avail){ const r = lowestEmptyRow(c); board[r][c]=2; if(checkWin(r,c,2)){ board[r][c]=0; return dropDisc(c,2); } board[r][c]=0; }
  for(const c of avail){ const r = lowestEmptyRow(c); board[r][c]=1; if(checkWin(r,c,1)){ board[r][c]=0; return dropDisc(c,2); } board[r][c]=0; }

  avail.sort((a,b)=> Math.abs(a-3)-Math.abs(b-3));
  const pick = avail[Math.floor(Math.random()*Math.min(avail.length,3))];
  return dropDisc(pick,2);
}

init();

window.addEventListener('keydown', (e)=>{
  if(e.key>='1' && e.key<='7'){
    const col = Number(e.key)-1;
    if(!gameOver && lowestEmptyRow(col)>=0) dropDisc(col,currentPlayer);
  }
});

function tinyConfetti(){
  const frag = document.createDocumentFragment();
  for(let i=0;i<18;i++){
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.left = Math.random()*80 + '%';
    p.style.background = Math.random()<0.5 ? 'var(--accent1)':'var(--accent2)';
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    frag.appendChild(p);
  }
  document.body.appendChild(frag);
  setTimeout(()=>{document.querySelectorAll('.confetti').forEach(n=>n.remove())},1600);
}

const originalShowWin = showWin;
showWin = function(player){ originalShowWin(player); tinyConfetti(); };

const style = document.createElement('style');
style.textContent = `
.confetti{position:fixed;top:8%;width:10px;height:16px;border-radius:2px;z-index:9999;animation:fall 1.4s linear forwards}
@keyframes fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(90vh) rotate(720deg);opacity:0}}
`;
document.head.appendChild(style);
