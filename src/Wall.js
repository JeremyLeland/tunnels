import { Entity } from './Entity.js';

export class Wall extends Entity {  
  constructor( points ) {
    super( {}, {
      size: 1,
      life: Infinity,
      damage: 1,
      boundingPoints: points,
      hitParticle: {
        count: 5,
        spread: 1,
        size: 4,
        maxSpeed: 0.1,
        drawPaths: [ {
          fillStyle: 'saddlebrown',
          path: new Path2D( 'M 0 -0.5 A 0.5 0.5 0 0 1 0 0.5 A 0.5 0.5 0 0 1 0 -0.5' ),
        } ],
      },
    } );
  }

  update( dt ) {
    // walls don't move
  }

  // draw( ctx ) {
  // }
}