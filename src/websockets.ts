import { Server } from "socket.io";
import { GameController } from "./gamelogic/GameController_Playtest";
import { Ai_Playtest } from "./gamelogic/Ai_Playtest";
import { Board } from "./gamelogic/Board";
import { Ship } from "./gamelogic/Ship";
import { logger } from "./logger";
import { Position } from "./gamelogic/Types";

export function startWebSocketConnection(server: any) {
  const io = new Server(server, { cors: { origin: "*" } });
  console.log("WebSocket server started");

  io.on("connection", (socket: any) => {
    console.log("New connection:", socket.id);
    let testee: any = null;
    socket.on(
      "sendShipPlacement",
      (body: any[], username: string, difficulty: number) => {
        logger.info("Received ship placement: " + JSON.stringify(body));
        let fieldSize: number = 10;
        let arr: string[][] = Array.from({ length: fieldSize }, () =>
          Array(fieldSize).fill(".")
        );
        let playerShips: Ship[] = [];
        for (const ship of body) {
          for (let i = 0; i < ship.length; i++) {
            let x = ship.startX;
            let y = ship.startY;
            let id = ship.identifier;
            arr[y][x] = id;
            if (ship.direction == "Y") {
              arr[y + i][x] = id;
            } else {
              arr[y][x + i] = id;
            }
          }
          let isHorizontal = ship.direction === "X" ? true : false;
          let position: Position = { x: ship.startX, y: ship.startY };
          playerShips.push(
            new Ship(ship.identifier, isHorizontal, position, ship.length)
          );
        }
        const playerBoard = new Board(10, 6, username, arr, playerShips);
        logger.info("player board created");
        // playerBoard.addShips(playerShips);
        //   playerBoard.setShipPositions();
        // let aiBoard: Ai_Playtest = new Ai_Playtest(playerBoard);
        testee = new GameController(
          playerBoard,
          // aiBoard.aiBoard,

          socket,
          "Player",
          difficulty
        );
        //   testee.addPlayerBoard(playerBoard);
      }
    );
    socket.on(
      "sendShot",
      (body: { x: number; y: number; username: String }) => {
        logger.info("Received shot at: " + body.x + " " + body.y);
        //   schussposition und WER schießt
        let pos = { x: body.x, y: body.y };
        testee.shoot(body.username, pos);
      }
    );
  });
}
