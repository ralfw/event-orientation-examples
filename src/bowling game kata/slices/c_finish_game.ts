import { EventStore, createFilter, createQuery } from "@ricofritzsche/eventstore";
import { GameStartedPayload } from "./event_payload_types";
import { randomUUID } from 'node:crypto';

export class FinishGame {
    constructor(private eventstore: EventStore) {}

    async process(score: number, gameStartedId:string) {
        const context = await this.eventstore.query(createQuery(createFilter(["GameStarted"], [{gameStartedId}]),
                                                    createFilter(["GameFinished"], [{scope:{gameStartedId}}])));

        const contextModel = {gameStarted:false, gameFinished:false, matchOpenedId:""};

        for (const event of context.events) {
            if (event.eventType === "GameStarted") {
                const gameStartedPayload = event.payload as unknown as GameStartedPayload;
                contextModel.matchOpenedId = gameStartedPayload.scope.matchOpenedId;
                contextModel.gameStarted = true;
            }
            if (event.eventType === "GameFinished") {
                contextModel.gameFinished = true;
            }
        }

        if (!contextModel.gameStarted) throw new Error("Game not started! Id: " + gameStartedId);
        if (contextModel.gameFinished) return; // ensure idempotency

        const gameFinishedId = randomUUID().toString();
        await this.eventstore.append([{eventType: "GameFinished", payload: {gameFinishedId, score, scope:{gameStartedId, matchOpenedId:contextModel.matchOpenedId}}}])
    }
}