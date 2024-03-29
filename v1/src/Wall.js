import { Entity } from './Entity.js';
import { WallInfo } from '../info/info.js';

export class Wall extends Entity {  
  constructor( points ) {
    super( {}, Object.assign( { boundingPoints: points }, WallInfo.rock ) );

    let minX = points[ 0 ][ 0 ], maxX = points[ 0 ][ 0 ];
    let minY = points[ 0 ][ 1 ], maxY = points[ 0 ][ 1 ];

    let hullPointIndex = 0;

    this.path = new Path2D();
    points.forEach( ( point, index ) => {
      this.path.lineTo( point[ 0 ], point[ 1 ] );

      minX = Math.min( minX, point[ 0 ] );
      minY = Math.min( minY, point[ 1 ] );
      maxX = Math.max( maxX, point[ 0 ] );
      maxY = Math.max( maxY, point[ 1 ] );

      // Left-most, top-most point should be on convex hull
      const hullPoint = points[ hullPointIndex ];
      if ( point[ 0 ] < hullPoint[ 0 ] ||
           ( point[ 0 ] == hullPoint[ 0 ] && point[ 1 ] < hullPoint[ 1 ] ) ) {
        hullPointIndex = index;
      }
    } );
    this.path.lineTo( points[ 0 ][ 0 ], points[ 0 ][ 1 ] );

    const a = points.at( hullPointIndex - 1 );
    const b = points[ hullPointIndex ];
    const c = points[ ( hullPointIndex + 1 ) % points.length ];

    // https://en.wikipedia.org/wiki/Curve_orientation
    const det = ( b[ 0 ] * c[ 1 ] + a[ 0 ] * b[ 1 ] + a[ 1 ] * c[ 0 ] ) - 
                ( a[ 1 ] * b[ 0 ] + b[ 1 ] * c[ 0 ] + a[ 0 ] * c[ 1 ] );
    
    if ( det < 0 ) {
      const BUFFER = 20;
      this.path.rect( minX - BUFFER, minY - BUFFER, maxX + BUFFER * 2, maxY + BUFFER * 2 );
    }
  }

  update( dt ) {
    // walls don't move
  }

  drawEntity( ctx ) {
    ctx.fillStyle = this.info.fillStyle;
    ctx.fill( this.path );
    ctx.strokeStyle = 'black';
    ctx.stroke( this.path );
  }
}