export class Line {
  x1;
  y1;
  x2;
  y2;

  length;
  slope = {};
  normal = {};

  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

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


  // getLineHit( other ) {
  //   return this.getHit( {
  //     x: other.x1,
  //     y: other.y1,
  //     dx: other.x2 - other.x1,
  //     dy: other.y2 - other.y1,
  //     radius: 0
  //   } );
  // }

  getHit( other ) {
    const thisDX = this.x2 - this.x1;
    const thisDY = this.y2 - this.y1;
    
    // TODO: Need to account for edges with radius -- see how we did this in pong Wall
    // Just return all the info like in pong wall (including time, position, normal)
    
    const ux = this.x1 - other.x;// + this.normal.x * radius;
    const uy = this.y1 - other.y;// + this.normal.y * radius;
    
    const D = other.dy * thisDX - other.dx * thisDY;
    const us = ( other.dx * uy - other.dy * ux ) / D;
    if ( 0 <= us && us <= 1 ) {
      const them = ( thisDX * uy - thisDY * ux ) / D;
      return {
        time: them,
        position: {
          x: other.x + them * other.dx,
          y: other.y + them * other.dy,
        },
        entities: [ this, other ],
      }
    }
    else {
      return {
        time: Infinity
      }
    }
  }

  // NOTE: I keep deleting and rewriting this, so may as well keep it around for now
  getLineHit( other ) {
    const x1 = this.x1, y1 = this.y1;
    const x2 = this.x2, y2 = this.y2;
    const x3 = other.x1, y3 = other.y1;
    const x4 = other.x2, y4 = other.y2;

    const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );

    if ( D == 0 ) {
      return {
        uA: Infinity,
        uB: Infinity,
        A: this,
        B: other,
      }
    }
    else {
      const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
      const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;

      return {
        uA: uA,
        uB: uB,
        position: {
          x: x1 + ( x2 - x1 ) * uA,
          y: y1 + ( y2 - y1 ) * uA,
        },
        A: this,
        B: other,
      }
    }
  }

  // Based on: https://www.jeffreythompson.org/collision-detection/line-line.php
  getTimeToHit( x, y, dx, dy, radius = 0 ) {
    const thisDX = this.x2 - this.x1;
    const thisDY = this.y2 - this.y1;
    const D = ( dy * thisDX - dx * thisDY );

    // TODO: Need to account for edges with radius -- see how we did this in pong Wall
    // Just return all the info like in pong wall (including time, position, normal)

    const ux = this.x1 - x + this.normal.x * radius;
    const uy = this.y1 - y + this.normal.y * radius;

    const us = ( dx * uy - dy * ux ) / D;

    return ( 0 <= us && us <= 1 ) ? ( thisDX * uy - thisDY * ux ) / D : Infinity;
  }

  // Based on: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  // See also: http://paulbourke.net/geometry/pointlineplane/
  getClosestPoint( x, y ) {
    const px = this.x2 - this.x1;
    const py = this.y2 - this.y1;
    const u = Math.max( 0, Math.min( 1, 
      ( ( x - this.x1 ) * px + ( y - this.y1 ) * py ) / ( ( px * px ) + ( py * py ) ) 
    ) );
    
    return { x: this.x1 + u * px, y: this.y1 + u * py };
  }
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

function hitTime( x1, y1, x2, y2, x3, y3, x4, y4 ) {
  return ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / ( ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 ) );
}