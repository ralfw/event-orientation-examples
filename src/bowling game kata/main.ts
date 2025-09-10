import { MemoryEventStore } from '@ricofritzsche/eventstore';
import { MatchInfo } from './slices/q_get_matches';
import { Processor } from './processor';

import inquirer from 'inquirer';

async function main() {
    const eventstore = new MemoryEventStore();
    const processor = new Processor(eventstore);

    console.log("Welcome to your bowling alley! Let's get a ball rolling...\n\n")

    console.log("Note: All matches require 2 games per player!\n")

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What is the title of the match?'
        },
        {
            type: 'input',
            name: 'players',
            message: 'What are the players\' names?',
            validate: (input) => {
                const players = input.split(/[, ]+/);
                if (players.length < 2) {
                    return 'You need to enter 2 players at least!';
                }
                return true;
            },
            filter: (input: string) => input.split(/[, ]+/).map(p => p.trim())
        }
    ]);

    const newMatchInfo = await processor.addNewMatch(answers.title, answers.players, 2);
    for (let matchinfo of newMatchInfo.matchinfos) {
        console.log(`${matchinfo.title} | ${matchinfo.numberOfPlayers} players | ${matchinfo.numberOfGames} games | ${matchinfo.finished ? "winner: " + matchinfo.winningPlayer : ""}`)
    }

    while (true) {
        const { startNewGame } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'startNewGame',
                message: 'Do you want to start a new game?',
                default: true
            }
        ]);
        if (!startNewGame) break;

        const { playername } = await inquirer.prompt([
            {
                type: 'input',
                name: 'playername',
                message: 'Whose turn is it?'
            }
        ]);

        let {gameId, gameState} = await processor.startGame(playername, newMatchInfo.matchinfos[0]!.matchOpenedId);

        while(true) {
            // ask for the next throw for the game
            const { numberOfPins } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'numberOfPins',
                    message: `Make throw ${gameState.frame}.${gameState.roll}. Pins knocked down?`
                }
            ]);

            gameState = await processor.throwPins(parseInt(numberOfPins), gameId);
            console.log(`  Score: ${gameState.currentScore}`)

            if (gameState.gameOver) {
                console.log(`*** Game over! ***\n`);
                break;
            }
        }


        const matchinfos = await processor.getMatches();
        for (let matchinfo of matchinfos) {
            console.log(`${matchinfo.title} | ${matchinfo.numberOfPlayers} players | ${matchinfo.numberOfGames} games | ${matchinfo.finished ? "winner: " + matchinfo.winningPlayer : ""}`)
        }
    }
}

main()
