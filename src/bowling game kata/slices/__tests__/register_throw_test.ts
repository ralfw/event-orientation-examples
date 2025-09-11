import { MemoryEventStore, createFilter, createQuery } from '@ricofritzsche/eventstore';
import { StartGame } from '../c_start_game';
import { RegisterThrow } from '../c_register_throw';
import { GetGameState } from '../q_get_game_state';

describe('registering a couple of throws', () => {
    const es = new MemoryEventStore();

    it('first throw', async () => {
        const sg = new StartGame(es);
        const rt = new RegisterThrow(es);
        const gs = new GetGameState(es);

        const gameStartedId = (await sg.process("player1", "mo1")).gameStartedId;
        await rt.process(7, gameStartedId);
        const gameState = await gs.process(gameStartedId);

        expect(gameState.gameOver).toBe('running');
        expect(gameState.frame).toBe(1);
        expect(gameState.roll).toBe(2);
        expect(gameState.currentScore).toBe(7);
    });

    it('a couple of throws into the game with spare and strike', async () => {
        // arrange
        const sut = new GetGameState(es);

        const matchOpenedId = "mo0";
        const gameStartedId = "gs1";
        es.append([
            {eventType: "GameStarted", payload: {gameStartedId, playername:"Peter", scope:{matchOpenedId}}},
            {eventType: "ThrowRegistered", payload: {throwRegisteredId: "tr1", numberOfPins: 7, scope:{gameStartedId, matchOpenedId}}},
            {eventType: "ThrowRegistered", payload: {throwRegisteredId: "tr2", numberOfPins: 3, scope:{gameStartedId, matchOpenedId}}},
            {eventType: "ThrowRegistered", payload: {throwRegisteredId: "tr3", numberOfPins: 10, scope:{gameStartedId, matchOpenedId}}},
            {eventType: "ThrowRegistered", payload: {throwRegisteredId: "tr4", numberOfPins: 4, scope:{gameStartedId, matchOpenedId}}},
        ])

        // act
        const gameState = await sut.process(gameStartedId);

        // assert
        expect(gameState.gameOver).toBe('running');
        expect(gameState.frame).toBe(3);
        expect(gameState.roll).toBe(2);
        expect(gameState.currentScore).toBe(38);
    });

    it('a full game', async () => {
        const sg = new StartGame(es);
        const rt = new RegisterThrow(es);
        const gs = new GetGameState(es);

        const gameStartedId = (await sg.process("player1", "mo1")).gameStartedId;
        for (let i=1; i<=18; i++)
            await rt.process(0, gameStartedId);
        await rt.process(3, gameStartedId);
        await rt.process(6, gameStartedId); // frame 10
        const gameState = await gs.process(gameStartedId);

        expect(gameState.gameOver).toBe('finished');
        expect(gameState.currentScore).toBe(9);
    });
  });