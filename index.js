const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();

const server = http.createServer(app);

const wsServer = new WebSocket.Server({ server });

const maxPlayers = 2;

const winningCombinations = [
  [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
  ],

  [
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],

  [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
  ],

  [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 2, col: 0 },
  ],

  [
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 2, col: 1 },
  ],

  [
    { row: 0, col: 2 },
    { row: 1, col: 2 },
    { row: 2, col: 2 },
  ],

  [
    { row: 0, col: 0 },
    { row: 1, col: 1 },
    { row: 2, col: 2 },
  ],

  [
    { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 2, col: 0 },
  ],
];

let players = ["danielle", "eclesio"];
let currentGameMovements = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
];

let previousMovement = "";
let winner = "";
let drawGame = false;

const checkForDraw = () => {
  let isDraw = true;

  for (const row of currentGameMovements) {
    if (row[0] == 0) {
      isDraw = false;
      break;
    }

    if (row[1] == 0) {
      isDraw = false;
      break;
    }

    if (row[2] == 0) {
      isDraw = false;
      break;
    }
  }

  return isDraw;
};

const checkForWin = (player) => {
  for (const combination of winningCombinations) {
    const row0 = combination[0].row;
    const col0 = combination[0].col;

    const row1 = combination[1].row;
    const col1 = combination[1].col;

    const row2 = combination[2].row;
    const col2 = combination[2].col;

    let isWinner =
      currentGameMovements[row0][col0] == player &&
      currentGameMovements[row1][col1] == player &&
      currentGameMovements[row2][col2] == player;

    if (isWinner) {
      return true;
    }
  }

  return false;
};

wsServer.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("message: %s", message);

    try {
      message = JSON.parse(message);
    } catch {
      return;
    }

    if (message.kind == "newPlayer") {
      if (players.length >= maxPlayers) {
        ws.send(JSON.stringify({ aceito: false }));
        return;
      }

      console.log("JOGADOR ACEITO! -> %s", message.name);
      players.push(message.name);
      ws.send(JSON.stringify({ aceito: true }));

      return;
    }

    if (message.kind == "movement") {
      if (winner != "" || drawGame) {
        return;
      }

      if (players.length != 2) {
        return;
      }

      const row = message.row;
      const col = message.col;

      if (currentGameMovements[row][col] != 0) {
        return;
      }

      const player = message.player;

      if (previousMovement == player) {
        return;
      }

      if (players[0] == player) {
        currentGameMovements[row][col] = 1; // X
      } else if (players[1] == player) {
        currentGameMovements[row][col] = 2; // O
      } else {
        return;
      }

      previousMovement = player;
      console.table(currentGameMovements);

      let isWinner = checkForWin(1);
      if (isWinner) {
        ws.send(JSON.stringify({ winner: players[0] }));
        winner = players[0];
        return;
      }

      isWinner = checkForWin(2);
      if (isWinner) {
        ws.send(JSON.stringify({ winner: players[1] }));
        winner = players[1];
        return;
      }

      const isDraw = checkForDraw();
      if (isDraw) {
        ws.send(JSON.stringify({ draw: true }));
        drawGame = true;
        return;
      }
    }
  });

  ws.send("Hi there, I am a WebSocket server");
});

server.listen(9999, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
