import { Entity } from './Entity.js';

export class Wall extends Entity {  
  constructor( points ) {
    super( {}, {
      size: 1,
      life: Infinity,
      damage: 1,
      boundingPoints: points
    } );
  }

  update( dt ) {
    // walls don't move
  }

  // draw( ctx ) {
  // }
}