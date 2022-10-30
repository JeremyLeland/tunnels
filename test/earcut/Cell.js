import { Line } from "../../src/Line.js";

export class Cell {
  x = 0;
  y = 0;
  edges = [];
  links = [];

  constructor( points ) {
    for ( let i = 0; i < points.length; i ++ ) {
      const a = points[ i ], b = points[ ( i + 1 ) % points.length ];
      this.edges.push( new Line( a[ 0 ], a[ 1 ], b[ 0 ], b[ 1 ] ) );  // can we ...a ...b instead?
    }

    this.links = Array.from( points, _ => null );

    this.#updateCenter();
  }

  #updateCenter() {
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

  merge( edgeIndex ) {
    const other = this.links[ edgeIndex ];
    other.links.forEach( ( otherLink, i ) => {
      if ( otherLink == this ) {
        const extract = ( arr ) => arr.slice( i + 1 ).concat( arr.slice( 0, i ) );

        this.edges.splice( edgeIndex, 1, ...extract( other.edges ) );
        this.links.splice( edgeIndex, 1, ...extract( other.links ) );

        this.#updateCenter();
      }
      // Update other linked cells to point to us
      else {
        const neighborLinkIndex = otherLink.links.findIndex( l => l == other );
        otherLink.links[ neighborLinkIndex ] = this;
      }
    } );
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
    ctx.arc( this.x, this.y, 3, 0, Math.PI * 2 );
    ctx.fillStyle = 'red';
    ctx.fill();

    ctx.fillStyle = ctx.strokeStyle = 'cyan';

    ctx.save();
    ctx.globalAlpha = 0.2;
    
    ctx.beginPath();
    this.edges.forEach( edge => ctx.lineTo( edge.x1, edge.y1 ) );
    ctx.fill();

    ctx.restore();

    this.edges.forEach( edge => edge.draw( ctx ) );
    
    ctx.strokeStyle = 'green';
    this.links.forEach( link => {
      if ( link ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( link.x, link.y );
        ctx.stroke();
      }
    } );
  }
}