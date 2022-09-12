import { Entity } from './Entity.js';
import { WallInfo } from '../info/info.js';

export class Wall extends Entity {  
  constructor( points ) {
    super( {}, Object.assign( { boundingPoints: points }, WallInfo.rock ) );

    this.path = new Path2D();
    points.forEach( p => this.path.lineTo( p[ 0 ], p[ 1 ] ) );
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