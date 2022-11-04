import earcut from '../../lib/earcut.js';
import { Cell } from './Cell.js';


export class CellMap {
  cells = [];

  constructor( json ) {
    const flatcoords = [];
    const holeIndices = [];

    json.forEach( wall => { 
      if ( flatcoords.length > 0 ) {
        holeIndices.push( flatcoords.length / 2 );
      }

      wall.forEach( point => flatcoords.push( point[ 0 ], point[ 1 ] ) );
    } );

    const coords = earcut( flatcoords, holeIndices );

    const numTriangles = coords.length / 3;
    for ( let triIndex = 0; triIndex < numTriangles; triIndex ++ ) {
      const [ a, b, c ] = [ 0, 1, 2 ].map( i => {
        const coordIndex = coords[ triIndex * 3 + i ] * 2;
        return flatcoords.slice( coordIndex, coordIndex + 2 );
      } );

      this.cells.push( new Cell( [ c, b, a ] ) );
    }

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

