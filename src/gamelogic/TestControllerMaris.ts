import { logger } from "../logger";
import { Board } from "./TestBoard";
import { BoardOwner, Position, HitResult, ShipType } from "./Types";
import { Socket } from "socket.io";

export class TestPlayerController {
    firstPlayer: BoardOwner;
    readyToPlay: boolean;
    // playerBoard: Board;
    // aiBoard: Board;
    playerWhosTurnItIs: BoardOwner;
    boards: Board[] = [];
    socket: Socket;
    aiShipIndex: number = 0;
    aiLastShotWasRandomMiss: boolean = false;
    aiLastShotWasPlannedMiss: boolean = false;

    constructor(
    /* playerBoard: Board, */ aiBoard: Board,
        firstPlayer: BoardOwner,
        socket: Socket
    ) {
        // this.playerBoard = playerBoard;
        // this.aiBoard = aiBoard;
        // this.boards.push(playerBoard);
        this.boards.push(aiBoard);
        this.firstPlayer = firstPlayer;
        this.readyToPlay = false;
        this.playerWhosTurnItIs = firstPlayer;
        this.socket = socket;
    }

    // who is the first one to take action
    addPlayerBoard(board: Board) {
        this.boards.push(board);
    }

    // how to manage whos turn it is
    //! when a ship has been hit

    setReady() {
        this.readyToPlay = true;
    }

    aiShoot() {
        const board = this.boards.find(
            (board) => board.boardOwner !== this.playerWhosTurnItIs
        );
        if (!board)
            throw new Error(
                "Whooops, didn't find the board we are looking for! " +
                this.playerWhosTurnItIs
            );

        const ships = board.shipArray;
        const playfield = board.playfield;

        // 1. shoot at random missing position
        // 2. shoot at known hit position (choose a ship)
        // 3. shoot at adjacent missing position (if possible)
        // 4. shoot at the other ship positions (of chosen ship)
        // 5. repeat

        const currentShip = ships[this.aiShipIndex];
        if (this.aiLastShotWasRandomMiss) {
            // get a hit
            const firstPos = currentShip.initialPositions[0];
            this.shoot(firstPos);

            // find adjacent missing position
            let adjacentPos: Position | null = null;
            if (firstPos.x + 1 < 10 && playfield[firstPos.x + 1][firstPos.y] == ".") {
                adjacentPos = { x: firstPos.x + 1, y: firstPos.y };
            } else if (firstPos.x - 1 >= 0 && playfield[firstPos.x - 1][firstPos.y] == ".") {
                adjacentPos = { x: firstPos.x - 1, y: firstPos.y };
            } else if (firstPos.y + 1 < 10 && playfield[firstPos.x][firstPos.y + 1] == ".") {
                adjacentPos = { x: firstPos.x, y: firstPos.y + 1 };
            } else if (firstPos.y - 1 >= 0 && playfield[firstPos.x][firstPos.y - 1] == ".") {
                adjacentPos = { x: firstPos.x, y: firstPos.y - 1 };
            }

            if (adjacentPos) {
                this.shoot(adjacentPos);
            } else {
                // shoot at the other ship positions
                for (let i = 1; i < currentShip.initialPositions.length && !currentShip.imSunk; i++) {
                    this.shoot(currentShip.initialPositions[i]);
                    this.aiShipIndex++;
                }
            }
        } else if (this.aiLastShotWasPlannedMiss) {
            for (let i = 1; i < currentShip.initialPositions.length && !currentShip.imSunk; i++) {
                this.shoot(currentShip.initialPositions[i]);
                this.aiShipIndex++;
            }
            this.aiLastShotWasPlannedMiss = false;
            this.aiLastShotWasRandomMiss = false;
        } else {
            // first action in round or first action after AI sunk a ship
            while (true) {
                const randomPos = { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) };
                const elementAt = playfield[randomPos.x][randomPos.y];
                if (elementAt == ".") {
                    this.shoot(randomPos);
                    this.aiLastShotWasRandomMiss = true;
                    break;
                } else {
                    continue;
                }
            }

        }




    }

    shoot(/* player: BoardOwner, */ pos: Position) {
        // doTheShooting
        const board = this.boards.find(
            (board) => board.boardOwner !== this.playerWhosTurnItIs
        );
        if (!board)
            throw new Error(
                "Whooops, didn't find the board we are looking for! " +
                this.playerWhosTurnItIs
            );
        let hitResult = board.checkHit(pos);
        let isShotHit = hitResult.hit === true;

        if (isShotHit) {
            logger.info("A hit at: " + pos.x + pos.y + "!");

            if (board.areAllShipsSunk()) {
                // signal game end
                return this.gameOver({ username: board.boardOwner });
            }
            if ("identifier" in hitResult) {
                // signal sinking
                return this.shipDestroyed(hitResult);
            } else if ("x" in hitResult) {
                return this.hitEvent({ ...hitResult, username: this.playerWhosTurnItIs !== "AI" ? "ki" : "guest" });
            }
        } else {
            logger.warn("A miss at: " + pos.x + pos.y + "!");
            // this.switchPlayers();
            // NOT NEEDED BECAUSE WE SEND THE NAME WITH THE HitEvent
            // this.enabledPlayer({ username: this.playerWhosTurnItIs });
            if ("x" in hitResult) {
                logger.error("Switched Players after isShotHit")
                return this.hitEvent(this.packHitEventSwitch(hitResult));
            }
            throw new Error("Something went wrong with the hitResult!");
        }
    }
    switchPlayers() {
        this.playerWhosTurnItIs =
            this.playerWhosTurnItIs === "AI" ? "Player" : "AI";
        if (this.playerWhosTurnItIs === "AI") {
            logger.debug("AI enabled!" + this.playerWhosTurnItIs)
            setTimeout(() => {
                this.aiShoot();
            }, 3000);
        }
    }

    getCurrentPlayer() {
        return this.playerWhosTurnItIs;
    }

    gameOver(body: { username: BoardOwner }) {
        logger.error("Game over for: " + body.username);
        this.socket.emit("gameOver", body);
    }

    hitEvent(body: HitResult) {
        this.socket.emit("hitEvent", body);
    }

    shipDestroyed(body: ShipType) {
        this.socket.emit("shipDestroyed", body);
    }

    packHitEventSwitch(toPack: HitResult) {
        let formerPlayer = this.playerWhosTurnItIs;
        this.switchPlayers();
        return { ...toPack, username: this.playerWhosTurnItIs === "AI" ? "ki" : "guest" };
    }



    /* enabledPlayer(body: { username: BoardOwner }) {
      logger.debug("Enabled player: " + body.username);
      this.socket.emit("enabledPlayer", body);
    } */
}
