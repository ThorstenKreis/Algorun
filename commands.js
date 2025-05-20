import { levels } from './levels.js';
import { loadLevel } from './game.js';
// Cursor-Objekt hält Position und Richtung
export let cursor = { x: 0, y: 0, dir: 'up' };
export let TILE_TYPES = { VOID: 0, PATH: 1, GOAL: 9 }

let executionAborted = false;
const COMMAND_SYMBOLS = {
  "move forward": '<img src="/Algorun/style/img/Pfeil.png" alt="↑" style="width:30px; height:30px;">',
  "turn left": '<img src="/Algorun/style/img/Pfeil_links.png" alt="↺" style="width:30px; height:30px;">',
  "turn right": '<img src="/Algorun/style/img/Pfeil_rechts.png" alt="↻" style="width:30px; height:30px;">',
  "function 1": "F1",
  "function 2": "F2",
  "function 3": "F3",
  wait: '⏳'
};

const levelKeys = Object.keys(levels);
let currentLevelIndex = 0;
let executionSpeed = 300;

// Cursor nach vorne bewegen
export function moveForward() {
  switch (cursor.dir) {
    case 'up': cursor.y = Math.max(0, cursor.y - 1); break;
    case 'down': cursor.y = cursor.y + 1; break;       // evtl. max für Spielfeldgrenze
    case 'left': cursor.x = Math.max(0, cursor.x - 1); break;
    case 'right': cursor.x = cursor.x + 1; break;       // evtl. max für Spielfeldgrenze
  }


  updateCursorPosition();
}

/* export function setCursor(x, y) {
    // Entferne vorherigen Cursor
    document.querySelectorAll('.cursor').forEach(cell => {
      cell.classList.remove('cursor');
    });
  
    // Finde Zelle mit passender Position
    const selector = `[data-x="${x}"][data-y="${y}"]`;
    const cell = document.querySelector(selector);
    if (cell) {
      cell.classList.add('cursor');
    }
  } */

export function setCursor(x, y, dir) {
  cursor.x = x;
  cursor.y = y;
  cursor.dir = dir;
  updateCursorPosition();
}

// Cursor-Symbol basierend auf Richtung
export function getCursorSymbol(dir) {
  return '➤';

}

// Cursor-Rotation
export function rotate(direction, turn) {
  const dirs = ['up', 'right', 'down', 'left'];
  let idx = dirs.indexOf(direction);

  if (turn === 'left') idx = (idx + 3) % 4;
  if (turn === 'right') idx = (idx + 1) % 4;

  return dirs[idx];
}

// Helper, um den Cursor selbst zu rotieren und Zustand zu aktualisieren
export function rotateCursor(turn) {
  cursor.dir = rotate(cursor.dir, turn);
  updateCursorPosition();
}

// Befehlswarteschlange
export const commandQueueF1 = [];
export const commandQueueF2 = [];
export const commandQueueF3 = [];

// Befehl hinzufügen
export function addCommand(commandObj) {
  const lst = [commandQueueF1, commandQueueF2, commandQueueF3];

  for (let i = 0; i < currentLevel.maxCommands.length; i++) {

    if (lst[i].length < currentLevel.maxCommands[i]) {

      lst[i].push(commandObj);
      updateCommandList(i);
      break;
    }

  }

}



// Befehlsliste im DOM aktualisieren
export function updateCommandList(funcIndex) {

  const lst = [commandQueueF1, commandQueueF2, commandQueueF3];

  const queue = lst[funcIndex];

  const funcId = `F${funcIndex + 1}`;
  const cells = document.querySelectorAll(`#command-list${funcId} .command-cell`);


  cells.forEach((cell, index) => {
    const command = queue[index];
    if (command) {
      const { cmd, condition } = command;

      // Symbol setzen
      cell.innerHTML = COMMAND_SYMBOLS[cmd] || '?';

      // Farbklassen entfernen und neue setzen
      cell.classList.remove('cond-grey', 'cond-green', 'cond-red', 'cond-blue');
      if (condition) {
        cell.classList.add(`cond-${condition}`);
      }
    } else {
      // Zelle zurücksetzen
      cell.textContent = '';
      cell.className = 'command-cell';
    }
  });
}



// Einzelnen Befehl ausführen
export async function executeCommand(commandObj) {
  console.log(commandObj)
  let cmd, condition;

  if (typeof commandObj === "string") {
    cmd = commandObj;
    condition = undefined;


  } else if (commandObj && typeof commandObj === "object") {
    cmd = commandObj.cmd;
    condition = commandObj.condition;

  } else {
    console.warn("Ungültiger Befehl:", commandObj);
    return;
  }
  console.log(cmd, condition)
  switch (cmd.toLowerCase()) {
    case 'move forward':
      await moveForward();
      break;
    case 'turn left':
      await rotateCursor('left');
      break;
    case 'turn right':
      await rotateCursor('right');
      break;
    case 'function 1':
      await executeCommandsStepByStep(commandQueueF1);
      break;
    case 'function 2':
      await executeCommandsStepByStep(commandQueueF2);
      break;
    case 'function 3':
      await executeCommandsStepByStep(commandQueueF3);
      break;
  }
}

// Befehlsliste zurücksetzen
export function resetCommands() {
  const queues = [commandQueueF1, commandQueueF2, commandQueueF3];
  executionAborted = false;
  queues.forEach((queue, index) => {
    queue.length = 0;
    updateCommandList(index);
  });
  cursor.x = currentLevel.start.x;
  cursor.y = currentLevel.start.y;
  cursor.dir = currentLevel.start.dir;
  updateCursorPosition()

}

// Cursor visuell aktualisieren
export function updateCursorPosition() {
  // Alten Cursor entfernen
  document.querySelectorAll('.cell .cursor').forEach(el => el.remove());

  // Neue Position berechnen
  const selector = `.cell[data-x="${cursor.x}"][data-y="${cursor.y}"]`;
  const cell = document.querySelector(selector);
  if (cell) {
    const el = document.createElement('div');
    el.classList.add('cursor', cursor.dir); // Richtungsklasse hinzufügen
    el.textContent = getCursorSymbol(cursor.dir);
    cell.appendChild(el);
  }
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function executeCommandsStepByStep(commandList) {
  for (let i = 0; i < commandList.length; i++) {
    if (executionAborted) return;
    const commandObj = commandList[i];
    const { cmd, condition } = commandObj;

    // Wenn eine Bedingung gesetzt ist und sie NICHT zutrifft → überspringen
    if (condition && condition !== 'grey' && !checkCondition(condition)) {
      continue;
    }

    let currentTile = getTileAt(cursor.x, cursor.y);
    console.log(currentTile);

    if (currentTile === TILE_TYPES.VOID) {
      console.log("Abbruch: Cursor im Void");
      executionAborted = true;
      break;
    }

    await delay(executionSpeed);
    await executeCommand(commandObj);
    currentTile = getTileAt(cursor.x, cursor.y);
    if (currentTile === TILE_TYPES.GOAL) {
      showVictoryMessage();
      executionAborted = true;
      break;
    }
    if (currentTile === TILE_TYPES.GOAL) {
      showVictoryMessage();
      executionAborted = true;
      break;

    }

  }
}



export function getTileAt(x, y) {
  if (!currentLevel || !currentLevel.map) return TILE_TYPES.VOID;

  const map = currentLevel.map;
  if (map[y] && map[y][x] !== undefined) {
    return map[y][x];
  }
  return TILE_TYPES.VOID;
}

export function setExecutionSpeed(ms) {
  executionSpeed = ms;
}


export function showVictoryMessage() {
  const messageBox = document.getElementById('message');
  const nextButton = document.getElementById('next-level-button');

  if (messageBox) {
    messageBox.textContent = "🎉 Ziel erreicht!";
    messageBox.style.display = "block";
  }

  if (nextButton) {
    nextButton.disabled = false;
  }



}

export function loadNextLevel() {
  if (currentLevelIndex + 1 < levelKeys.length) {
    loadLevelByIndex(currentLevelIndex + 1);
  } else {
    // Optional: Letztes Level erreicht, Button deaktivieren oder Nachricht anzeigen
    const msg = document.getElementById('message');
    msg.textContent = "Du hast alle Level geschafft!";
    msg.style.display = "block";
    document.getElementById('next-level-button').disabled = true;
  }
}

export function loadLevelByIndex(index) {
  if (index < 0 || index >= levelKeys.length) return;
  currentLevelIndex = index;
  const levelKey = levelKeys[currentLevelIndex];
  loadLevel(levelKey);

  document.getElementById('next-level-button').disabled = true;
  document.getElementById('message').style.display = "none";
}

let currentLevel = null;

export function setCurrentLevel(level) {
  currentLevel = level;
}

function checkCondition(condition) {
  const cellIndex = cursor.y * currentLevel.map[0].length + cursor.x;
  const cell = document.querySelectorAll('#game-root .cell')[cellIndex];

  if (!cell) return false;

  // Vergleiche Bedingung mit Klassenname
  switch (condition) {
    case 'grey':
      return cell.classList.contains('field-grey');
    case 'green':
      return cell.classList.contains('field-green');
    case 'red':
      return cell.classList.contains('field-red');
    case 'blue':
      return cell.classList.contains('field-blue');
    default:
      return false;
  }
}
