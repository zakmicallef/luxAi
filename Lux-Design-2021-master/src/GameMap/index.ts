import { Cell } from '../GameMap/cell';
import { Unit } from '../Unit';
import { Resource } from '../Resource';
import { LuxMatchConfigs, SerializedState } from '../types';
import { Position } from './position';

export class GameMap {
  public resources: Array<Cell> = [];
  public height: number;
  public width: number;
  /**
   * The actual map
   */
  private map: Array<Array<Cell>>;
  /**
   * Constructor to initialize empty game map with empty cells
   * @param width - width of map
   * @param height - height of map
   */
  constructor(configs: Readonly<LuxMatchConfigs>) {
    this.height = configs.height;
    this.width = configs.width;
    this.map = new Array(this.height);
    for (let y = 0; y < this.height; y++) {
      this.map[y] = new Array(this.width);
      for (let x = 0; x < this.width; x++) {
        // this should be the only time we ever call new Cell(...)
        this.map[y][x] = new Cell(x, y, configs);
      }
    }
  }
  // make resources array order determinstic
  sortResourcesDeterministically(): void {
    const val = Math.max(this.width, this.height) ;
    this.resources.sort((a, b) => {
      return a.pos.x * val + a.pos.y - (b.pos.x * val + b.pos.y);
    });
  }

  addResource(
    x: number,
    y: number,
    resourceType: Resource.Types,
    amount: number
  ): Cell {
    const cell = this.getCell(x, y);
    cell.setResource(resourceType, amount);
    this.resources.push(cell);
    return cell;
  }
  getCellByPos(pos: Position): Cell {
    return this.map[pos.y][pos.x];
  }
  getCell(x: number, y: number): Cell {
    return this.map[y][x];
  }
  getRow(y: number): Array<Cell> {
    return this.map[y];
  }
  getAdjacentCells(cell: Cell): Array<Cell> {
    const cells: Array<Cell> = [];

    // NORTH
    if (cell.pos.y > 0) {
      cells.push(this.getCell(cell.pos.x, cell.pos.y - 1));
    }
    // EAST
    if (cell.pos.x < this.width - 1) {
      cells.push(this.getCell(cell.pos.x + 1, cell.pos.y));
    }
    // SOUTH
    if (cell.pos.y < this.height - 1) {
      cells.push(this.getCell(cell.pos.x, cell.pos.y + 1));
    }
    // WEST
    if (cell.pos.x > 0) {
      cells.push(this.getCell(cell.pos.x - 1, cell.pos.y));
    }
    return cells;
  }

  inMap(pos: Position): boolean {
    return !(
      pos.x < 0 ||
      pos.y < 0 ||
      pos.x >= this.width ||
      pos.y >= this.height
    );
  }

  toStateObject(): SerializedState['map'] {
    const obj: SerializedState['map'] = [];
    for (let y = 0; y < this.height; y++) {
      obj.push([]);
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        const cellData: SerializedState['map'][0][0] = {
          road: cell.getRoad(),
        };
        if (cell.resource) {
          cellData.resource = {
            type: cell.resource.type,
            amount: cell.resource.amount,
          };
        }
        obj[y].push(cellData);
      }
    }
    return obj;
  }

  /**
   * Return printable map string
   */
  getMapString(): string {
    let str = '';
    for (let y = 0; y < this.height; y++) {
      str +=
        this.getRow(y)
          .map((cell) => {
            if (cell.hasUnits()) {
              if (cell.units.size === 1) {
                let unitstr = '';
                cell.units.forEach((unit) => {
                  let identifier = 'w';
                  if (unit.type === Unit.Type.CART) {
                    identifier = 'c';
                  }
                  if (unit.team === Unit.TEAM.A) {
                    unitstr = identifier.cyan;
                  } else {
                    unitstr = identifier.red;
                  }
                });
                return unitstr;
              } else {
                const size = cell.units.size;
                const team = cell.units.values().next().value.team;
                if (team === Unit.TEAM.A) {
                  return `${size}`.cyan;
                } else {
                  return `${size}`.red;
                }
              }
            } else if (cell.hasResource()) {
              switch (cell.resource.type) {
                case Resource.Types.WOOD:
                  return `▩`.yellow;
                case Resource.Types.COAL:
                  return `▩`.gray;
                case Resource.Types.URANIUM:
                  return `▩`.magenta;
              }
            } else if (cell.isCityTile()) {
              if (cell.citytile.team === Unit.TEAM.A) {
                return `▩`.cyan;
              } else {
                return `▩`.red;
              }
            }
            const cd = cell.getRoad();
            if (cd < 1.1) {
              return '0';
            } else if (cd < 2.1) {
              return 'r'.black.bgYellow;
            } else {
              return 'r'.black.bgGreen;
            }
          })
          .join(' ') + '\n';
    }
    return str;
  }
}
export namespace GameMap {
  export enum Types {
    EMPTY = 'empty',
    RANDOM = 'random',
    DEBUG = 'debug',
  }
}
