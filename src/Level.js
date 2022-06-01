import { Line } from './Line.js';

class Cell {
  x;
  y;
  edges = [];
  links = [];

  constructor( cell ) {
    Object.assign( this, cell );
  }

  contains( x, y ) {
    return this.edges.every( edge =>
      0 < ( x - edge.x1 ) * edge.normal.x + ( y - edge.y1 ) * edge.normal.y
    );
  }
}

export class Level {
  lines = [];
  cells = [];

  static fromJson( jsonStr ) {
    const level = new Level();

    const json = JSON.parse( jsonStr );

    level.lines = Array.from( json.lines, points => new Line( ...points ) );
    
    level.cells = Array.from( json.cells, cellInfo => new Cell( cellInfo ) );
    level.cells.forEach( cell => {
      cell.edges = cell.edges.map( points => new Line( ...points ) );
      cell.links = cell.links.map( index => level.cells[ index ] ) 
    } );

    return level;
  }

  toJson() {
    const lineInfo = Array.from( this.lines, line => [ line.x1, line.y1, line.x2, line.y2 ] );

    const nodesMap = new Map();
    let nodeIndex = 0;
    this.cells.forEach( cell => nodesMap.set( cell, nodeIndex ++ ) );

    const nodeInfo = Array.from( this.cells, cell => ( {
      x: cell.x, 
      y: cell.y,
      links: cell.links.map( link => nodesMap.get( link ) ) 
    } ) );

    return JSON.stringify( {
      lines: lineInfo,
      nodes: nodeInfo,
    } );
  }

  closestCellTo( x, y ) {
    return this.cells.map( 
      cell => ( { cell: cell, dist: Math.hypot( cell.x - x, cell.y - y ) } )
    ).reduce( 
      ( a, b ) => { return a.dist < b.dist ? a : b } 
    ).cell;
  }

  draw( ctx ) {
    ctx.strokeStyle = 'gray';
    this.lines.forEach( line => line.draw( ctx ) );

    this.cells.forEach( cell => {
      ctx.beginPath();
      ctx.arc( cell.x, cell.y, 3, 0, Math.PI * 2 );
      ctx.fillStyle = 'red';
      ctx.fill();

      ctx.strokeStyle = 'cyan';
      cell.edges.forEach( edge => edge.draw( ctx ) );
      
      cell.links.forEach( link => {
        if ( link ) {
          ctx.beginPath();
          ctx.moveTo( cell.x, cell.y );
          ctx.lineTo( link.x, link.y );
          ctx.strokeStyle = 'green';
          ctx.stroke();
        }
      } );
    } );
  }
}
