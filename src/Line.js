export class Line {
  x1;
  y1;
  x2;
  y2;

  length;
  slope = {};
  normal = {};

  static getLoopThroughPoints( points ) {
    return Array.from( points, ( _, i ) => {
      const current = points[ i ], next = points[ ( i + 1 ) % points.length ];
      return new Line( current[ 0 ], current[ 1 ], next[ 0 ], next[ 1 ] );
    } );
  }

  static getOffsetLoop( loop, offset ) {
    const offsetLoop = Array.from( loop, line =>
      new Line(
        line.x1 + line.normal.x * offset, 
        line.y1 + line.normal.y * offset,
        line.x2 + line.normal.x * offset,
        line.y2 + line.normal.y * offset,
      )
    );

    // TODO: Clip overlap, maybe even remove some lines?
    for ( let i = 0; i < offsetLoop.length; i ++ ) {
      const current = offsetLoop[ i ];
      const next = offsetLoop[ ( i + 1 ) % offsetLoop.length ];
      const hit = current.getLineHit( next );

      current.x2 = hit.position.x;
      current.y2 = hit.position.y;
      next.x1 = hit.position.x;
      next.y1 = hit.position.y;

      current.update();
      next.update();
    }

    return offsetLoop;
  }

  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.update();
  }

  update() {
    this.length = Math.hypot( this.x2 - this.x1, this.y2 - this.y1 );
    
    this.slope.angle = Math.atan2( this.y2 - this.y1, this.x2 - this.x1 );
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

  getSublines( maxLength ) {
    const numSegments = Math.ceil( this.length / maxLength );
    
    const dx = ( this.x2 - this.x1 ) / numSegments;
    const dy = ( this.y2 - this.y1 ) / numSegments;

    const sublines = [];

    let x1 = this.x1;
    let y1 = this.y1;

    for ( let i = 0; i < numSegments; i ++ ) {
      let x2 = x1 + dx;
      let y2 = y1 + dy;

      sublines.push( new Line( x1, y1, x2, y2 ) );

      x1 = x2;
      y1 = y2;
    }

    return sublines;
  }

  getLineHit( other ) {
    const thisDX = this.x2 - this.x1;
    const thisDY = this.y2 - this.y1;
    const otherDX = other.x2 - other.x1;
    const otherDY = other.y2 - other.y1;
    const D = otherDY * thisDX - otherDX * thisDY;

    // TODO: Need to account for edges with radius -- see how we did this in pong Wall
    // Just return all the info like in pong wall (including time, position, normal)

    const ux = this.x1 - other.x1;// + this.normal.x * radius;
    const uy = this.y1 - other.y1;// + this.normal.y * radius;

    const us = ( otherDX * uy - otherDY * ux ) / D;
    if ( 0 <= us && us <= 1 ) {
      const them = ( thisDX * uy - thisDY * ux ) / D;
      return {
        time: them,
        position: {
          x: other.x1 + them * otherDX,
          y: other.y1 + them * otherDY,
        }
      }
    }
    else {
      return {
        time: Infinity
      }
    }
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