import chai from 'chai';
import 'mocha';
const expect = chai.expect;
import { Game } from '../src/Game';
import { Resource } from '../src/Resource';
import { DEFAULT_CONFIGS } from '../src/defaults';

describe('Test resource collection and distribution', () => {
  let game: Game;
  const rates = DEFAULT_CONFIGS.parameters.WORKER_COLLECTION_RATE;
  beforeEach(() => {
    game = new Game({
      width: 16,
      height: 16,
    });
  });
  it('should distribute evenly given all workers have space and abundance of resource', () => {
    const cell = game.map.getCell(4, 4);
    cell.setResource(Resource.Types.WOOD, rates.WOOD * 10);
    const w1 = game.spawnWorker(0, 4, 4);
    const w2 = game.spawnWorker(1, 4, 5);
    game.distributeAllResources();
    expect(w1.cargo.wood).to.equal(rates.WOOD);
    expect(w2.cargo.wood).to.equal(rates.WOOD);
    expect(cell.resource.amount).to.equal(rates.WOOD * 8);
  });

  it('should distribute evenly given all workers have space and limited resources ', () => {
    const cell = game.map.getCell(4, 4);
    cell.setResource(Resource.Types.WOOD, rates.WOOD);
    const w1 = game.spawnWorker(0, 4, 4);
    const w2 = game.spawnWorker(1, 4, 5);
    game.distributeAllResources();
    expect(w1.cargo.wood).to.equal(Math.floor(rates.WOOD / 2));
    expect(w2.cargo.wood).to.equal(Math.floor(rates.WOOD / 2));
    expect(cell.resource.amount).to.equal(0);
  });
  it('should distribute evenly given all workers have space and limited odd resources ', () => {
    const cell = game.map.getCell(4, 4);
    cell.setResource(Resource.Types.WOOD, rates.WOOD + 1);
    const w1 = game.spawnWorker(0, 4, 4);
    const w2 = game.spawnWorker(1, 4, 5);
    game.distributeAllResources();
    expect(w1.cargo.wood).to.equal(Math.floor(rates.WOOD / 2));
    expect(w2.cargo.wood).to.equal(Math.floor(rates.WOOD / 2));
    expect(cell.resource.amount).to.equal(0);
  });

  it('should distribute evenly given some workers have limited space and abundance of resources ', () => {
    const cell = game.map.getCell(4, 4);
    cell.setResource(Resource.Types.WOOD, rates.WOOD * 10);
    const w1 = game.spawnWorker(0, 4, 4);
    w1.cargo.wood =
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER - rates.WOOD / 2;
    const w2 = game.spawnWorker(1, 4, 5);
    const w3 = game.spawnWorker(1, 4, 3);
    game.distributeAllResources();
    // shouldn't be able to go over cargo capacity and only mine half as much as usual
    expect(w1.cargo.wood).to.equal(
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER
    );
    // while w1 takes less resources, it should still get max rates.WOOD
    expect(w2.cargo.wood).to.equal(Math.floor(rates.WOOD));
    expect(w3.cargo.wood).to.equal(Math.floor(rates.WOOD));
    expect(cell.resource.amount).to.equal(rates.WOOD * 7.5);
  });

  it('should distribute evenly given some workers have limited space and limited resources ', () => {
    const cell = game.map.getCell(4, 4);
    cell.setResource(Resource.Types.WOOD, rates.WOOD);
    const w1 = game.spawnWorker(0, 4, 4);
    w1.cargo.wood =
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER -
      Math.floor(rates.WOOD / 6);
    const w2 = game.spawnWorker(1, 4, 5);
    const w3 = game.spawnWorker(1, 4, 3);
    game.distributeAllResources();

    expect(w1.cargo.wood).to.equal(
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER
    );
    // due to w1 reaching cargo cap and there's limited resources, all other units take a little more than w1
    expect(w2.cargo.wood).to.equal(Math.floor((5 * rates.WOOD) / 12));
    expect(w3.cargo.wood).to.equal(Math.floor((5 * rates.WOOD) / 12));
    expect(cell.resource.amount).to.equal(0);
  });
  it('should distribute equally to cargo capacity', () => {
    const cellC = game.map.getCell(4, 4);
    game.map.addResource(4, 4, Resource.Types.WOOD, rates.WOOD);
    const cellN = game.map.getCell(4, 3);
    game.map.addResource(4, 3, Resource.Types.WOOD, rates.WOOD);
    const cellS = game.map.getCell(4, 5);
    game.map.addResource(4, 5, Resource.Types.WOOD, rates.WOOD);
    game.map.sortResourcesDeterministically();

    const w1 = game.spawnWorker(0, 4, 4);
    w1.cargo.wood =
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER -
      rates.WOOD * 2;

    game.distributeAllResources();
    expect(w1.cargo.wood).to.equal(
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER
    );

    // w1 has space to receive 40 wood, so it's split evenly 
    // evenly to fill at 14
    expect(cellC.resource.amount).to.equal(6);
    expect(cellN.resource.amount).to.equal(6);
    expect(cellS.resource.amount).to.equal(6);
  });
  it('should distribute equally to cargo capacity between units with varying space left', () => {
    const cellC = game.map.getCell(4, 4);
    game.map.addResource(4, 4, Resource.Types.WOOD, rates.WOOD);
    const cellN = game.map.getCell(4, 3);
    game.map.addResource(4, 3, Resource.Types.WOOD, rates.WOOD);
    const cellS = game.map.getCell(4, 5);
    game.map.addResource(4, 5, Resource.Types.WOOD, rates.WOOD);
    game.map.sortResourcesDeterministically();

    const w1 = game.spawnWorker(0, 4, 4);
    const w2 = game.spawnWorker(0, 4, 5);

    // w1 is at the center and requests 14 from all adjacent wood
    // w2 is down south and requests 20 from 2 tiles.
    // total, 2/3 wood tiles are contested.
    // the contested ones need to give 14 to w1 and 20 to w2. Since this is not possible, it divy's up what it has and gives 10 to each
    // the uncontested one then simply gives w1 what it requested (despite being suboptimal but this is fair)
    w1.cargo.wood =
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER -
      rates.WOOD * 2;

    game.distributeAllResources();
    expect(w1.cargo.wood).to.equal(
      94
    );
    expect(w2.cargo.wood).to.equal(
      20
    );

    expect(cellC.resource.amount).to.equal(0);
    expect(cellN.resource.amount).to.equal(6);
    expect(cellS.resource.amount).to.equal(0);
  });
  it('should distribute equally ', () => {
    const cellC = game.map.getCell(4, 4);
    game.map.addResource(4, 4, Resource.Types.WOOD, rates.WOOD);
    const cellN = game.map.getCell(4, 3);
    game.map.addResource(4, 3, Resource.Types.WOOD, rates.WOOD);
    const cellW = game.map.getCell(3, 4);
    game.map.addResource(3, 4, Resource.Types.WOOD, rates.WOOD);
    const cellE = game.map.getCell(5, 4);
    game.map.addResource(5, 4, Resource.Types.WOOD, rates.WOOD);
    const cellS = game.map.getCell(4, 5);
    game.map.addResource(4, 5, Resource.Types.WOOD, rates.WOOD);
    game.map.sortResourcesDeterministically();

    const w1 = game.spawnWorker(0, 4, 4);
    w1.cargo.wood =
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER -
      rates.WOOD * 2;

    game.distributeAllResources();
    expect(w1.cargo.wood).to.equal(
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER
    );

    // w1 has space to receive 40 wood, so it's split evenly 
    // to fill 
    expect(cellC.resource.amount).to.equal(12);
    expect(cellN.resource.amount).to.equal(12);
    expect(cellW.resource.amount).to.equal(12);
    expect(cellE.resource.amount).to.equal(12);
    expect(cellS.resource.amount).to.equal(12);
  });



  it('should distribute resources to a CityTile with at least 1 unit on there ', () => {
    const cellN = game.map.getCell(4, 3);
    game.map.addResource(4, 3, Resource.Types.WOOD, rates.WOOD * 2);
    const cellW = game.map.getCell(3, 4);
    game.map.addResource(3, 4, Resource.Types.WOOD, rates.WOOD);
    const cellE = game.map.getCell(5, 4);
    game.map.addResource(5, 4, Resource.Types.URANIUM, rates.URANIUM * 2);
    const cellS = game.map.getCell(4, 5);
    game.map.addResource(4, 5, Resource.Types.COAL, rates.COAL);
    const cityTile = game.spawnCityTile(0, 4, 4);
    game.map.sortResourcesDeterministically();
    game.state.teamStates[0].researchPoints = 60;
    game.state.teamStates[0].researched.coal = true;

    const w1 = game.spawnWorker(0, 4, 4);
    const w2 = game.spawnWorker(0, 4, 4);
    w1.cargo.wood = rates.WOOD;

    game.distributeAllResources();


    // Worker does not get any resources, so it still has rates.Wood amount, which gets deposited later if we run the deposite command
    expect(w1.cargo.wood).to.equal(
      rates.WOOD
    );
    // w2 does not get any either and is left empty
    expect(w2.getCargoSpaceLeft()).to.equal(
      DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER
    );
    // should take out rates.Wood out of each tile, rates.Coal, and no uranium as it is not researched
    expect(cellN.resource.amount).to.equal(rates.WOOD);
    expect(cellW.resource.amount).to.equal(0);
    expect(cellE.resource.amount).to.equal(rates.URANIUM * 2);
    expect(cellS.resource.amount).to.equal(0);
    expect(game.cities.get(cityTile.cityid).fuel).to.equal(rates.WOOD * 2 + rates.COAL * DEFAULT_CONFIGS.parameters.RESOURCE_TO_FUEL_RATE.COAL);
    
    game.handleResourceDeposit(w1);
    expect(w1.getCargoSpaceLeft()).to.equal(DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.WORKER);
  });
  it('should not distribute resources to a CityTile with no units on there or carts on there', () => {
    const cellN = game.map.getCell(4, 3);
    game.map.addResource(4, 3, Resource.Types.WOOD, rates.WOOD * 2);
    const cellW = game.map.getCell(3, 4);
    game.map.addResource(3, 4, Resource.Types.WOOD, rates.WOOD);
    const cellE = game.map.getCell(5, 4);
    game.map.addResource(5, 4, Resource.Types.URANIUM, rates.URANIUM * 2);
    const cellS = game.map.getCell(4, 5);
    game.map.addResource(4, 5, Resource.Types.COAL, rates.COAL);
    const cityTile = game.spawnCityTile(0, 4, 4);
    const cityTileWithCart = game.spawnCityTile(0, 3, 3);
    const cart = game.spawnCart(0, 3, 3);
    game.map.sortResourcesDeterministically();
    game.state.teamStates[0].researchPoints = 60;
    game.state.teamStates[0].researched.coal = true;

    game.distributeAllResources();

    // should take out rates.Wood out of each tile, rates.Coal, and no uranium as it is not researched
    expect(cellN.resource.amount).to.equal(rates.WOOD * 2);
    expect(cellW.resource.amount).to.equal(rates.WOOD);
    expect(cellE.resource.amount).to.equal(rates.URANIUM * 2);
    expect(cellS.resource.amount).to.equal(rates.COAL);
    expect(game.cities.get(cityTile.cityid).fuel).to.equal(0);
    expect(game.cities.get(cityTileWithCart.cityid).fuel).to.equal(0);
    expect(cart.getCargoSpaceLeft()).to.equal(DEFAULT_CONFIGS.parameters.RESOURCE_CAPACITY.CART);
  });
});
