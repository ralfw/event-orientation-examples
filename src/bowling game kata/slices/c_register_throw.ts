import { EventStore, createFilter } from "@ricofritzsche/eventstore";
import { randomUUID } from 'node:crypto';
import { GameStartedPayload } from "./event_payload_types";

export class RegisterThrow {
    constructor(private eventstore: EventStore) {}

    async process(numberOfPins: number, gameStartedId:string):Promise<{throwRegisteredId:string}> {
        // for simplicity's sake:
        // - not doing a conditional append on game finished
        const gameFilter = createFilter(["GameStarted"], [{gameStartedId}])
        const context = await this.eventstore.query(gameFilter);
        if (context.events.length === 0) throw new Error(`Game not started! Id: ${gameStartedId}`);

        const gameStartedPayload = context.events[0]!.payload as unknown as GameStartedPayload;
        const matchOpenedId = gameStartedPayload.scope.matchOpenedId;

        const throwRegisteredId = randomUUID().toString();
        await this.eventstore.append([{eventType: "ThrowRegistered", payload: {throwRegisteredId, numberOfPins, scope:{gameStartedId, matchOpenedId}}}])
        return {throwRegisteredId};
    }
}
