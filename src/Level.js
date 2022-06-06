import { Line } from './Line.js';

export class Cell {
  x = 0;
  y = 0;
  edges = [];
  links = [];

  constructor( cell ) {
    Object.assign( this, cell );
  }

  updateCenter() {
    this.x = 0;
    this.y = 0;

    this.edges.forEach( edge => {
      this.x += edge.x1;
      this.y += edge.y1;
    } );

    this.x /= this.edges.length;
    this.y /= this.edges.length;
  }

  contains( x, y ) {
    return this.edges.every( edge =>
      0 < ( x - edge.x1 ) * edge.normal.x + ( y - edge.y1 ) * edge.normal.y
    );
  }

  drawDebug( ctx ) {
    ctx.beginPath();
    ctx.arc( this.x, this.y, 3, 0, Math.PI * 2 );
    ctx.fillStyle = 'red';
    ctx.fill();

    // ctx.strokeStyle = 'cyan';

    const colors = [ 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'pink' ];
    let colorIndex = 0;

    this.edges.forEach( edge => { 
      ctx.strokeStyle = colors[ colorIndex ++ ];
      edge.draw( ctx );
    } );
    
    colorIndex = 0;
    this.links.forEach( link => {
      ctx.strokeStyle = colors[ colorIndex ++ ];
      
      if ( link ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( link.x, link.y );
        // ctx.strokeStyle = 'green';
        ctx.stroke();
      }
    } );
  }

  drawShaded( ctx, color ) {
    ctx.save();
      
    ctx.fillStyle = ctx.strokeStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
        
    ctx.beginPath();
    this.edges.forEach( edge => ctx.lineTo( edge.x1, edge.y1 ) );
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
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
    this.cells.forEach( cell => cell.drawDebug( ctx ) );
  }
}
