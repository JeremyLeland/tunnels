import * as Util from './Util.js';

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

  // Apparently this is a lot more complicated than I thought --
  // See https://stackoverflow.com/questions/1109536/an-algorithm-for-inflating-deflating-offsetting-buffering-polygons
  // Further reading for later:
  //  - https://mcmains.me.berkeley.edu/pubs/DAC05OffsetPolygon.pdf
  //  - https://doc.cgal.org/Manual/3.2/doc_html/cgal_manual/Straight_skeleton_2/Chapter_main.html
  //  - http://fcacciola.50webs.com/Offseting%20Methods.htm
  static getOffsetLoop( loop, offset = 0 ) {
    const offsetLoop = loop.map( line =>
      new Line(
        line.x1 + line.normal.x * offset, 
        line.y1 + line.normal.y * offset,
        line.x2 + line.normal.x * offset,
        line.y2 + line.normal.y * offset,
      )
    );

    const lineHits = [];

    for ( let i = 0; i < offsetLoop.length; i ++ ) {
      const current = offsetLoop[ i ];
      const next = offsetLoop[ ( i + 1 ) % offsetLoop.length ];

      lineHits.push( current.getLineHit( next ) );
    }

    const validLines = [];

    // TODO: Rather than treating each line individually, we'd need to group them -- so this would need to 
    // flag that we were in a bad region until we hit another backwards line
    for ( let i = 0; i < lineHits.length; i ++ ) {
      const current = lineHits[ i ];
      const prev = lineHits.at( i - 1 );

      if ( current.uA == Infinity || prev.uB < current.uA ) {
        validLines.push( current.A );
      }
    }

    for ( let i = 0; i < validLines.length; i ++ ) {
      const current = validLines[ i ];
      const next = validLines[ ( i + 1 ) % validLines.length ];

      const lineHit = current.getLineHit( next );
    
      if ( lineHit.position ) {
        current.x2 = lineHit.position.x;
        current.y2 = lineHit.position.y;
        next.x1 = lineHit.position.x;
        next.y1 = lineHit.position.y;
  
        current.update();
        next.update();
      }
    }

    return validLines;
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
    
    this.normal.angle = Util.fixAngle( this.slope.angle - Math.PI / 2 );
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

  getAngleTo( other ) {
    return Util.deltaAngle( this.slope.angle, other.slope.angle );
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

  // getLineHit( other ) {
  //   return this.getHit( {
  //     x: other.x1,
  //     y: other.y1,
  //     dx: other.x2 - other.x1,
  //     dy: other.y2 - other.y1,
  //     radius: 0
  //   } );
  // }

  distanceTo( x, y ) {
    return ( x - this.x1 ) * this.normal.x + ( y - this.y1 ) * this.normal.y;
  }

  // Based on: https://www.jeffreythompson.org/collision-detection/line-line.php
  getRayHit( x, y, dx, dy ) {
    const thisDX = this.x2 - this.x1;
    const thisDY = this.y2 - this.y1;
    const D = ( dy * thisDX - dx * thisDY );

    // TODO: Need to account for edges with radius -- see how we did this in pong Wall
    // Just return all the info like in pong wall (including time, position, normal)

    const ux = this.x1 - x;
    const uy = this.y1 - y;

    const us = ( dx * uy - dy * ux ) / D;

    return ( 0 <= us && us <= 1 ) ? ( thisDX * uy - thisDY * ux ) / D : Infinity;
  }

  // Based on: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  // See also: http://paulbourke.net/geometry/pointlineplane/
  getProjection( line ) {
    const px = this.x2 - this.x1;
    const py = this.y2 - this.y1;

    const D = ( ( px * px ) + ( py * py ) );
    const u1 = Math.max( 0, Math.min( 1, 
      ( ( line.x1 - this.x1 ) * px + ( line.y1 - this.y1 ) * py ) / D
    ) );
    const u2 = Math.max( 0, Math.min( 1, 
      ( ( line.x2 - this.x1 ) * px + ( line.y2 - this.y1 ) * py ) / D
    ) );
    
    return u1 == u2 ? null : new Line( 
      this.x1 + u1 * px, this.y1 + u1 * py,
      this.x1 + u2 * px, this.y1 + u2 * py,
    );
  }

  getCone( x, y, radius = 0 ) {
    const cx1 = this.x1 - x;
    const cy1 = this.y1 - y;
    const angle1 = Math.atan2( cy1, cx1 );
    const h1 = Math.hypot( cx1, cy1 );

    const cx2 = this.x2 - x;
    const cy2 = this.y2 - y;
    const angle2 = Math.atan2( cy2, cx2 );
    const h2 = Math.hypot( cx2, cy2 );

    const spread1 = Math.asin( Math.min( 1, radius / h1 ) );
    const spread2 = Math.asin( Math.min( 1, radius / h2 ) );

    const cone = Util.deltaAngle( angle1, angle2 ) > 0 ?
      { left: Util.fixAngle( angle1 + spread1 ), right: Util.fixAngle( angle2 - spread2 ) } : 
      { left: Util.fixAngle( angle2 + spread2 ), right: Util.fixAngle( angle1 - spread1 ) };
    
    if ( Util.deltaAngle( cone.left, cone.right ) > 0 ) {
      return cone;
    }
  }

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
  getClosestPoint( x, y ) {
    const px = this.x2 - this.x1;
    const py = this.y2 - this.y1;
    const u = Math.max( 0, Math.min( 1, 
      ( ( x - this.x1 ) * px + ( y - this.y1 ) * py ) / ( ( px * px ) + ( py * py ) ) 
    ) );
    
    return { x: this.x1 + u * px, y: this.y1 + u * py };
  }
}

// function hitTime( x1, y1, x2, y2, x3, y3, x4, y4 ) {
//   return ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / ( ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 ) );
// }