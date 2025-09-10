import { MemoryEventStore, createFilter, createQuery } from '@ricofritzsche/eventstore';
import { OpenMatch } from '../c_open_match';
import { CheckIfMatchIsFinished } from '../q_check_if_match_is_finished';
import { RegisterThrow } from '../c_register_throw';
import { StartGame } from '../c_start_game';

describe('add new match interaction', () => {
    const es = new MemoryEventStore();

    it('adding a match', async () => {
        const om = new OpenMatch(es);
        const cm = new CheckIfMatchIsFinished(es);

        const matchOpenedId = (await om.process("xmas 25", ["Peter", "Mary"], 3)).matchOpenedId;
        const result = await cm.process(matchOpenedId);

        expect(result.matchOpenedId).toBe(matchOpenedId);
        expect(result.status).toBe("open");
        expect(result.winningPlayer).toBe("");
    });

    it('checking non-existent match', async () => {
        const cm = new CheckIfMatchIsFinished(es);

        const result = await cm.process("moxyz");

        expect(result.status).toBe("nonexistent");
    });
  });
import { FinishGame } from '../c_finish_game';
import { CloseMatch } from '../c_close_match';
import { GetMatches } from '../q_get_matches';
import { GetGameState } from '../q_get_game_state';

describe('add new match interaction', () => {
    const es = new MemoryEventStore();

    it('playing a match until it is finished', async () => {
        const om = new OpenMatch(es);
        const cimif = new CheckIfMatchIsFinished(es);
        const cm = new CloseMatch(es);
        const gm = new GetMatches(es);


        const matchOpenedId = (await om.process("xmas 25", ["Peter", "Mary"], 2)).matchOpenedId;
        let matchinfo = await cimif.process(matchOpenedId);
        expect(matchinfo.status).toBe("open");

        let matches = await gm.process();
        expect(matches.length).toBe(1);
        expect(matches[0]!.matchOpenedId).toBe(matchOpenedId);
        expect(matches[0]!.numberOfGames).toBe(0);

        await playGame(matchOpenedId, "Peter", 1);

        matchinfo = await cimif.process(matchOpenedId);
        expect(matchinfo.status).toBe("open");
        matches = await gm.process();
        expect(matches[0]!.numberOfGames).toBe(1);

        await playGame(matchOpenedId, "Mary", 2);
        await playGame(matchOpenedId, "Peter", 3);

        matchinfo = await cimif.process(matchOpenedId);
        expect(matchinfo.status).toBe("open");
        matches = await gm.process();
        expect(matches[0]!.numberOfGames).toBe(3);

        await playGame(matchOpenedId, "Mary", 4);

        matchinfo = await cimif.process(matchOpenedId);
        expect(matchinfo.status).toBe("toBeClosed");
        expect(matchinfo.winningPlayer).toBe("Mary");
        matches = await gm.process();
        expect(matches[0]!.numberOfGames).toBe(4);

        await cm.process(matchinfo.winningPlayer, matchOpenedId);

        matchinfo = await cimif.process(matchOpenedId);
        expect(matchinfo.status).toBe("closed");
        expect(matchinfo.winningPlayer).toBe("Mary");
        matches = await gm.process();
        expect(matches[0]!.numberOfGames).toBe(4);
        expect(matches[0]!.winningPlayer).toBe("Mary");
    });

    
    async function playGame(matchOpenedId:string, playername:string, pinsPerThrow: number) {
        const sg = new StartGame(es);
        const fg = new FinishGame(es);
        const rt = new RegisterThrow(es);
        const ggs = new GetGameState(es);

        const gameStartedId = (await sg.process(playername, matchOpenedId)).gameStartedId;
        for (let i = 0; i < 20; i++) {
            await rt.process(pinsPerThrow, gameStartedId);
        }
        const state = await ggs.process(gameStartedId);
        expect(state.gameOver).toBe("finished");
        expect(state.currentScore).toBe(10 * 2 * pinsPerThrow);
        await fg.process(state.currentScore, gameStartedId);
    }
});