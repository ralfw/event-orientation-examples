export interface GameStartedPayload {
    gameStartedId: string;
    playername: string;
    scope: { matchOpenedId: string; };
}

export interface ThrowRegisteredPayload {
    throwRegisteredId: string;
    numberOfPins: number;
    scope: { gameStartedId: string; matchOpenedId: string; };
}

export interface GameFinishedPayload {
    gameFinishedId: string;
    score: number;
    scope: { gameStartedId: string; matchOpenedId: string; };
}

export interface MatchOpenedPayload {
    matchOpenedId: string;
    title: string;
    playernames: string[];
    gamesPerPlayer: number;
}

export interface MatchClosedPayload {
    matchClosedId: string;
    winningPlayername: string;
    scope: { matchOpenedId: string; };
}