#!/bin/bash
set -e

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()  { echo -e "${BLUE}[setup]${NC} $1"; }
ok()   { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
die()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── node version (via nvm) ────────────────────────────────────────────────────
NODE_VERSION="22"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  source "$HOME/.nvm/nvm.sh"
  log "Installing Node.js $NODE_VERSION via nvm..."
  nvm install "$NODE_VERSION" --silent
  nvm use "$NODE_VERSION"
  ok "Using Node $(node --version)"
elif command -v brew >/dev/null 2>&1; then
  warn "nvm not found – attempting to install via Homebrew..."
  brew install nvm --quiet
  mkdir -p "$HOME/.nvm"
  export NVM_DIR="$HOME/.nvm"
  source "$(brew --prefix nvm)/nvm.sh"
  nvm install "$NODE_VERSION" --silent
  nvm use "$NODE_VERSION"
  ok "Using Node $(node --version)"
else
  warn "nvm not found and Homebrew not available – using system Node.js"
  warn "For best results install nvm: https://github.com/nvm-sh/nvm"
fi

# ── guards ────────────────────────────────────────────────────────────────────
command -v node  >/dev/null 2>&1 || die "Node.js is not installed. Install it from https://nodejs.org"
command -v npm   >/dev/null 2>&1 || die "npm is not installed. It usually ships with Node.js."
command -v python3 >/dev/null 2>&1 || die "Python 3 is not installed. Install it from https://python.org"

# ── resolve project root (directory containing this script) ──────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

[[ -d "$FRONTEND_DIR" ]] || die "frontend/ directory not found at $FRONTEND_DIR"
[[ -d "$BACKEND_DIR"  ]] || die "backend/ directory not found at $BACKEND_DIR"

# ── backend: virtual environment + pip deps ───────────────────────────────────
log "Setting up Python virtual environment..."
cd "$BACKEND_DIR"

if [[ ! -d "venv" ]]; then
  python3 -m venv venv
  ok "Created venv"
else
  warn "venv already exists – skipping creation"
fi

source venv/bin/activate

log "Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
ok "Python dependencies installed"

deactivate

# ── frontend: npm deps ────────────────────────────────────────────────────────
log "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --silent
ok "Node dependencies installed"

# ── launch both servers concurrently ─────────────────────────────────────────
log "Starting servers..."
echo ""
echo -e "  ${GREEN}Backend ${NC} → http://localhost:8000"
echo -e "  ${GREEN}Frontend${NC} → http://localhost:5173"
echo ""
echo -e "  Press ${YELLOW}Ctrl-C${NC} to stop both servers."
echo ""

# Trap Ctrl-C and kill both child processes cleanly
cleanup() {
  echo ""
  log "Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  ok "Done."
}
trap cleanup INT TERM

# Start backend
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
deactivate

# Start frontend
cd "$FRONTEND_DIR"
npm run dev -- --port 5173 &
FRONTEND_PID=$!

# Wait for either process to exit
wait "$BACKEND_PID" "$FRONTEND_PID"