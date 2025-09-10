import { EventStore } from "@ricofritzsche/eventstore";
import { StartGame } from "./slices/c_start_game";
import { GetGameState } from "./slices/q_get_game_state";
import { RegisterThrow } from "./slices/c_register_throw";
import { CloseMatch } from "./slices/c_close_match";
import { FinishGame } from "./slices/c_finish_game";
import { OpenMatch } from "./slices/c_open_match";
import { CheckIfMatchIsFinished } from "./slices/q_check_if_match_is_finished";
import { GetMatches, MatchInfo } from "./slices/q_get_matches";

export interface GameState {
    gameOver:boolean, 
    frame:number, 
    roll:number, 
    currentScore:number,
    gameId:string
}


export class Processor {
    private _startGame:StartGame
    private _registerThrow:RegisterThrow
    private _finishGame:FinishGame
    private _getGameState:GetGameState

    private _openMatch:OpenMatch
    private _checkIfMatchIsFinished:CheckIfMatchIsFinished
    private _closeMatch:CloseMatch
    private _getMatches:GetMatches

    constructor(private eventstore: EventStore) {
        this._startGame = new StartGame(this.eventstore);
        this._registerThrow = new RegisterThrow(this.eventstore);
        this._finishGame = new FinishGame(this.eventstore);
        this._getGameState = new GetGameState(this.eventstore);

        this._openMatch = new OpenMatch(this.eventstore);
        this._checkIfMatchIsFinished = new CheckIfMatchIsFinished(this.eventstore);
        this._closeMatch = new CloseMatch(this.eventstore);
        this._getMatches = new GetMatches(this.eventstore);
    }


    async addNewMatch(title:string, playernames:string[], numberOfGamesPerPlayer:number): Promise<{matchId:string, matchinfos:MatchInfo[]}> {
        const matchId = (await this._openMatch.process(title, playernames, numberOfGamesPerPlayer)).matchOpenedId;
        const matchinfos = await this._getMatches.process();
        return {
            matchId,
            matchinfos
        }
    }

    async getMatches(): Promise<MatchInfo[]> {
        return await this._getMatches.process();
    }


    async startGame(playername:string, matchId:string): Promise<{gameId:string, gameState:GameState}> {
        const gameId = (await this._startGame.process(playername, matchId)).gameStartedId;
        const gameState = await this._getGameState.process(gameId);
        return {
            gameId,
            gameState: {
                gameOver: gameState.gameOver !== "running",
                frame: gameState.frame,
                roll: gameState.roll,
                currentScore: gameState.currentScore,
                gameId: gameState.gameStartedId
            }
        }
    }

    async throwPins(numberOfPins:number, gameId:string): Promise<GameState> {
        await this._registerThrow.process(numberOfPins, gameId);
        const gameState = await this._getGameState.process(gameId);
        if (gameState.gameOver === "finished") {
            await this._finishGame.process(gameState.currentScore, gameId);
            const matchinfo = await this._checkIfMatchIsFinished.process(gameState.matchOpenedId);
            if (matchinfo.status === "toBeClosed") {
                await this._closeMatch.process(matchinfo.winningPlayer, matchinfo.matchOpenedId);
            }
        }
        return {
            gameOver: gameState.gameOver !== "running",
            frame: gameState.frame,
            roll: gameState.roll,
            currentScore: gameState.currentScore,
            gameId: gameState.gameStartedId
        }
    }
}