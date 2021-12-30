#!/usr/bin/env node
import yargs, { number } from 'yargs';
import { runner } from './runner';
import { converter } from './converter';
const argv = yargs(process.argv.slice(2))
  .options({
    seed: {
      describe: 'a seed that randomly generates a initial match state',
      type: 'number',
    },
    loglevel: {
      describe:
        'set logger level. In increasing level / verbosity: 0 is for None. 1 for Errors. 2 for Warnings. 3 for Details. 4 for All',
      default: 2,
      type: 'number',
    },
    memory: {
      describe: 'max memory allowed for the bot in MB',
      default: 4000,
      type: 'number',
    },
    maxtime: {
      describe: 'max time per turn for the bot',
      default: 3000,
      type: 'number',
    },
    tournament: {
      describe: 'run a tournament ranked by Trueskill by default on all file paths which will each be a player and their name will be the same as the path. Will automatically generate replays them in the replays folder if --storeReplay is true. The --seed and --out options are ignored. loglevel is now at the tournament level instead of match level, so no logs are shown for each match by itself. There are a lot of other configuration options for tournament running via this tool, but for those we recommend you just copy the code in src/runner.ts for running a tournament.',
      default: false,
      type: 'boolean'
    },
    rankSystem: {
      describe: 'choice of ranking system to use when running a tournament with --tournament. Can be trueskill, elo, wins',
      default: 'trueskill',
      type: 'string',
    },
    maxConcurrentMatches: {
      describe: 'maximum number of tournament matches runnable at the same time. Recommend to set this no higher than number of CPUs / 2',
      default: 1,
      type: 'number',
    },
    convertToStateful: {
      describe:
        'will convert the passed replay (.json) file into a stateful replay',
      type: 'boolean',
      default: false,
    },
    statefulReplay: {
      describe: 'whether to generate stateful replays',
      type: 'boolean',
      default: false,
    },
    storeLogs: {
      describe: 'whether to store error logs as files',
      type: 'boolean',
      default: true,
    },
    storeReplay: {
      describe: 'whether to store the replay or not',
      default: true,
      type: 'boolean',
    },
    width: {
      describe: 'set a specific width of the map',
      type: 'number',
    },
    height: {
      describe: 'set a specific height of the map',
      type: 'number',
    },
    out: {
      describe: 'where to store the resulting replay file',
      type: 'string',
    },
    python: {
      describe: 'python interpreter to use. default is the default python',
      type: 'string',
      default: 'python'
    }
  })
  .help()
  .parseSync();
export type Args = typeof argv;
// const argv = yargs.argv;
const convertToStateful = argv.convertToStateful;
if (convertToStateful) {
  converter(argv);
} else {
  runner(argv);
}
