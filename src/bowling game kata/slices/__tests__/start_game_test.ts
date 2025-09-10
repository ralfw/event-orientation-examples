import { MemoryEventStore, createFilter, createQuery } from '@ricofritzsche/eventstore';
import { StartGame } from '../c_start_game';
import { GetGameState } from '../q_get_game_state';

describe('start game interaction', () => {
    const es = new MemoryEventStore();

    it('frame 1 after game started', async () => {
        const sg = new StartGame(es);
        const gameStartedId = (await sg.process("player1", "mo1")).gameStartedId;

        const gs = new GetGameState(es);
        const gameState = await gs.process(gameStartedId);

        expect(gameState.gameOver).toBe('running');
        expect(gameState.frame).toBe(1);
        expect(gameState.roll).toBe(1);
        expect(gameState.currentScore).toBe(0);
    });

    it('inexistent game', async () => {
        const gs = new GetGameState(es);
        const gameState = await gs.process("inexistent game id");

        expect(gameState.gameOver).toBe('inexistent');
    });
  });