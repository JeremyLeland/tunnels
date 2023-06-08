import '../../lib/poly2tri.js';
import { Cell } from '../../src/Cell.js';


export class CellMap {
  cells = [];

  constructor( json ) {
    const contour = json[ 0 ].map( point => 
      new poly2tri.Point( point[ 0 ], point[ 1 ] )
    );
    const swctx = new poly2tri.SweepContext(contour);
  
    for ( let i = 1; i < json.length; i ++ ) { 
      const hole = json[ i ].map( point =>
        new poly2tri.Point( point[ 0 ], point[ 1 ] )
      );
      swctx.addHole(hole);
    }
  
    swctx.triangulate();
    const triangles = swctx.getTriangles();

    triangles.forEach( t => {
      const [ a, b, c ] = t.getPoints();
      this.cells.push( new Cell( [ [ c.x, c.y ], [ b.x, b.y ], [ a.x, a.y ] ] ) );
    } );

    this.cells.forEach( cell => {
      cell.edges.forEach( ( edge, edgeIndex ) => {
        for ( let i = 0; i < this.cells.length; i ++ ) {
          if ( this.cells[ i ].edges.some( e => 
            edge.x1 == e.x2 && edge.y1 == e.y2 && edge.x2 == e.x1 && edge.y2 == e.y1 
          ) ) {
            cell.links[ edgeIndex ] = this.cells[ i ];
            break;
          }
        }
      } );
    } );
  }

  cellAt( x, y ) {
    return this.cells.find( cell => cell.contains( x, y ) );
  }

  mergeConvex() {
    for ( let c = 0; c < this.cells.length; c ++ ) {
      for ( let e = 0; e < this.cells[ c ].edges.length; e ++ ) {
        if ( this.cells[ c ].isConvexEdge( e ) ) {
          this.merge( c, e );
          e = -1;   // start this cell over
        }
      }
    }
  }

  merge( cellIndex, edgeIndex ) {
    const cell = this.cells[ cellIndex ];
    const other = cell.links[ edgeIndex ];

    if ( other ) {
      cell.merge( edgeIndex );
      this.cells = this.cells.filter( c => c != other );
    }
  }
  
  removeCell( cell ) {
    cell.unlinkAll();
    this.cells = this.cells.filter( c => c != cell );
  }

  draw( ctx ) {
    this.cells.forEach( cell => cell.draw( ctx ) );
  }
}

