import { Line } from './Line.js';
import { CellMap } from './CellMap.js';

export class Level {
  lines = [];
  cellMap;

  static fromJson( jsonStr ) {
    const level = new Level();

    const json = JSON.parse( jsonStr );

    level.lines = Array.from( json.lines, points => new Line( ...points ) );
    level.cellMap = CellMap.fromCellsInfo( json.cells );

    return level;
  }

  toJson() {
    return JSON.stringify( {
      lines: this.lines.map( line => [ line.x1, line.y1, line.x2, line.y2 ] ),
      cells: this.cellMap.getCellsInfo(),
    } );
  }

  draw( ctx ) {
    ctx.strokeStyle = 'gray';
    this.lines.forEach( line => line.draw( ctx ) );
    this.cellMap.cells.forEach( cell => cell.drawDebug( ctx ) );
  }
}
