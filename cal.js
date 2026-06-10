const exprEl   = document.getElementById('expr');
const resultEl = document.getElementById('result');

const state = {
  current:   '0',
  prev:      null,
  operator:  null,
  justCalc:  false,
  exprStr:   '',
};

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
  if (typeof n !== 'number') return n;
  const s = parseFloat(n.toPrecision(12)).toString();
  return s.length > 14 ? parseFloat(n.toExponential(6)).toString() : s;
}

function updateDisplay() {
  const len = state.current.replace('-','').replace('.','').length;
  resultEl.className = 'result';
  resultEl.style.fontSize = len > 11 ? '1.9rem' : len > 8 ? '2.5rem' : len > 6 ? '3rem' : '3.5rem';
  resultEl.textContent = state.current;
  exprEl.textContent   = state.exprStr || ' ';
}

// ── Actions ──

function inputDigit(d) {
  if (state.justCalc) {
    state.current  = d;
    state.exprStr  = '';
    state.justCalc = false;
  } else {
    state.current = state.current === '0' ? d : (state.current.length < 14 ? state.current + d : state.current);
  }
  updateDisplay();
}

function inputDecimal() {
  if (state.justCalc) { state.current = '0.'; state.justCalc = false; }
  else if (!state.current.includes('.')) state.current += '.';
  updateDisplay();
}

function inputOperator(op) {
  const opSym = { '+':'+', '-':'−', '*':'×', '/':'÷' }[op];

  if (state.operator && !state.justCalc) {
    const res = compute(state.prev, state.operator, state.current);
    if (res === null) { showError(); return; }
    state.current = fmt(res);
  }

  state.prev     = state.current;
  state.operator = op;
  state.exprStr  = state.current + ' ' + opSym;
  state.justCalc = true;

  setActiveOp(op);
  updateDisplay();
}

function equals() {
  if (!state.operator || state.prev === null) return;
  const opSym = { '+':'+', '-':'−', '*':'×', '/':'÷' }[state.operator];
  const res = compute(state.prev, state.operator, state.current);
  if (res === null) { showError(); return; }
  state.exprStr  = state.prev + ' ' + opSym + ' ' + state.current + ' =';
  state.current  = fmt(res);
  state.prev     = null;
  state.operator = null;
  state.justCalc = true;
  clearActiveOp();
  updateDisplay();
}

function clear() {
  state.current  = '0';
  state.prev     = null;
  state.operator = null;
  state.justCalc = false;
  state.exprStr  = '';
  clearActiveOp();
  updateDisplay();
}

function backspace() {
  if (state.justCalc) return;
  state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
  updateDisplay();
}

function percent() {
  const v = parseFloat(state.current);
  if (isNaN(v)) return;
  state.current = fmt(state.operator && state.prev !== null
    ? (parseFloat(state.prev) * v) / 100
    : v / 100);
  state.justCalc = false;
  updateDisplay();
}

function toggleSign() {
  if (state.current === '0') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1)
    : '-' + state.current;
  updateDisplay();
}

function showError() {
  resultEl.className  = 'result error';
  resultEl.textContent = 'Error';
  state.current  = '0';
  state.prev     = null;
  state.operator = null;
  state.justCalc = false;
  state.exprStr  = '';
}

// ── Operator button highlight ──
function setActiveOp(op) {
  clearActiveOp();
  const btn = document.querySelector(`.btn-op[data-op="${op}"]`);
  if (btn) btn.classList.add('active');
}
function clearActiveOp() {
  document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active'));
}

// ── Button click handler ──
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const { action, val, op } = btn.dataset;
    if (action === 'digit')   inputDigit(val);
    if (action === 'decimal') inputDecimal();
    if (action === 'op')      inputOperator(op);
    if (action === 'equals')  equals();
    if (action === 'clear')   clear();
    if (action === 'percent') percent();
    if (action === 'sign')    toggleSign();
  });
});

// ── Keyboard support ──
const keyMap = {
  '0':'digit:0','1':'digit:1','2':'digit:2','3':'digit:3','4':'digit:4',
  '5':'digit:5','6':'digit:6','7':'digit:7','8':'digit:8','9':'digit:9',
  '.':'decimal','Enter':'equals','=':'equals',
  '+':'op:+','-':'op:-','*':'op:*','/':'op:/',
  'Backspace':'backspace','Escape':'clear','%':'percent',
};

document.addEventListener('keydown', e => {
  const mapped = keyMap[e.key];
  if (!mapped) return;
  e.preventDefault();

  const [action, val] = mapped.split(':');
  if (action === 'digit')   inputDigit(val);
  if (action === 'decimal') inputDecimal();
  if (action === 'op')      inputOperator(val);
  if (action === 'equals')  equals();
  if (action === 'clear')   clear();
  if (action === 'backspace') backspace();
  if (action === 'percent') percent();

  // Flash matching button
  let sel = null;
  if (action === 'digit')    sel = `[data-action="digit"][data-val="${val}"]`;
  if (action === 'op')       sel = `[data-action="op"][data-op="${val}"]`;
  if (action === 'decimal')  sel = `[data-action="decimal"]`;
  if (action === 'equals')   sel = `[data-action="equals"]`;
  if (action === 'clear')    sel = `[data-action="clear"]`;
  if (action === 'backspace') sel = `[data-action="clear"]`;
  if (sel) {
    const el = document.querySelector(sel);
    if (el) { el.classList.add('key-flash'); setTimeout(() => el.classList.remove('key-flash'), 120); }
  }
});

// Init
updateDisplay();
