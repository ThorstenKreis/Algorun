import * as commands from './commands.js';
import { levels } from './levels.js';


const gameRoot = document.getElementById("game-root");
const nextLevelButton = document.getElementById('next-level-button');
const conditionSelect = document.getElementById("condition");
const commandButtons = document.querySelectorAll("#command-buttons button");
// Mapping Farbe → Farbcode
const colorMap = {
  grey: "#aaa",
  green: "#4caf50",
  red: "#f44336",
  blue: "#2196f3"
};



export function loadLevel(levelKey) {
  console.log(levelKey + "levelkey")
  commands.setCurrentLevelIndex(levelKey);
  const levelData = levels[levelKey];
  commands.setCurrentLevel(levelData);
  renderLevel(levelData.map, levelData.start);
  generateCommandCells(levelData.maxCommands);

  if (levelData.enabledFunctions) {
    updateFunctionButtons(levelData.enabledFunctions);
  }
  const descElement = document.getElementById("level-description");
  descElement.textContent = levelData.description || "";
}

window.loadLevel = loadLevel;


function renderLevel(level, start) {
  gameRoot.innerHTML = ""; // altes Level löschen
  const cols = level[0].length;
  gameRoot.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  const rows = level.length;
  gameRoot.style.gridAutoRows = `40px`;

  level.forEach((row, y) => {
    row.forEach((cell, x) => {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");

      switch (cell) {
        case 0: cellDiv.classList.add("void"); break;
        case 1: cellDiv.classList.add("field-grey"); break;
        case 2: cellDiv.classList.add("field-green"); break;
        case 3: cellDiv.classList.add("field-red"); break;
        case 4: cellDiv.classList.add("field-blue"); break;
        case 9: cellDiv.classList.add("goal"); break;
      }

      // optional: Koordinaten als Datenattribut
      cellDiv.dataset.x = x;
      cellDiv.dataset.y = y;



      gameRoot.appendChild(cellDiv);

    });
  });
  commands.cursor.x = start.x;
  commands.cursor.y = start.y;
  commands.cursor.dir = start.dir;
  commands.updateCursorPosition();
}

document.getElementById("speed").addEventListener("change", (e) => {
  commands.setExecutionSpeed(parseInt(e.target.value));
});



function generateCommandCells(lst) {

  for (let i = 1; i <= lst.length; i++) {

    const list = document.getElementById(`command-listF${i}`);
    list.innerHTML = ''; // Vorherige löschen

    for (let j = 0; j < lst[i - 1]; j++) {
      const span = document.createElement("span");
      span.classList.add("command-cell");
      list.appendChild(span);
    }
  }
}

loadLevel(commands.currentLevelIndex);



document.querySelectorAll('#command-buttons button').forEach(button => {
  button.addEventListener('click', () => {
    const cmd = button.dataset.cmd;
    commands.addCommand({ cmd, condition: selectedCondition });
  });
});

document.getElementById('start-button').addEventListener('click', () => {
  console.log("Button wurde geklickt!");
  commands.executeCommandsStepByStep(commands.commandQueueF1);
});

document.getElementById('reset-button').addEventListener('click', () => {
  commands.resetCommands();
});

document.getElementById('element-button').addEventListener('click', () => {
  commands.removeLastCommand()
});


document.querySelectorAll('#command-buttons button').forEach(button => {
  button.addEventListener('dragstart', event => {
    if (button.disabled) return;
    const command = button.getAttribute('data-cmd');
    event.dataTransfer.setData('text/plain', command);
  });
});


nextLevelButton.addEventListener('click', () => {
  
  commands.resetCommands();
  console.log("Vorher:", commands.currentLevelIndex);
  commands.loadNextLevel();
});





function updateButtonColors(colorKey) {


  const color = colorMap[colorKey] || "#aaa";
  document.querySelectorAll('#command-buttons button').forEach(button => {
    button.style.backgroundColor = color;
    button.style.color = "#000000";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const conditionSelect = document.getElementById("condition");
  if (!conditionSelect) {
    console.error("Element mit ID 'condition' wurde nicht gefunden.");
    return;
  }

  conditionSelect.addEventListener("change", updateButtonColors);
});
updateButtonColors();

let selectedCondition = 'grey'; // Standard

document.querySelectorAll("#custom-condition-picker .color-option").forEach(option => {
  option.addEventListener("click", () => {
    document.querySelectorAll("#custom-condition-picker .color-option")
      .forEach(opt => opt.classList.remove("selected"));

    option.classList.add("selected");
    selectedCondition = option.dataset.value;
    updateButtonColors(selectedCondition);
  });
});

function updateFunctionButtons(enabledFunctions) {
    const buttons = document.querySelectorAll('#command-buttons button[data-cmd^="function"]');

    buttons.forEach(btn => {
        const label = btn.textContent.trim();
        if (enabledFunctions.includes(label)) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    });
}
