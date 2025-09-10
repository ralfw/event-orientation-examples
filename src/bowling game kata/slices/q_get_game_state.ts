import { EventStore, createFilter, createQuery } from "@ricofritzsche/eventstore";
import { CalculateGameState } from "../domain/bowling_game_rules";
import { GameFinishedPayload, GameStartedPayload } from "./event_payload_types";

export interface GameState { 
    gameOver:("inexistent"|"running"|"finished"), 
    frame:number, 
    roll:number, 
    currentScore:number,
    gameStartedId:string,
    matchOpenedId:string
}

export class GetGameState {
    constructor(private eventstore: EventStore) {}

    async process(gameStartedId: string):Promise<GameState> {
        const query = createQuery(
                            createFilter(["GameStarted"], [{gameStartedId}]),
                            createFilter(["ThrowRegistered", "GameFinished"], [{scope:{gameStartedId}}]));
        const context = await this.eventstore.query(query);

        // has the game even started?
        if (context.events.length === 0) {
            return {
                gameOver: "inexistent",
                frame: 0,
                roll: 0,
                currentScore: 0,
                gameStartedId,
                matchOpenedId: ""
            }
        }

        const gameStarted = context.events.find((e) => e.eventType == "GameStarted");
        const payload = gameStarted!.payload as unknown as GameStartedPayload;
        let matchOpenedId = payload.scope.matchOpenedId

        // or is the game finished already?
        const gameFinished = context.events.find((e) => e.eventType == "GameFinished");
        if (gameFinished) {
            const payload = gameFinished.payload as unknown as GameFinishedPayload;
            return {
                gameOver: "finished",
                frame: 0,
                roll: 0,
                currentScore: payload.score,
                gameStartedId,
                matchOpenedId
            }
        }

        // the game is still running!
        // the current frame, roll, and score have to be calculated from the pins
        // knocked down with each throw
        const pins = context.events.filter((e) => e.eventType == "ThrowRegistered")
                                  .map((e) => e.payload.numberOfPins as number);


        const gameState = CalculateGameState(pins);

        return {
            gameOver: gameState.gameOver ? "finished" : "running",
            frame: gameState.frame,
            roll: gameState.roll,
            currentScore: gameState.currentScore,
            gameStartedId,
            matchOpenedId
        }
    }
}