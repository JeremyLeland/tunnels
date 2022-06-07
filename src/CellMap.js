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

  unlink( index ) {
    const other = this.links[ index ];
    if ( other ) {
      const otherIndex = other.links.findIndex( link => link == this );
      other.links[ otherIndex ] = null;
    }

    this.links[ index ] = null;
  }

  unlinkAll() {
    for ( let i = 0; i < this.links.length; i ++ ) {
      this.unlink( i );
    }
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

  static fromVoronoi( voronoi ) {
    const cellMap = new CellMap();

    cellMap.cells = Array.from( voronoi.cellPolygons(), polygon => {
      const cell = new Cell();
      
      for ( let i = polygon.length - 1; i > 0; i -- ) {
        const current = polygon[ i ], next = polygon[ i - 1 ];
        cell.edges.push( new Line( ...current, ...next ) );
      }
  
      cell.updateCenter();
  
      return cell;
    } );
  
    for ( let cellIndex = 0; cellIndex < cellMap.cells.length; cellIndex ++ ) {
      const neighbors = Array.from( voronoi.neighbors( cellIndex ), index => cellMap.cells[ index ] );
  
      const cell = cellMap.cells[ cellIndex ];
  
      cell.links = Array.from( cell.edges, edge => 
        neighbors.find( other => other.edges.some( otherEdge => 
          edge.x1 == otherEdge.x2 && edge.y1 == otherEdge.y2 &&
          edge.x2 == otherEdge.x1 && edge.y2 == otherEdge.y1
        ) )
      );
    }

    return cellMap;
  }

  getCellsInfo() {
    const cellsMap = new Map();
    let nodeIndex = 0;
    this.cells.forEach( cell => cellsMap.set( cell, nodeIndex ++ ) );

    return Array.from( this.cells, cell => ( {
      x: cell.x, 
      y: cell.y,
      edges: cell.edges.map( edge => [ edge.x1, edge.y1, edge.x2, edge.y2 ] ),
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

  removeCell( cell ) {
    cell.unlinkAll();
    this.cells = this.cells.filter( c => c != cell );
  }

  getEdgeLoops() {
    const loops = [];

    const unvisited = new Set();
    const visited = new Set();

    this.cells.forEach( cell => {
      for ( let i = 0; i < cell.edges.length; i ++ ) {
        if ( !cell.links[ i ] ) {
          unvisited.add( cell.edges[ i ] );
        }
      }
    })
    
    while ( unvisited.size > 0 ) {
      const edges = [];
      let [ edge ] = unvisited;

      let currentCell = this.cells.find( cell => cell.edges.includes( edge ) );
      let edgeIndex = currentCell.edges.indexOf( edge );

      while ( !visited.has( edge ) ) {
        visited.add( edge );
        unvisited.delete( edge );

        edges.push( edge );

        // TODO: Avoid duplicating this chunk of code below
        edgeIndex = ( edgeIndex + 1 ) % currentCell.edges.length;
        edge = currentCell.edges[ edgeIndex ];
        let nextCell = currentCell.links[ edgeIndex ];

        while ( nextCell ) {
          edgeIndex = nextCell.links.indexOf( currentCell );
          currentCell = nextCell;

          edgeIndex = ( edgeIndex + 1 ) % currentCell.edges.length;
          edge = currentCell.edges[ edgeIndex ];
          nextCell = currentCell.links[ edgeIndex ];
        }
      }

      loops.push( edges );
    }

    return loops;
  }

  draw( ctx ) {
    this.cells.forEach( cell => cell.drawDebug( ctx ) );
  }
}
