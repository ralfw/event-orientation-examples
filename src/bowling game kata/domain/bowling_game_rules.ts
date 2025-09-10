export function CalculateGameState(throws: number[]): { gameOver: boolean; frame: number; roll: number; currentScore: number } {
  type Frame = { score:number, awaitingThrows:number, bonusThrowIndexes:number[] };

  const MAX_FRAMES = 10;
  const frames: Frame[] = []
  for(let i=1; i<=MAX_FRAMES+1; i++) {
    frames.push({score:0, awaitingThrows:2, bonusThrowIndexes:[]});
  }

  let frameIndex = 0;
  let rollInFrame = 1;
  for (let throwIndex=0; throwIndex<throws.length; throwIndex++) {
    const pins = throws[throwIndex]!;
    const currentFrame = frames[frameIndex]!;

    currentFrame.score += pins;
    currentFrame.awaitingThrows--;

    const isStrike = currentFrame.score === 10 && rollInFrame === 1 && frameIndex < MAX_FRAMES;
    const isSpare = currentFrame.score === 10 && rollInFrame === 2 && frameIndex < MAX_FRAMES;
    const endOfFrame = isStrike || rollInFrame === 2;

    if (isStrike) {
      currentFrame.bonusThrowIndexes.push(throwIndex+1);
      currentFrame.bonusThrowIndexes.push(throwIndex+2);
    }
    if (isSpare) {
      currentFrame.bonusThrowIndexes.push(throwIndex+1);
    }
    if (endOfFrame) {
      currentFrame.awaitingThrows = 0;
      if (frameIndex == MAX_FRAMES-1) {
        frames[MAX_FRAMES]!.awaitingThrows = currentFrame.bonusThrowIndexes.length;
      }
      frameIndex++;
      rollInFrame = 0;
    }

    rollInFrame++;
  }

  let currentScore = 0;
  for (let frameIndex=0; frameIndex<MAX_FRAMES; frameIndex++) {
    const f = frames[frameIndex]!;

    currentScore += f.score;

    if (f.bonusThrowIndexes.length > 0) {
      currentScore += f.bonusThrowIndexes[0]! < throws.length ? throws[f.bonusThrowIndexes[0]!]! : 0;
      if (f.bonusThrowIndexes.length > 1) {
        currentScore += f.bonusThrowIndexes[1]! < throws.length ? throws[f.bonusThrowIndexes[1]!]! : 0;
      }
    }
  }

  let gameOver = frames[MAX_FRAMES-1]!.awaitingThrows == 0 && frames[MAX_FRAMES]!.awaitingThrows == 0;


  return { gameOver, frame: frameIndex+1, roll: rollInFrame, currentScore };
}


export function DetermineMatchWinner(results:{playername:string, score:number}[]):{playername:string, totalscore:number} {
  const playerScores = new Map<string, number>();

  // total players' scores
  for (let result of results) {
    if (playerScores.has(result.playername)) {
      playerScores.set(result.playername, playerScores.get(result.playername)! + result.score);
    } else {
      playerScores.set(result.playername, result.score);
    }
  }

  // determine winner
  let winner = "";
  let highscore = -1;
  playerScores.forEach((score, playername) => {
    if (score > highscore) {
      winner = playername;
      highscore = score;
    }
  })

  return {
    playername: winner,
    totalscore: highscore,
  }
}
