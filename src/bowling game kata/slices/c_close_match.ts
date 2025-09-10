import { EventStore } from "@ricofritzsche/eventstore";
import { randomUUID } from 'node:crypto';

export class CloseMatch {
    constructor(private eventstore: EventStore) {}

    async process(winningPlayername: string, matchOpenedId:string):Promise<void> {
        // for simplicity's sake:
        // - not checking if event starting the game actually exists
        // - not doing a conditional append
        const matchClosedId = randomUUID().toString();
        await this.eventstore.append([{eventType: "MatchClosed", payload: {matchClosedId, winningPlayername, scope:{matchOpenedId}}}])
    }
}