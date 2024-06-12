import { Board } from "./Board";
import { Ship } from "./Ship";

export class GC_Cheat {
    playerBoard: Board;
    aiBoard: Board;
    identifier: string[];
    difficulty: string | undefined;
    ships: Map<string, Ship>;
    playerShipPositions: Position[] = [];
    focusedShipCoords: Position[] = [];
    emtpyPositions: Position[] = [];
    startingPlayer: string = "";

    constructor(playerBoard: Board, aiBoard: Board, identifier: string[], startingPlayer: string, difficulty?: string) {
        this.playerBoard = playerBoard;
        this.aiBoard = aiBoard;
        difficulty ? this.difficulty = difficulty : this.difficulty = undefined;
        this.identifier = identifier;
        this.ships = new Map<string, Ship>();
        // AI-Feature: Add all ship positions into ships map
        playerBoard.ships.forEach(ship => {
            this.ships.set(ship.identifier, ship);
            ship.initialPositions.forEach(shipPosition => {
                this.playerShipPositions.push(shipPosition)
            });
        });
        this.startingPlayer = startingPlayer;
        // TODO Initialize AI 
        this.ShipPositionsFillUp(this.playerShipPositions);
        if (this.startingPlayer == "Ai") {
            if (difficulty == "god") {
                this.aiGod(0.9);
            }
            else if (difficulty == "Moderate") {
                this.aiGod(0.6);
            } else {
                this.aiGod(0.3);
            }
        }
    }

    // Choose how to fill playerShipPositions array
    ShipPositionsFillUp(arr: Position[]) {
        this.emtpyPositions = this.getAllEmtpyFields(arr);
    }
}