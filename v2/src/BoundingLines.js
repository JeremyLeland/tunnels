import { Line } from './Line.js';

export class BoundingLines {
  points;
  lines;

  constructor( points ) {
    this.points = points;
  }

  update( owner ) {
    const cos = Math.cos( owner.angle );
    const sin = Math.sin( owner.angle );

    this.lines = [];
    for ( let i = 0; i < this.points.length; i ++ ) {
      const current = this.points[ i ];
      const next = this.points[ ( i + 1 ) % this.points.length ];

      this.lines.push( 
        new Line (
          owner.x + owner.size * ( cos * current[ 0 ] - sin * current[ 1 ] ),
          owner.y + owner.size * ( sin * current[ 0 ] + cos * current[ 1 ] ),
          owner.x + owner.size * ( cos * next[ 0 ] - sin * next[ 1 ] ),
          owner.y + owner.size * ( sin * next[ 0 ] + cos * next[ 1 ] ),
        ) 
      );
    }
  }

  draw( ctx ) {
    this.lines?.forEach( line => line.draw( ctx ) );
  }

  // Find when we would hit another set of BoundingLines (with given velocities)
  getHit( other, thisDX, thisDY, otherDX, otherDY ) {
    const closestHit = { 
      time: Infinity, 
      position: { x: 0, y: 0 } 
    };

    this.lines.forEach( a => {
      other.lines.forEach( b => {

        // TODO: Completely surrounded, no lines intersecting (e.g. splash damage?)

        // Already colliding?
        const intersection = Line.getIntersection( 
          a.x1, a.y1, a.x2, a.y2, 
          b.x1, b.y1, b.x2, b.y2,
        );

        if ( 0 <= intersection && intersection <= 1 ) {
          closestHit.time = 0;
          closestHit.position.x = a.x1 + ( a.x2 - a.x1 ) * intersection;
          closestHit.position.y = a.y1 + ( a.y2 - a.y1 ) * intersection;
        }

        // Test endpoints against lines
        const aToB = Line.getIntersection( 
          a.x1, a.y1, a.x1 + thisDX - otherDX, a.y1 + thisDY - otherDY,
          b.x1, b.y1, b.x2, b.y2,
        );

        if ( 0 < aToB && aToB < closestHit.time ) {
          closestHit.time = aToB;
          closestHit.position.x = a.x1 + thisDX * aToB;
          closestHit.position.y = a.y1 + thisDY * aToB;
        }

        const bToA = Line.getIntersection( 
          b.x1, b.y1, b.x1 + otherDX - thisDX, b.y1 + otherDY - thisDY,
          a.x1, a.y1, a.x2, a.y2,
        );

        if ( 0 < bToA && bToA < closestHit.time ) {
          closestHit.time = bToA;
          closestHit.position.x = b.x1 + otherDX * bToA;
          closestHit.position.y = b.y1 + otherDY * bToA;
        }
      } );
    } );

    // TODO: Return range of points if already intersecting? (e.g. bite)

    return closestHit;
  }
}