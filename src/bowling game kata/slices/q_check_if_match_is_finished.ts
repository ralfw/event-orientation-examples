import { EventStore, createFilter, createQuery } from "@ricofritzsche/eventstore";
import { GameFinishedPayload, GameStartedPayload, MatchClosedPayload, MatchOpenedPayload } from "./event_payload_types";
import { DetermineMatchWinner } from "../domain/bowling_game_rules";

export interface MatchFinishedInfo {
    matchOpenedId: string;
    status: ("nonexistent" | "open" | "closed" | "toBeClosed");
    winningPlayer: string;
}

export class CheckIfMatchIsFinished {
    constructor(private eventstore: EventStore) {}

    async process(matchOpenedId:string):Promise<MatchFinishedInfo> {
        const query = createQuery(createFilter(["MatchOpened"],[{matchOpenedId}]),
                                  createFilter(["MatchClosed", "GameStarted", "GameFinished"], [{scope:{matchOpenedId}}]));
        const context = await this.eventstore.query(query);

        const info:MatchFinishedInfo = {
            matchOpenedId,
            status: "nonexistent",
            winningPlayer: "",
        };
        let numberOfGamesFinished = 0;
        let numberOfGamesToPlay = 0;

        let results:Map<string,{playername:string, score:number}> = new Map();

        for (const event of context.events) {
            if (event.eventType === "MatchOpened") {
                const payload = event.payload as unknown as MatchOpenedPayload;
                info.status = "open"
                numberOfGamesToPlay = payload.gamesPerPlayer * payload.playernames.length;
            }
            if (event.eventType === "MatchClosed") {
                const payload = event.payload as unknown as MatchClosedPayload;
                info.status = "closed";
                info.winningPlayer = payload.winningPlayername;
            }
            if (event.eventType === "GameStarted") {
                const payload = event.payload as unknown as GameStartedPayload;
                results.set(payload.gameStartedId, {playername: payload.playername, score: 0});
            }
            if (event.eventType === "GameFinished") {
                const payload = event.payload as unknown as GameFinishedPayload;
                results.get(payload.scope.gameStartedId as string)!.score = payload.score;
                numberOfGamesFinished++;
            }
        }

        if (info.status === "open") {
            if (numberOfGamesFinished === numberOfGamesToPlay) {
                info.status = "toBeClosed";

                const win = DetermineMatchWinner(Array.from(results.values()));
                info.winningPlayer = win.playername;
            }
        }

        return info;
    }
}