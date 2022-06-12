export class Line {
  x1;
  y1;
  x2;
  y2;

  length;
  slope = {};
  normal = {};

  static getLoopThroughPoints( points, maxLength ) {
    const loop = [];

    for ( let i = 0; i < points.length; i ++ ) {
      const a = points[ i ], b = points[ ( i + 1 ) % points.length ];

      const cx = b[ 0 ] - a[ 0 ];
      const cy = b[ 1 ] - a[ 1 ];
      const totalLength = Math.hypot( cx, cy );
      const numSegments = maxLength ? Math.ceil( totalLength / maxLength ) : 1;

      const dx = cx / numSegments;
      const dy = cy / numSegments;

      let x1 = a[ 0 ];
      let y1 = a[ 1 ];

      for ( let j = 0; j < numSegments; j ++ ) {
        let x2 = x1 + dx;
        let y2 = y1 + dy;

        loop.push( new Line( x1, y1, x2, y2 ) );

        x1 = x2;
        y1 = y2;
      }
    }

    return loop;
  }

  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.length = Math.hypot( x2 - x1, y2 - y1 );
    
    this.slope.angle = Math.atan2( y2 - y1, x2 - x1 );
    this.slope.x = Math.cos( this.slope.angle );
    this.slope.y = Math.sin( this.slope.angle );
    
    this.normal.angle = fixAngle( this.slope.angle - Math.PI / 2 );
    this.normal.x = Math.cos( this.normal.angle );
    this.normal.y = Math.sin( this.normal.angle );
  }

  draw( ctx ) {
    ctx.beginPath();
    ctx.moveTo( this.x1, this.y1 );
    ctx.lineTo( this.x2, this.y2 );
    ctx.lineWidth = 1;
    ctx.stroke();

    const midX = ( this.x1 + this.x2 ) / 2;
    const midY = ( this.y1 + this.y2 ) / 2;
    const NORM_LEN = 10;
    ctx.beginPath();
    ctx.moveTo( midX, midY );
    ctx.lineTo( midX + this.normal.x * NORM_LEN, midY + this.normal.y * NORM_LEN );
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Based on: https://www.jeffreythompson.org/collision-detection/line-line.php
  getTimeToHit( x, y, dx, dy, radius = 0 ) {
    const D = ( dy * ( this.x2 - this.x1 ) - dx * ( this.y2 - this.y1 ) );

    // TODO: Need to account for edges with radius -- see how we did this in pong Wall
    // Just return all the info like in pong wall (including time, position, normal)

    const ux = this.x1 - x + this.normal.x * radius;
    const uy = this.y1 - y + this.normal.y * radius;

    const us = ( dx * uy - dy * ux ) / D;
    if ( 0 <= us && us <= 1 ) {
      const them = ( ( this.x2 - this.x1 ) * uy - ( this.y2 - this.y1 ) * ux ) / D;
      return them;
    }
    else {
      return Infinity;
    }
  }

  // Based on: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  // See also: http://paulbourke.net/geometry/pointlineplane/
  getClosestPoint( x, y, radius ) {
    const px = this.x2 - this.x1;
    const py = this.y2 - this.y1;
    const u = Math.max( 0, Math.min( 1, 
      ( ( x - this.x1 ) * px + ( y - this.y1 ) * py ) / ( ( px * px ) + ( py * py ) ) 
    ) );
    
    // TODO: Account for radius (from end points)

    return { x: this.x1 + u * px, y: this.y1 + u * py };
  }
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}