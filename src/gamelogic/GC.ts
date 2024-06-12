import { Board } from "./Board";
import { Ship } from "./Ship";

export class GC {
    // TODO Solution for generalization
    //gameMode: GameMode;
    //boards: Map<string, Board>;
    //playerNames: string[];
    playerBoard: Board;
    aiBoard: Board;
    identifier: string[];
    currentPlayer: string;
    readyStatCounter: number;
    playerAmount: number;
    difficulty: string | undefined;
    playerShipPositions: Position[] = [];
    firstHitPosition: Position[] = [];
    hitList: Position[] = [];
    tempArr: Position[] = [];
    nextShotCoordinates: Position[] = [];
    trackAllShots: Position[] = [];
    // To find out ship alignement
    stepCounter: number = 0;
    shipAlignment: string = "";

    // TODO Solution for parameter list (generalization)
    constructor(playerBoard: Board, aiBoard: Board, identifier: string[], currentPlayer?: string, playerAmount?: number, difficulty?: string) {
        // TODO Implement individual amount of boards (with specific usernames) depending on the amount of players and push them into boards
        //this.gameMode = gameMode;
        //this.playerNames = playerNames;
        //this.boards = new Map<string, Board>;
        //if(gameMode.toString() == "offline"){
        //    this.boards.set(playerNames[0], );
        //}
        // ######################################
        // ######################################
        this.playerBoard = playerBoard;
        this.aiBoard = aiBoard;
        currentPlayer ? this.currentPlayer = currentPlayer : this.currentPlayer = "Multiplayer";
        this.readyStatCounter = 0;
        // To handle offline and online matches
        playerAmount ? this.playerAmount = playerAmount : this.playerAmount = 0;
        difficulty ? this.difficulty = difficulty : this.difficulty = undefined;
        this.identifier = identifier;
        // AI-Feature: Push all ship positions into playerShipPositions
        playerBoard.ships.forEach(ship => {
            ship.initialPositions.forEach(shipPosition => {
                this.playerShipPositions.push(shipPosition)
            });
        });
        // TODO Initialize AI randomized placement of ships
        if (difficulty) {
            this.playerShipPositionsFillUp(difficulty);
        }
    }

    // Function button for multiplayer matches
    setReady() {
        this.readyStatCounter++;
    }

    // Function button for multiplayer matches
    getReady(): boolean {
        return this.readyStatCounter == this.playerAmount;
    }

    // Happens in front end.
    //
    // startGame() {
    //     // Only for offline mode
    //     if (this.currentPlayer != "Multiplayer") {
    //         while (this.playerBoard.shipQuantity != this.playerBoard.sunkCounter && this.aiBoard.shipQuantity != this.aiBoard.sunkCounter) {
    //             // Ask for coordinate
    //             let position: Position = { x: 10, y: 20 };
    //             this.shoot(position, this.currentPlayer);

    //         }
    //     }
    // }

    // Choose how to fill playerShipPositions array
    playerShipPositionsFillUp(difficulty: string) {
        let columnAmount = this.playerBoard.columnAmount;
        if (difficulty == "Easy") {
            for (let i = 0; i < columnAmount; i++) {
                for (let j = 0; j < columnAmount; j++) {
                    let newPosition: Position = { x: i, y: j };
                    if (!this.playerShipPositions.includes(newPosition)) {
                        this.playerShipPositions.push(newPosition);
                    }
                }
            }
        } else if (difficulty == "Moderate") {
            let start = 0;
            while (start < columnAmount + 15) {
                let newPosition: Position = this.aiRandomizedPositionFills();
                if (!this.playerShipPositions.includes(newPosition)) {
                    this.playerShipPositions.push(newPosition);
                    start++;
                }
            }
        } else {
            let start = 0;
            while (start < 3) {
                let newPosition: Position = this.aiRandomizedPositionFills();
                if (!this.playerShipPositions.includes(newPosition)) {
                    this.playerShipPositions.push(newPosition);
                    start++;
                }
            }
        }
    }

    // TODO Implement and outsource intelligent picking logic as function
    // Difficulty god-mode. If set, the AI has a statistical hit rate of at least 50 %
    aiGod(): boolean | Ship | string {

        // Get last hit from positionControl
        // Randomize pick possibilities an continue, where next hit was found until miss or sunk signal
        // When hit in between all ship coordinates and one end is reached (miss signal), continue from first hit position - 1
        // Empty positionControl when ship sunk signal is received

        // Create new potential shot coordinates based on lastHitPosition
        if (this.hitList.length > 0) {

            let nextPos01: Position | boolean;
            let nextPos02: Position | boolean;
            let nextPos03: Position | boolean;
            let nextPos04: Position | boolean;

            let shotCoordinate: Position;
            let checkHit;

            // If exactly 1 coord in lastHitPosition exist (means prepare 2nd shot coord)
            if (this.hitList.length == 1) {
                // Create some new coords in tempArr
                this.AddNewCoordinatesToTempArr(this.hitList.at(0)!);

                // Remove some empty coords from tempArr
                this.removeSomeEmptyPos();

                // Add next randomly picked coord to nextShotCoordinates
                this.nextShotCoordinates.push(this.aiRandomizedPositionsPicks(this.tempArr, this.tempArr.length));

                return this.handleCheckHitResult(this.nextShotCoordinates.at(0)!);
            }

            // If at least 2 lastHitPosition exist (means prepare 3rd shot coord)
            if (this.hitList.length > 1) {
                // TODO Implement logic to find out alignment of ship
                if (this.stepCounter == 2) {
                    // Determine shipAlignment
                    this.shipAlignment = this.determineShipAlignement(this.hitList.at(0)!, this.hitList.at(1)!);


                    if (this.shipAlignment == "+x") {
                        let newCoord: Position | boolean = this.validateCoordinate({ x: this.hitList.at(this.hitList.length)!.x + 1, y: this.hitList.at(this.hitList.length)!.y })
                    } else if (this.shipAlignment == "-x") {

                    } else if (this.shipAlignment == "+y") {

                    } else {

                    }
                }
            }

            // Set shot
            // Finalize randomly picked shot coordinate & check hit result
            if (this.nextShotCoordinates.length == 0) {
                /**
                 * If no coord left in nextShotCoordinates, everything around last- and firstHitPosition has been hit and sunk 
                 *  ==> Get a new coord and calculate new coords
                 *  ==> Reset last- and firstHitPosition arrays and shipAlignment
                 */
                shotCoordinate = this.aiRandomizedPositionsPicks(this.playerShipPositions, this.playerShipPositions.length);
                this.firstHitPosition = [];
                this.hitList = [];
                this.shipAlignment = "";
            } else {
                shotCoordinate = this.aiRandomizedPositionsPicks(this.nextShotCoordinates, this.nextShotCoordinates.length);
            }

            checkHit = this.playerBoard.checkHit(shotCoordinate, "Ai");

            let checkResult = this.handleCheckHitResult(checkHit);

        } else {
            /**
             * In the beginning and after sinking a ship - Try to hit player's ships with a random shot coordinate from playerShipPositions.
             * If it's a hit, track that position in lastHitPosition to calculate new possible positions based on lastHitPosition
             * and delete that coordinate from playerShipPositions. If it's a miss, delete it from nextShotCoordinates.
             */
            let shotCoordinate: Position = this.aiRandomizedPositionsPicks(this.playerShipPositions, this.playerShipPositions.length);
            let checkHit = this.playerBoard.checkHit(shotCoordinate, this.aiBoard.boardOwner);
            if (typeof checkHit == "boolean" && checkHit) {
                this.stepCounter++;
                // this.firstHitPosition.push(shotCoordinate);
                // this.lastHitPosition.push(shotCoordinate);
                // this.trackAllShots.push(shotCoordinate);
                this.playerShipPositions.filter(coord => {
                    (coord.x !== shotCoordinate.x && coord.y !== shotCoordinate.y);
                });
                return true;
            } else {
                this.trackAllShots.push(shotCoordinate);
                this.playerShipPositions.filter(coord => {
                    (coord.x !== shotCoordinate.x && coord.y !== shotCoordinate.y);
                });
                return false;
            }
        }
    }


    /**
     * Difficulty middle. If set, AI knows the ship positions, but a randomizer is used to 
     * randomly pic coordinates from a list of the enemies ship coordinates and some unused coordinates.
     * If a randomly picked coordinate is a hit, the AI tries to test the coordinates around that hit 
     * systematically until the ship is sunk. 
     */
    aiModerate(): boolean {
        // TODO aiModerate needs to be implemented
        return false;
    }

    /**
     * Difficulty easy. If set, AI knows the ship positions, but a randomizer is used to 
     * randomly pic coordinates from a list of the enemies ship coordinates and many unused coordinates.
     * If a randomly picked coordinate is a hit, the AI tries to test the coordinates around that hit 
     * systematically until the ship is sunk. 
     */
    aiEasy(): boolean {
        // TODO aiModerate needs to be implemented
        return false;
    }

    // To fill list with random coordinates, depending on the set difficulty
    aiRandomizedPositionFills(): Position {
        const randomX = Math.floor(Math.random() * 10);
        const randomY = Math.floor(Math.random() * 10);
        return { x: randomX, y: randomY };
    }

    // Pick a random coordinate from list
    aiRandomizedPositionsPicks(coordinatesArray: Position[], arrLength: number): Position {
        let randomPositionPick = coordinatesArray[Math.floor(Math.random() * arrLength)];
        return randomPositionPick;
    }

    // TODO Solution for playtest 
    // TODO Solution for generalization
    // Shoots at the given position
    shoot(position: Position, player: string): boolean | Ship | string {
        let currentPlayerBoard = player == "Player" ? this.playerBoard : this.aiBoard;

        return currentPlayerBoard.checkHit(position, player);
    }

    // Make sure only unused positions are added as new shot coordinates
    addToTempArr(newPosition: Position, arr: Position[]) {
        if (typeof newPosition !== "boolean") {
            if (this.playerBoard.playfield[newPosition.y][newPosition.x] != "O" && this.playerBoard.playfield[newPosition.y][newPosition.x] != "X" && this.playerBoard.playfield[newPosition.y][newPosition.x] != "D" && !this.nextShotCoordinates.includes(newPosition)) {
                this.nextShotCoordinates.push(newPosition);
            }
        }
    }

    // Make sure only unused positions are added as new shot coordinates
    addToNextShotCoordinates(newPosition: Position, arr: Position[]) {
        if (typeof newPosition !== "boolean") {
            if (this.playerBoard.playfield[newPosition.y][newPosition.x] != "O" && this.playerBoard.playfield[newPosition.y][newPosition.x] != "X" && this.playerBoard.playfield[newPosition.y][newPosition.x] != "D" && !this.nextShotCoordinates.includes(newPosition)) {
                this.nextShotCoordinates.push(newPosition);
            }
        }
    }

    // Check if given coords are equal 
    positionEquals(pos1: Position, pos2: Position): boolean {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    // Find out alignement 
    determineShipAlignement(pos1: Position, pos2: Position): string {
        let result = "";

        if (pos1.x < pos2.x) { result = "+x" };
        if (pos1.x > pos2.x) { result = "-x" };
        if (pos1.y < pos2.y) { result = "+y" };
        if (pos1.y < pos2.y) { result = "-y" };

        return result;
    }

    // Get new coordinates based on a position
    AddNewCoordinatesToTempArr(pos1: Position) {
        let nextPos01 = this.validateCoordinate({ x: this.hitList.at(0)!.x! + 1, y: this.hitList.at(0)!.y! });
        let nextPos02 = this.validateCoordinate({ x: this.hitList.at(0)!.x! - 1, y: this.hitList.at(0)!.y! });
        let nextPos03 = this.validateCoordinate({ x: this.hitList.at(0)!.x!, y: this.hitList.at(0)!.y! + 1 });
        let nextPos04 = this.validateCoordinate({ x: this.hitList.at(0)!.x!, y: this.hitList.at(0)!.y! - 1 });

        // Add potential coords to tempArr
        if (typeof nextPos01 !== "boolean") { this.addToTempArr(nextPos01, this.nextShotCoordinates) };
        if (typeof nextPos02 !== "boolean") { this.addToTempArr(nextPos02, this.nextShotCoordinates) };
        if (typeof nextPos03 !== "boolean") { this.addToTempArr(nextPos03, this.nextShotCoordinates) };
        if (typeof nextPos04 !== "boolean") { this.addToTempArr(nextPos04, this.nextShotCoordinates) };

    }

    // Get new coordinates based on a position
    getOneCoordinate(pos1: Position): Position | boolean {
        let nextPos01 = this.validateCoordinate({ x: this.hitList.at(this.hitList.length - 1)!.x! + this.stepCounter, y: this.hitList.at(this.hitList.length - 1)!.y! });
        let nextPos02 = this.validateCoordinate({ x: this.hitList.at(this.hitList.length - 1)!.x! - this.stepCounter, y: this.hitList.at(this.hitList.length - 1)!.y! });

        // Add potential coords to tempArr
        if (typeof nextPos01 !== "boolean" && nextPos01) {
            return nextPos01;
        } else {
            return nextPos02;
        }
    }

    // Validate if coord is within the array field
    validateCoordinate(newPosition: Position): Position | boolean {
        if (newPosition.x > -1 && newPosition.x < 10 && newPosition.y > -1 && newPosition.y < 10) {
            return newPosition
        } else {
            return false;
        }
    }

    // Remove some empty positions from tempArray
    removeSomeEmptyPos() {
        /** 
        * God-Mod cheat. 
        * If 4 possible shot coordinates exist:
        *  - 1 valid coordinate ==> Take out two empty coordinates randomly (to simulate human-like behavior)
        *  - 2 valid coordinates ==> Take out one empty coordinate randomly (to simulate human-like behavior) 
        **/

        // Determine amount of empty coordinates and storage their indeces
        let emptyCoordinates: number = 0;
        let indexOfEmptyCoordinates: number[] = [];
        this.tempArr.forEach(coord => {
            if (this.playerBoard.playfield[coord.y][coord.x] == ".") {
                indexOfEmptyCoordinates.push(emptyCoordinates);
                emptyCoordinates++;
            }
        });

        // Delete some empty coordinates (randomly picked to simulate human-like behavior)
        if (indexOfEmptyCoordinates.length == 3) {
            while (emptyCoordinates > 1) {
                let index: number = Math.floor(Math.random() * indexOfEmptyCoordinates.length);
                this.tempArr.splice(index, 1);
                emptyCoordinates--;
            }
        }
        if (indexOfEmptyCoordinates.length == 2) {
            while (emptyCoordinates > 1) {
                let index: number = Math.floor(Math.random() * indexOfEmptyCoordinates.length);
                this.tempArr.splice(index, 1);
                emptyCoordinates--;
            }
        }
    }

    // Remove a specific position
    removeSpecificPos(pos: Position, arr: Position[]) {
        arr.filter(coord => {
            (coord.x !== pos.x && coord.y !== pos.y);
        });
    }

    // Handle checkHit
    handleCheckHitResult(shotCoordinate: Position): boolean | Ship | string {

        let checkHit = this.playerBoard.checkHit(shotCoordinate, "Ai");

        if (typeof checkHit === "boolean" && checkHit) {
            this.hitList.push(shotCoordinate);
            this.stepCounter++;
            // this.trackAllShots.push(shotCoordinate);
            // Find out alignment
            if (this.stepCounter == 2) {
                // horizontal alignement of shot movement
                this.shipAlignment = this.determineShipAlignement(this.hitList.at(0)!, this.hitList.at(1)!);
                if (this.shipAlignment == "+x") {
                    let newCoord = this.validateCoordinate({ x: this.hitList.at(this.hitList.length)!.x + 1, y: this.hitList.at(this.hitList.length)!.y })
                } else if (this.shipAlignment == "-x") {

                } else if (this.shipAlignment == "+y") {

                } else {

                }
            }
            this.playerShipPositions.filter(coord => {
                (coord.x !== shotCoordinate.x && coord.y !== shotCoordinate.y);
            });
            // this.nextShotCoordinates.filter(coord => {
            //     (coord.x !== shotCoordinate.x && coord.y !== shotCoordinate.y);
            // });
            return true;

            /**
            * Check if checkHit is a ship (means that ship is sunk now) to get new coordinates from playerShipPositions 
            * and to clear up firstHitPosition, lastHitPosition & nextShotCoordinates
            */
        } else if (checkHit instanceof Ship) {
            let ship = checkHit;
            this.shipAlignment = "";

            this.playerShipPositions.filter(coord => {
                (coord.x !== shotCoordinate.x && coord.y !== shotCoordinate.y);
            });
            this.nextShotCoordinates.filter(coord => {
                (coord.x !== shotCoordinate.x && coord.y !== shotCoordinate.y);
            });
            // Remove all coords from ship in this.lastHitPosition
            for (let i = 0; i < ship.initialPositions.length; i++) {
                const shipCoord = ship.initialPositions[i];
                for (let j = 0; j < this.hitList.length; j++) {
                    const hitPosition = this.hitList[j];
                    if (this.positionEquals(shipCoord, hitPosition)) {
                        this.hitList.splice(j, 1);
                        break;
                    }
                }
            }

            if (this.hitList.length == 0) {
                // Reset data 
                this.firstHitPosition = [];
                this.hitList = [];
                this.nextShotCoordinates = [];
                this.trackAllShots = [];
            }
            return ship;

            /**
             * Check if checkHit is a string (means the game is over). 
             */
        } else if (typeof checkHit === "string") {
            let winner = checkHit;
            return winner;
        } else {
            this.nextShotCoordinates.filter(coord => {
                (coord.x !== shotCoordinate.x && coord.y !== shotCoordinate.y);
            });
            this.trackAllShots.push(shotCoordinate);
            return false;
        }
    }

    // Place ships of ai randomly
    // initializeRandomizedAiShipPlacement() {
    //     function generateRandomNumber(min: number, max: number): number {
    //         return Math.floor(Math.random() * (max - min + 1)) + min;
    //     }

    //     function isValidPlacement(board: string[][], ship: Ship): boolean {
    //         if (ship.isHorizontal) {
    //             if (ship.position.x + ship.length > 10) {
    //                 return false;
    //             }
    //             for (let i = 0; i < ship.length; i++) {
    //                 if (board[ship.position.y][ship.position.x + i] === "X") {
    //                     return false;
    //                 }
    //                 if (
    //                     ship.position.y - 1 >= 0 &&
    //                     board[ship.position.y - 1][ship.position.x + i] === "X"
    //                 ) {
    //                     return false;
    //                 }
    //                 if (
    //                     ship.position.y + 1 < 10 &&
    //                     board[ship.position.y + 1][ship.position.x + i] === "X"
    //                 ) {
    //                     return false;
    //                 }
    //             }
    //         } else {
    //             if (ship.position.y + ship.length > 10) {
    //                 return false;
    //             }
    //             for (let i = 0; i < ship.length; i++) {
    //                 if (board[ship.position.y + i][ship.position.x] === "X") {
    //                     return false;
    //                 }
    //                 if (
    //                     ship.position.x - 1 >= 0 &&
    //                     board[ship.position.y + i][ship.position.x - 1] === "X"
    //                 ) {
    //                     return false;
    //                 }
    //                 if (
    //                     ship.position.x + 1 < 10 &&
    //                     board[ship.position.y + i][ship.position.x + 1] === "X"
    //                 ) {
    //                     return false;
    //                 }
    //             }
    //         }
    //         return true;
    //     }

    //     function placeShip(board: string[][], ship: Ship): boolean {
    //         let isPlaced = false;
    //         while (!isPlaced) {
    //             ship.position.x = generateRandomNumber(0, 9);
    //             ship.position.y = generateRandomNumber(0, 9);
    //             ship.isHorizontal = Math.random() < 0.5;
    //             if (isValidPlacement(board, ship)) {
    //                 for (let i = 0; i < ship.length; i++) {
    //                     if (ship.isHorizontal) {
    //                         board[ship.position.y][ship.position.x + i] = "X";
    //                     } else {
    //                         board[ship.position.y + i][ship.position.x] = "X";
    //                     }
    //                 }
    //                 isPlaced = true;
    //             }
    //         }
    //         return isPlaced;
    //     }

    //     function generateBoard(): string[][] {
    //         const board: string[][] = [];
    //         for (let i = 0; i < 10; i++) {
    //             board.push(Array(10).fill(""));
    //         }
    //         return board;
    //     }

    //     function generateShips(): Ship[] {
    //         const ships: Ship[] = [];
    //         let id = 1;
    //         for (let i = 0; i < 2; i++) {
    //             ships.push({
    //                 id: id++,
    //                 length: 2,
    //                 position: { x: -1, y: -1 },
    //                 isHorizontal: false,
    //             });
    //         }
    //         for (let i = 0; i < 2; i++) {
    //             ships.push({
    //                 id: id++,
    //                 length: 3,
    //                 position: { x: -1, y: -1 },
    //                 isHorizontal: false,
    //             });
    //         }
    //         ships.push({
    //             id: id++,
    //             length: 4,
    //             position: { x: -1, y: -1 },
    //             isHorizontal: false,
    //         });
    //         ships.push({
    //             id: id++,
    //             length: 5,
    //             position: { x: -1, y: -1 },
    //             isHorizontal: false,
    //         });
    //         return ships;
    //     }
    // }
}