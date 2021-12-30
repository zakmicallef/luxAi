import chai from 'chai';
import 'mocha';
const expect = chai.expect;
import { Game } from '../src/Game';
import { MoveAction } from '../src';

describe('Test cooldown computations', () => {
  let game: Game;
  beforeEach(() => {
    game = new Game({
      width: 16,
      height: 16,
    });
  });
  it('should reduce cooldown by 1 and road level at the start of each turn', () => {
    const cell = game.map.getCell(4, 4);
    cell.road = 3;
    const w1 = game.spawnWorker(0, 4, 4);
    w1.cooldown = 4;
    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0);
    const cell2 = game.map.getCell(5, 5);
    cell2.road = 0;
    const w2 = game.spawnWorker(0, 5, 5);
    w2.cooldown = 2;
    w2.handleTurn(game);
    game.runCooldowns();
    expect(w2.cooldown).to.equal(1);
  });
  it('should reduce cooldown by 1 and road level to minimum of 0', () => {
    const cell = game.map.getCell(4, 4);
    cell.road = 6;
    const w1 = game.spawnWorker(0, 4, 4);
    w1.cooldown = 2;
    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0);
  });
  it('should reduce cooldown by 1 and partial road level', () => {
    const cell = game.map.getCell(4, 4);
    cell.road = 0.5
    const w1 = game.spawnWorker(0, 4, 4);
    w1.cooldown = 2;
    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0.5);
  });
  it('should reduce cooldown correctly for moving cart', () => {
    const cell = game.map.getCell(4, 4);
    const cell2 = game.map.getCell(4, 3);
    cell2.road = 0.5;
    const w1 = game.spawnCart(0, 4, 4);

    // handle partial road, and check that cooldown is lost and gained before road is upgraded
    w1.cooldown = 0.5;
    w1.giveAction(new MoveAction(Game.ACTIONS.MOVE, 0, w1.id, Game.DIRECTIONS.NORTH, game.map.getCell(4, 3)));
    w1.handleTurn(game);
    game.runCooldowns();
    // cooldown goes down by new road level of 1.25 and then base 1, so 3.5 to 1.25
    expect(w1.cooldown).to.equal(1.25);
    expect(cell.road).to.equal(0);
    // road upgraded at end of turn from 0.5 to 1.25
    expect(cell2.road).to.equal(1.25);

    // stay still, reduce cooldown by 1 + 2 = 3, upgrade road to 1.25 + 0.75 = 2
    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0);
    expect(cell2.road).to.equal(2);

    // still again, road should be level 2+0.75=2.75 and cooldown 0
    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0);
    expect(cell2.road).to.equal(2.75);
  });
  it('should reduce cooldown correctly for moving cart with no target road to begin with', () => {
    const cell = game.map.getCell(4, 4);
    const cell2 = game.map.getCell(4, 3);
    cell.road = 6;
    cell2.road = 0;
    const w1 = game.spawnCart(0, 4, 4);

    // this is like cart just moving out of city.
    w1.cooldown = 0;
    w1.giveAction(new MoveAction(Game.ACTIONS.MOVE, 0, w1.id, Game.DIRECTIONS.NORTH, game.map.getCell(4, 3)));
    w1.handleTurn(game);
    w1.cooldown = 4.5; // cant happen, just for testing
    game.runCooldowns();
    // cooldown goes down by new road level of 0.75 and then base 1, so 4 to 2.25
    expect(w1.cooldown).to.equal(2.75);
    expect(cell.road).to.equal(6);
    // road upgraded at end of turn to 0.75
    expect(cell2.road).to.equal(0.75);

    w1.handleTurn(game);
    expect(w1.cooldown).to.equal(2.75); // should not change if turned is handled..
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0.25);
    expect(cell2.road).to.equal(1.5);

    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0);
    expect(cell2.road).to.equal(2.25);
  });
  it('should reduce cooldown correctly for moving cart that has 0.5 CD with no target road to begin with', () => {
    const cell = game.map.getCell(4, 4);
    const cell2 = game.map.getCell(4, 3);
    cell.road = 6;
    cell2.road = 0;
    const w1 = game.spawnCart(0, 4, 4);

    // this is like cart just moving out of city.
    w1.cooldown = 0.5;
    w1.giveAction(new MoveAction(Game.ACTIONS.MOVE, 0, w1.id, Game.DIRECTIONS.NORTH, game.map.getCell(4, 3)));
    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(1.75);
    expect(cell.road).to.equal(6);
    expect(cell2.road).to.equal(0.75);

    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0);
    expect(cell2.road).to.equal(1.5);

    w1.handleTurn(game);
    game.runCooldowns();
    expect(w1.cooldown).to.equal(0);
    expect(cell2.road).to.equal(2.25);
  });
});