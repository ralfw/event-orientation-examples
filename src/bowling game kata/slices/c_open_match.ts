import { EventStore } from "@ricofritzsche/eventstore";
import { randomUUID } from 'node:crypto';

export class OpenMatch {
    constructor(private eventstore: EventStore) {}

    async process(title: string, playernames:string[], gamesPerPlayer:number):Promise<{matchOpenedId:string}> {
        const matchOpenedId = randomUUID().toString();
        await this.eventstore.append([{eventType: "MatchOpened", payload: {matchOpenedId, title, playernames, gamesPerPlayer}}])
        return {matchOpenedId};
    }
}