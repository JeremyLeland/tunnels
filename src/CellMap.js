import Delaunay from '../lib/delaunay/delaunay.js';
import earcut from '../lib/earcut.js';
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

  merge( index ) {
    const other = this.links[ index ];
    if ( other ) {
      const otherIndex = other.links.findIndex( link => link == this );
      
      // TODO: Is it expensive to keep making this function if we call this a bunch?
      const extract = ( arr ) => arr.slice( otherIndex + 1 ).concat( arr.slice( 0, otherIndex ) );

      this.edges.splice( index, 1, ...extract( other.edges ) );
      this.links.splice( index, 1, ...extract( other.links ) );
    }

    this.updateCenter();
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

  draw( ctx ) {
    ctx.beginPath();
    this.edges.forEach( edge => ctx.lineTo( edge.x1, edge.y1 ) );
    ctx.closePath();
    ctx.stroke(); 
  }

  drawDebug( ctx ) {
    ctx.beginPath();
    ctx.arc( this.x, this.y, 3, 0, Math.PI * 2 );
    ctx.fillStyle = 'red';
    ctx.fill();

    // const colors = [ 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'pink' ];
    // let colorIndex = 0;

    this.drawShaded( ctx, 'cyan' );

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

function getOverlap( a, b ) {
  const px = a.x2 - a.x1;
  const py = a.y2 - a.y1;
  return ( ( b.x1 - a.x1 ) * px + ( b.y1 - a.y1 ) * py ) / ( ( px * px ) + ( py * py ) );
}

function getDir( a, b ) {
  return ( b.x1 - a.x1 ) * a.normal.x + ( b.y1 - a.y1 ) * a.normal.y;
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


  // NOTE: Keep going back and forth on whether I like the delaunay triangles or want something else
  //       Keeping both of these around for now until I get one really working
  static fromEdges( lines ) {
    const delaunay = Delaunay.from( lines, e => e.x1, e => e.y1 );
    const cellMap = new CellMap();

    const numTriangles = delaunay.triangles.length / 3;

    const cells = Array( numTriangles ).fill( null );
  
    for ( let triIndex = 0; triIndex < numTriangles; triIndex ++ ) {
      const [ a, b, c ] = [ 0, 1, 2 ].map( i => lines[ delaunay.triangles[ triIndex * 3 + i ] ] );
      const linePairs = [ [ a, b ], [ b, c ], [ c, a ] ];

      let hole = true;

      linePairs.forEach( pair => {
        const [ a, b ] = pair;

        if ( getOverlap( a, b ) > 0 ) {
          hole = getDir( a, b ) < -0.001;
        }
      } );

     if ( !hole ) {
        const cell = new Cell();
        cell.edges = Array.from( linePairs, p => new Line( p[ 0 ].x1, p[ 0 ].y1, p[ 1 ].x1, p[ 1 ].y1 ) );
        cell.updateCenter();

        cells[ triIndex ] = cell;
      }
    }

    for ( let triIndex = 0; triIndex < numTriangles; triIndex ++ ) {
      const cell = cells[ triIndex ];

      if ( cell ) {
        // TODO: Make sure these are in right order! Or even remotely correct at all...
        const AA = delaunay.halfedges[ triIndex * 3 ];
        const BB = delaunay.halfedges[ triIndex * 3 + 1 ];
        const CC = delaunay.halfedges[ triIndex * 3 + 2 ];

        cell.links.push( AA == -1 ? null : cells[ Math.floor( AA / 3 ) ] );
        cell.links.push( BB == -1 ? null : cells[ Math.floor( BB / 3 ) ] );
        cell.links.push( CC == -1 ? null : cells[ Math.floor( CC / 3 ) ] );
      }
    }

    cellMap.cells = cells.filter( c => c != null );

    return cellMap;
  }

  // NOTE: Keep going back and forth on whether I like the delaunay triangles or want something else
  //       Keeping both of these around for now until I get one really working
  static fromEdgeLoops( edgeLoops ) {
    const cellMap = new CellMap();

    const flatcoords = [];
    const holes = [];

    edgeLoops.forEach( loop => { 
      if ( flatcoords.length > 0 ) {
        holes.push( flatcoords.length / 2 );
      }

      loop.forEach( line => flatcoords.push( line.x1, line.y1 ) );
    } );

    const triangles = earcut( flatcoords, holes );

    const numTriangles = triangles.length / 3;
    const cells = Array( numTriangles ).fill( null );

    for ( let triIndex = 0; triIndex < numTriangles; triIndex ++ ) {

      const [ a, b, c ] = [ 0, 1, 2 ].map( i => {
        const coordIndex = triangles[ triIndex * 3 + i ] * 2;
        return flatcoords.slice( coordIndex, coordIndex + 2 );
      } );

      const linePairs = [ [ a, b ], [ b, c ], [ c, a ] ];

      const cell = new Cell();

      // linePairs.forEach( pair => cell.edges.push( new Line( ...pair[ 0 ], ...pair[ 1 ] ) ) );
      linePairs.forEach( pair => cell.edges.push( new Line( pair[ 0 ][ 0 ], pair[ 0 ][ 1 ], pair[ 1 ][ 0 ], pair[ 1 ][ 1 ] ) ) );
      
      cell.updateCenter();

      // const AA = delaunay.halfedges[ triIndex * 3 ];
      // const BB = delaunay.halfedges[ triIndex * 3 + 1 ];
      // const CC = delaunay.halfedges[ triIndex * 3 + 2 ];

      // cell.links.push( AA == -1 ? null : cells[ Math.floor( AA / 3 ) ] );
      // cell.links.push( BB == -1 ? null : cells[ Math.floor( BB / 3 ) ] );
      // cell.links.push( CC == -1 ? null : cells[ Math.floor( CC / 3 ) ] );

      cells[ triIndex ] = cell;
    }

    cellMap.cells = cells.filter( c => c != null );

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
    this.cells.forEach( cell => cell.draw( ctx ) );
  }

  drawDebug( ctx ) {
    ctx.globalAlpha = 0.5;
    this.cells.forEach( cell => cell.drawDebug( ctx ) );
    ctx.globalAlpha = 1;
  }
}

