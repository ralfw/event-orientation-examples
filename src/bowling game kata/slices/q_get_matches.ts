import { EventStore, createFilter, createQuery } from "@ricofritzsche/eventstore";
import { GameStartedPayload, MatchClosedPayload, MatchOpenedPayload } from "./event_payload_types";

export interface MatchInfo{
    title:string, 
    numberOfPlayers:number, 
    numberOfGames:number, 
    winningPlayer:string, 
    finished:boolean, 
    matchOpenedId:string
}

export class GetMatches {
    constructor(private eventstore: EventStore) {}

    async process():Promise<MatchInfo[]> {
        const query = createQuery(createFilter(["MatchOpened", "MatchClosed", "GameStarted"]));
        const context = await this.eventstore.query(query);

        const contextModel = new Map<string, MatchInfo>();
        for (const event of context.events) {
            if (event.eventType === "MatchOpened") {
                const payload = event.payload as unknown as MatchOpenedPayload;
                contextModel.set(payload.matchOpenedId, {
                    title: payload.title,
                    numberOfPlayers: payload.playernames.length,
                    numberOfGames: 0,
                    winningPlayer: "",
                    finished: false,
                    matchOpenedId: payload.matchOpenedId,
                });
            }
            if (event.eventType === "MatchClosed") {
                const payload = event.payload as unknown as MatchClosedPayload;
                const match = contextModel.get(payload.scope.matchOpenedId);
                match!.finished = true;
                match!.winningPlayer = payload.winningPlayername;
            }
            if (event.eventType === "GameStarted") {
                const payload = event.payload as unknown as GameStartedPayload;
                const match = contextModel.get(payload.scope.matchOpenedId);
                match!.numberOfGames++;
            }
        }

        return Array.from(contextModel.values());
    }
}