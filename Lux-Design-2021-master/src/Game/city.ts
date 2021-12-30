import { Unit } from '../Unit';
import { Cell } from '../GameMap/cell';
import { LuxMatchConfigs } from '../types';
import { Game } from '.';
import { Actionable } from '../Actionable';
import { SpawnCartAction, SpawnWorkerAction, ResearchAction } from '../Actions';
import { Position } from '../GameMap/position';

/**
 * A city is composed of adjacent city tiles of the same team
 */
export class City {
  /**
   * fuel stored in city
   */
  public fuel = 0;
  /**
   * the map cells that compose this city
   */
  public citycells: Array<Cell> = [];
  public id: string;

  constructor(
    public team: Unit.TEAM,
    public configs: Readonly<LuxMatchConfigs>,
    idcount: number
  ) {
    this.id = 'c_' + idcount;
  }

  getLightUpkeep(): number {
    return (
      this.citycells.length * this.configs.parameters.LIGHT_UPKEEP.CITY -
      this.getAdjacencyBonuses()
    );
  }

  getAdjacencyBonuses(): number {
    let bonus = 0;
    this.citycells.forEach((cell) => {
      bonus +=
        cell.citytile.adjacentCityTiles *
        this.configs.parameters.CITY_ADJACENCY_BONUS;
    });
    return bonus;
  }

  addCityTile(cell: Cell): void {
    this.citycells.push(cell);
  }
}

export class CityTile extends Actionable {
  /** the id of the city this tile is a part of */
  public cityid: string;

  public pos: Position = null;

  /** dynamically updated counter for number of friendly adjacent city tiles */
  public adjacentCityTiles = 0;
  constructor(public team: Unit.TEAM, configs: LuxMatchConfigs) {
    super(configs);
  }

  // for validation purposes
  getTileID(): string {
    return `${this.cityid}_${this.pos.x}_${this.pos.y}`;
  }

  canBuildUnit(): boolean {
    return this.canAct();
  }

  canResearch(): boolean {
    return this.canAct();
  }

  turn(game: Game): void {
    if (this.currentActions.length === 1) {
      const action = this.currentActions[0];
      if (action instanceof SpawnCartAction) {
        game.spawnCart(action.team, action.x, action.y);
        this.resetCooldown();
      } else if (action instanceof SpawnWorkerAction) {
        game.spawnWorker(action.team, action.x, action.y);
        this.resetCooldown();
      } else if (action instanceof ResearchAction) {
        this.resetCooldown();
        game.state.teamStates[this.team].researchPoints++;
        if (
          game.state.teamStates[this.team].researchPoints >=
          this.configs.parameters.RESEARCH_REQUIREMENTS.COAL
        ) {
          game.state.teamStates[this.team].researched.coal = true;
        }
        if (
          game.state.teamStates[this.team].researchPoints >=
          this.configs.parameters.RESEARCH_REQUIREMENTS.URANIUM
        ) {
          game.state.teamStates[this.team].researched.uranium = true;
        }
      }
    }
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }

  resetCooldown(): void {
    this.cooldown = this.configs.parameters.CITY_ACTION_COOLDOWN;
  }
}
