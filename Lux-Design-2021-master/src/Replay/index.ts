import { Agent, Match, MatchEngine } from 'dimensions-ai';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { GameMap } from '../GameMap';
import pkg from '../configs.json';
import { Game } from '../Game';
import { LuxMatchResults, SerializedState } from '../types';

export class Replay {
  public replayFilePath: string = null;
  public data: {
    seed: number;
    width: number;
    height: number;
    mapType: GameMap.Types;
    results?: LuxMatchResults;
    teamDetails: Array<{
      name: string;
      tournamentID: string;
    }>;
    allCommands: Array<Array<MatchEngine.Command>>;
    stateful?: Array<SerializedState>;
    version: string;
  } = {
    seed: 0,
    allCommands: [],
    mapType: GameMap.Types.RANDOM,
    width: -1,
    height: -1,
    teamDetails: [],
    version: pkg.version,
  };
  public storeReplay = false;
  constructor(
    match: Match,
    public compressReplay: boolean,
    public statefulReplay = false,
    public out: string
  ) {
    const d = new Date().valueOf();
    let replayFileName = `${d}_${match.id}`;
    if (statefulReplay) {
      replayFileName += '_stateful';
    }
    if (compressReplay) {
      replayFileName += '.luxr';
    } else {
      replayFileName += '.json';
    }
    this.replayFilePath = path.join(
      match.configs.storeReplayDirectory,
      replayFileName
    );
    if (out !== undefined) {
      this.replayFilePath = out;
    }
    this.storeReplay = match.configs.storeReplay;
    if (fs.existsSync && this.storeReplay) {
      if (!fs.existsSync(match.configs.storeReplayDirectory)) {
        fs.mkdirSync(match.configs.storeReplayDirectory, { recursive: true });
      }
      fs.writeFileSync(this.replayFilePath, '');
    }
    if (this.statefulReplay) {
      this.data.stateful = [];
    }
  }
  public writeState(game: Game): void {
    const state = game.toStateObject();
    this.data.stateful.push(state);
  }
  public writeTeams(agents: Agent[]): void {
    agents.forEach((agent) => {
      let id = '';
      if (agent.tournamentID && agent.tournamentID.id) {
        id = agent.tournamentID.id;
      }
      this.data.teamDetails.push({
        name: agent.name,
        tournamentID: id,
      });
    });
  }
  public writeOut(results: LuxMatchResults): void {
    this.data.results = results;
    if (!fs.appendFileSync || !this.storeReplay) return;
    if (this.compressReplay) {
      const zipper = new JSZip();
      zipper.file(this.replayFilePath, JSON.stringify(this.data));
      zipper
        .generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: {
            level: 9,
          },
        })
        .then((content) => {
          fs.appendFileSync(this.replayFilePath, content);
        });
    } else {
      fs.appendFileSync(this.replayFilePath, JSON.stringify(this.data));
    }
  }
}
