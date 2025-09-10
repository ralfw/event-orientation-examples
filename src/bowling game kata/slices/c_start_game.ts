import { EventStore } from "@ricofritzsche/eventstore";
import { randomUUID } from 'node:crypto';

export class StartGame {
    constructor(private eventstore: EventStore) {}

    async process(playername: string, matchOpenedId: string):Promise<{gameStartedId:string}> {
        const gameStartedId = randomUUID().toString();
        await this.eventstore.append([{eventType: "GameStarted", payload: {gameStartedId, playername, scope: {matchOpenedId}}}])
        return {gameStartedId};
    }
}