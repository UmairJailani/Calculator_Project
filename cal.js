const exprEl    = document.getElementById('expr');
const resultEl  = document.getElementById('result');
const copyToast = document.getElementById('copyToast');
const histPanel = document.getElementById('histPanel');
const histList  = document.getElementById('histList');
const histEmpty = document.getElementById('histEmpty');
const sciButtons= document.getElementById('sciButtons');
const drToggle  = document.getElementById('drToggle');
const sciBtn    = document.getElementById('sciBtn');
const histBtn   = document.getElementById('histBtn');

// ── State ──
const state = {
  current:  '0',
  prev:     null,
  operator: null,
  justCalc: false,
  exprStr:  '',
  useDeg:   true,
  sciMode:  false,
  histOpen: false,
};

// ── History (localStorage) ──
let history = [];
try { history = JSON.parse(localStorage.getItem('calcHistory') || '[]'); } catch {}

function saveHistory() { localStorage.setItem('calcHistory', JSON.stringify(history.slice(0, 50))); }

function pushHistory(expr, result) {
  history.unshift({ expr, result });
  if (history.length > 50) history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  histList.innerHTML = '';
  if (!history.length) { histEmpty.classList.add('visible'); return; }
  histEmpty.classList.remove('visible');
  history.forEach((h, i) => {
    const item = document.createElement('div');
    item.className = 'hist-item';
    item.innerHTML = `<div class="hi-expr">${h.expr}</div><div class="hi-result">${h.result}</div>`;
    item.addEventListener('click', () => {
      state.current  = h.result;
      state.justCalc = true;
      state.exprStr  = '';
      updateDisplay();
      closeHistory();
    });
    histList.appendChild(item);
  });
}

function openHistory()  { histPanel.classList.add('open');  state.histOpen = true;  histBtn.classList.add('active');    renderHistory(); }
function closeHistory() { histPanel.classList.remove('open'); state.histOpen = false; histBtn.classList.remove('active'); }

histBtn.addEventListener('click', () => state.histOpen ? closeHistory() : openHistory());

document.getElementById('clearHistBtn').addEventListener('click', () => {
  history = []; saveHistory(); renderHistory();
});

// ── Scientific toggle ──
function toggleSci() {
  state.sciMode = !state.sciMode;
  sciButtons.classList.toggle('visible', state.sciMode);
  drToggle.classList.toggle('visible', state.sciMode);
  sciBtn.classList.toggle('active', state.sciMode);
}
sciBtn.addEventListener('click', toggleSci);

// Deg/Rad
document.getElementById('degBtn').addEventListener('click', () => {
  state.useDeg = true;
  document.getElementById('degBtn').classList.add('active');
  document.getElementById('radBtn').classList.remove('active');
});
document.getElementById('radBtn').addEventListener('click', () => {
  state.useDeg = false;
  document.getElementById('radBtn').classList.add('active');
  document.getElementById('degBtn').classList.remove('active');
});

// ── Copy on click ──
document.getElementById('display').addEventListener('click', () => {
  if (resultEl.classList.contains('error')) return;
  navigator.clipboard.writeText(resultEl.textContent).then(() => {
    copyToast.classList.add('show');
    setTimeout(() => copyToast.classList.remove('show'), 1400);
  }).catch(() => {});
});

// ── Core logic ──
function compute(a, op, b) {
  a = parseFloat(a); b = parseFloat(b);
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? null : a / b;
  }
}

function fmt(n) {
  if (typeof n !== 'number' || !isFinite(n)) return 'Error';
  const s = parseFloat(n.toPrecision(12)).toString();
  return s.length > 14 ? parseFloat(n.toExponential(6)).toString() : s;
}

function updateDisplay() {
  const val = state.current;
  const len = val.replace(/[-.]/, '').length;
  resultEl.className = val === 'Error' ? 'result error' : 'result';
  resultEl.style.fontSize = len > 11 ? '1.9rem' : len > 8 ? '2.5rem' : len > 6 ? '3rem' : '3.5rem';
  resultEl.textContent = val;
  exprEl.textContent   = state.exprStr || ' ';
}

// ── Actions ──
function inputDigit(d) {
  if (state.justCalc) { state.current = d; state.exprStr = ''; state.justCalc = false; }
  else state.current = state.current === '0' ? d : (state.current.length < 15 ? state.current + d : state.current);
  updateDisplay();
}

function inputDecimal() {
  if (state.justCalc) { state.current = '0.'; state.justCalc = false; }
  else if (!state.current.includes('.')) state.current += '.';
  updateDisplay();
}

function inputOperator(op) {
  const sym = { '+':'+', '-':'−', '*':'×', '/':'÷' }[op];
  if (state.operator && !state.justCalc) {
    const res = compute(state.prev, state.operator, state.current);
    if (res === null) { showError(); return; }
    state.current = fmt(res);
  }
  state.prev     = state.current;
  state.operator = op;
  state.exprStr  = state.current + ' ' + sym;
  state.justCalc = true;
  setActiveOp(op);
  updateDisplay();
}

function equals() {
  if (!state.operator || state.prev === null) return;
  const sym = { '+':'+', '-':'−', '*':'×', '/':'÷' }[state.operator];
  const res = compute(state.prev, state.operator, state.current);
  if (res === null) { showError(); return; }
  const expr = state.prev + ' ' + sym + ' ' + state.current + ' =';
  const result = fmt(res);
  pushHistory(expr, result);
  state.exprStr  = expr;
  state.current  = result;
  state.prev     = null;
  state.operator = null;
  state.justCalc = true;
  clearActiveOp();
  updateDisplay();
}

function clear() {
  state.current = '0'; state.prev = null; state.operator = null;
  state.justCalc = false; state.exprStr = '';
  clearActiveOp(); updateDisplay();
}

function backspace() {
  if (state.justCalc) return;
  state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
  updateDisplay();
}

function percent() {
  const v = parseFloat(state.current); if (isNaN(v)) return;
  state.current = fmt(state.operator && state.prev !== null
    ? parseFloat(state.prev) * v / 100 : v / 100);
  state.justCalc = false; updateDisplay();
}

function toggleSign() {
  if (state.current === '0' || state.current === 'Error') return;
  state.current = state.current.startsWith('-') ? state.current.slice(1) : '-' + state.current;
  updateDisplay();
}

// ── Scientific functions ──
function applyTrig(fn, val) {
  const rad = state.useDeg ? val * Math.PI / 180 : val;
  return Math[fn](rad);
}

function sciApply(fn) {
  const v = parseFloat(state.current);
  if (isNaN(v)) return;
  let res;
  const fnLabel = { sin:'sin', cos:'cos', tan:'tan', sqrt:'√', sq:'²', cube:'³', inv:'1/', log:'log', ln:'ln', abs:'|' };
  switch (fn) {
    case 'sin':  res = applyTrig('sin', v); break;
    case 'cos':  res = applyTrig('cos', v); break;
    case 'tan':  res = applyTrig('tan', v); break;
    case 'sqrt': res = v < 0 ? null : Math.sqrt(v); break;
    case 'sq':   res = v * v; break;
    case 'cube': res = v * v * v; break;
    case 'inv':  res = v === 0 ? null : 1 / v; break;
    case 'log':  res = v <= 0 ? null : Math.log10(v); break;
    case 'ln':   res = v <= 0 ? null : Math.log(v); break;
    case 'abs':  res = Math.abs(v); break;
  }
  if (res === null || !isFinite(res)) { showError(); return; }
  state.exprStr  = fn + '(' + state.current + ')';
  state.current  = fmt(res);
  state.justCalc = true;
  updateDisplay();
}

function insertConst(name) {
  const val = name === 'pi' ? Math.PI : Math.E;
  state.current  = fmt(val);
  state.justCalc = false;
  updateDisplay();
}

function showError() {
  state.current = 'Error'; state.prev = null; state.operator = null;
  state.justCalc = false; state.exprStr = '';
  clearActiveOp(); updateDisplay();
}

// ── Op highlight ──
function setActiveOp(op)  { clearActiveOp(); const b = document.querySelector(`.btn-op[data-op="${op}"]`); if (b) b.classList.add('active'); }
function clearActiveOp()  { document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active')); }

// ── Button clicks ──
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.histOpen) return;
    const { action, val, op, fn } = btn.dataset;
    if (action === 'digit')   inputDigit(val);
    if (action === 'decimal') inputDecimal();
    if (action === 'op')      inputOperator(op);
    if (action === 'equals')  equals();
    if (action === 'clear')   clear();
    if (action === 'percent') percent();
    if (action === 'sign')    toggleSign();
    if (action === 'sci')     sciApply(fn);
    if (action === 'const')   insertConst(val);
  });
});

// ── Keyboard ──
const keyMap = {
  '0':'digit:0','1':'digit:1','2':'digit:2','3':'digit:3','4':'digit:4',
  '5':'digit:5','6':'digit:6','7':'digit:7','8':'digit:8','9':'digit:9',
  '.':'decimal','Enter':'equals','=':'equals',
  '+':'op:+','-':'op:-','*':'op:*','/':'op:/',
  'Backspace':'backspace','Escape':'clear','%':'percent',
};

document.addEventListener('keydown', e => {
  if (state.histOpen) { if (e.key === 'Escape') closeHistory(); return; }
  const mapped = keyMap[e.key]; if (!mapped) return;
  e.preventDefault();
  const [action, val] = mapped.split(':');
  if (action === 'digit')     inputDigit(val);
  if (action === 'decimal')   inputDecimal();
  if (action === 'op')        inputOperator(val);
  if (action === 'equals')    equals();
  if (action === 'clear')     clear();
  if (action === 'backspace') backspace();
  if (action === 'percent')   percent();

  let sel = null;
  if (action === 'digit')   sel = `[data-action="digit"][data-val="${val}"]`;
  if (action === 'op')      sel = `[data-action="op"][data-op="${val}"]`;
  if (action === 'decimal') sel = `[data-action="decimal"]`;
  if (action === 'equals')  sel = `[data-action="equals"]`;
  if (action === 'clear' || action === 'backspace') sel = `[data-action="clear"]`;
  if (sel) { const el = document.querySelector(sel); if (el) { el.classList.add('key-flash'); setTimeout(() => el.classList.remove('key-flash'), 120); } }
});

// ── Init ──
renderHistory();
updateDisplay();
