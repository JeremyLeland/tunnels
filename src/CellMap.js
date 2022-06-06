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

    // const colors = [ 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'pink' ];
    // let colorIndex = 0;

    this.edges.forEach( edge => { 
      ctx.strokeStyle = 'cyan'; //colors[ colorIndex ++ ];
      edge.draw( ctx );
    } );
    
    //colorIndex = 0;
    this.links.forEach( link => {
      ctx.strokeStyle = 'green';  //colors[ colorIndex ++ ];

      if ( link ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( link.x, link.y );
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

export class CellMap {
  cells = [];

  static fromCellsInfo( cellsInfo ) {
    const cellMap = new CellMap();

    cellMap.cells = Array.from( cellsInfo, cellInfo => new Cell( cellInfo ) );
    cellMap.cells.forEach( cell => {
      cell.edges = cell.edges.map( points => new Line( ...points ) );
      cell.links = cell.links.map( index => cellMap.cells[ index ] ) 
    } );

    return cellMap;
  }

  getCellsInfo() {
    const cellsMap = new Map();
    let nodeIndex = 0;
    this.cells.forEach( cell => cellsMap.set( cell, nodeIndex ++ ) );

    return Array.from( this.cells, cell => ( {
      x: cell.x, 
      y: cell.y,
      links: cell.links.map( link => cellsMap.get( link ) ) 
    } ) );
  }

  closestCellTo( x, y ) {
    return this.cells.map( 
      cell => ( { cell: cell, dist: Math.hypot( cell.x - x, cell.y - y ) } )
    ).reduce( 
      ( a, b ) => { return a.dist < b.dist ? a : b } 
    ).cell;
  }

  draw( ctx ) {
    this.cells.forEach( cell => cell.drawDebug( ctx ) );
  }
}
