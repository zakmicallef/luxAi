import { create, Logger, Match, MatchEngine } from "dimensions-ai";
import readline from "readline";
import {
  LuxDesign,
  LuxDesignLogic,
  LuxMatchConfigs,
  LuxMatchState,
} from "../lib/es6";
import { DeepPartial } from "dimensions-ai/lib/main/utils/DeepPartial";

const lux2021 = new LuxDesign("lux_ai_2021");

//typescript will complain if dimensions is one version but lux ai is built using another one
const myDimension = create(lux2021, {
  name: "Lux AI 2021",
  loggingLevel: Logger.LEVEL.NONE,
  activateStation: false,
  observe: false,
  createBotDirectories: false,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

const main = async () => {
  let match: Match = null;
  for await (const line of rl) {
    const json = JSON.parse(line);

    // initialize a match
    if (json.type && json.type === "start") {
      let mapwidth = parseInt(json.config.width);
      let mapheight = parseInt(json.config.height);
      if (mapwidth == -1) {
        mapwidth = undefined;
      }
      if (mapheight == -1) {
        mapheight = undefined;
      }
      const configs: DeepPartial<LuxMatchConfigs & Match.Configs> = {
        detached: true,
        agentOptions: { detached: true },
        storeReplay: false,
        storeErrorLogs: false,
        loggingLevel: parseInt(json.config.loglevel),
        width: mapwidth,
        height: mapheight,
        seed: parseInt(json.config.seed),
        mapType: json.config.mapType,
        parameters: {
          MAX_DAYS: json.config.episodeSteps,
        },
      };
      match = await myDimension.createMatch(
        [
          {
            file: "blank",
            name: "team-0",
          },
          {
            file: "blank",
            name: "team-1",
          },
        ],
        configs
      );
      if (json.state) {
        LuxDesignLogic.reset(match, json.state);
      }

      match.agents.forEach((agent, i) => {
        console.error(JSON.stringify(agent.messages));
        agent.messages = [];
      });

      const state: LuxMatchState = match.state;
      console.error(
        JSON.stringify({
          width: state.game.map.width,
          height: state.game.map.height,
          globalCityIDCount: state.game.globalCityIDCount,
          globalUnitIDCount: state.game.globalUnitIDCount
        })
      );
      
    } else if (json.length) {
      const agents = [0, 1];
      const commandsList: Array<MatchEngine.Command> = [];
      agents.forEach((agentID) => {
        if (json[agentID].action) {
          const agentCommands = json[agentID].action.map((action: string) => {
            return { agentID: agentID, command: action };
          });
          commandsList.push(...agentCommands);
        }
      });
      const status = await match.step(commandsList);

      // log the match state back to kaggle's interpreter
      match.agents.forEach((agent) => {
        console.error(JSON.stringify(agent.messages));
        agent.messages = [];
      });

      // tell kaggle interpreter about match status and some id values
      const state: LuxMatchState = match.state;
      console.error(
        JSON.stringify({
          width: state.game.map.width,
          height: state.game.map.height,
          globalCityIDCount: state.game.globalCityIDCount,
          globalUnitIDCount: state.game.globalUnitIDCount
        })
      );
      console.error(
        JSON.stringify({
          status: status,
          turn: state.game.state.turn,
          max: match.configs.parameters.MAX_DAYS,
        })
      );
    }
  }
};

main();