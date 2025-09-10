import { CalculateGameState } from "../bowling_game_rules";

// to verify results: https://www.bowlinggenius.com/

describe('game without spare or strike', () => {
    it('no rolls in game', async () => {
        const gameState = CalculateGameState([]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(1);
        expect(gameState.roll).toBe(1);
        expect(gameState.currentScore).toBe(0);
    });

    it('some rolls in game', async () => {
        const gameState = CalculateGameState([1,2,3]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(2);
        expect(gameState.roll).toBe(2);
        expect(gameState.currentScore).toBe(6);
    });

    it('game over', async () => {
        const gameState = CalculateGameState([1,1, 2,1, 3,1, 4,1, 5,1, 
                                              6,1, 7,1, 8,1, 9,0, 0,0]);
        expect(gameState.gameOver).toBe(true);
        expect(gameState.currentScore).toBe(53);
    });
});

describe('game with spare', () => {
    it('spare in first frame', async () => {
        const gameState = CalculateGameState([9,1,3,4]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(3);
        expect(gameState.roll).toBe(1);
        expect(gameState.currentScore).toBe(20);
    });

    it('spare in last frame waiting for bonus role', async () => {
        const gameState = CalculateGameState([0,0, 0,0, 0,0, 0,0, 0,0, 
                                              0,0, 0,0, 0,0, 0,0, 9,1]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(11);
        expect(gameState.roll).toBe(1);
        expect(gameState.currentScore).toBe(10);
    });

    it('spare in last frame', async () => {
        const gameState = CalculateGameState([0,0, 0,0, 0,0, 0,0, 0,0, 
                                              0,0, 0,0, 0,0, 0,0, 9,1, 3]);
        expect(gameState.gameOver).toBe(true);
        expect(gameState.currentScore).toBe(13);
    });
});


describe('game with strike', () => {
    it('strike in first frame', async () => {
        const gameState = CalculateGameState([10,1,3]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(3);
        expect(gameState.roll).toBe(1);
        expect(gameState.currentScore).toBe(18);
    });

    it('strike in last frame waiting for first bonus role', async () => {
        const gameState = CalculateGameState([0,0, 0,0, 0,0, 0,0, 0,0, 
                                              0,0, 0,0, 0,0, 0,0, 10]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(11);
        expect(gameState.roll).toBe(1);
        expect(gameState.currentScore).toBe(10);
    });

    it('strike in last frame waiting for second bonus role', async () => {
        const gameState = CalculateGameState([0,0, 0,0, 0,0, 0,0, 0,0, 
                                              0,0, 0,0, 0,0, 0,0, 10, 1]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(11);
        expect(gameState.roll).toBe(2);
        expect(gameState.currentScore).toBe(11);
    });

    it('strike in last frame', async () => {
        const gameState = CalculateGameState([0,0, 0,0, 0,0, 0,0, 0,0, 
                                              0,0, 0,0, 0,0, 0,0, 10, 1,2]);
        expect(gameState.gameOver).toBe(true);
        expect(gameState.currentScore).toBe(13);
    });

    it('all strike game', async () => {
        const gameState = CalculateGameState([10,10,10,10,10, 10,10,10,10,10, 10,10]);
        expect(gameState.gameOver).toBe(true);
        expect(gameState.currentScore).toBe(300);
    });
});


describe('game with spare and strike', () => {
    it('first strike, then spare', async () => {
        const gameState = CalculateGameState([10,9,1,5]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(3);
        expect(gameState.roll).toBe(2);
        expect(gameState.currentScore).toBe(40);
    });
});


describe('error reproductions', () => {
    it('spare + strike + 1', async () => {
        const gameState = CalculateGameState([7,3, 10, 4]);
        expect(gameState.gameOver).toBe(false);
        expect(gameState.frame).toBe(3);
        expect(gameState.roll).toBe(2);
        expect(gameState.currentScore).toBe(38);
    });
});