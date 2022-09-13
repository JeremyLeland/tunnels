export class AvoidCones {
  #combinedCones = [];

  static conesFromAllEntities() {

  }

  // TODO: If we're going to use this for the outer loop of a level, we need to handle
  //       cones that are bigger than 180 degrees. 
  //       - Do we need cones per line like before to avoid this?
  // TODO: We also need to handle long lines
  //       - This could mess up any sort of maxDist
  //         - end points might be outside maxDist, but not the middle of the line
  //         - Find closest point and use that dist?
  //         - Just require more points?
  static conesBetweenEntities( a, b, maxDist ) {
    const cones = [];

    a.boundingLines.forEach( aLine => {
      b.boundingLines.forEach( bLine => {
        const cone = AvoidCones.coneFromLine( aLine.x1, aLine.y1, bLine, maxDist );

        if ( cone ) {
          cone.avoids = b;
          cones.push( cone );
        }

        // TODO: Eventually, we need to handle case of bLine smaller than aLine:
        // const cone1 = AvoidCones.coneFromLine( aLine.x1, aLine.y1, bLine, maxDist );
        // const cone2 = AvoidCones.coneFromLine( aLine.x2, aLine.y2, bLine, maxDist );

        // const left = Math.min( cone1.left, cone2.left );
        // const right = Math.max( cone1.right, cone2.right );
        // const dist = Math.min( cone1.dist, cone2.dist );

        // if ( dist < maxDist ) {
        //   cones.push( {
        //     x: ( aLine.x1 + aLine.x2 ) / 2,
        //     y: ( aLine.y1 + aLine.y2 ) / 2,
        //     left: left,
        //     right: right,
        //     dist: dist,
        //     avoids: b
        //   } );
        // }
      } );
    } );

    return cones;
  }

  static coneFromLine( x, y, line, maxDist ) {    
    const closest = line.getClosestPoint( x, y );
    const dist = Math.hypot( closest.x - x, closest.y - y );
  
    if ( dist < maxDist ) {
      const buffer = 10;  // TODO: Pass this in?

      // TODO: This isn't quite right, we still get too close to the middle of lines
      //       Need to incorporate the line's normal somehow? Or our angle to them? Dunno...
      const x1 = line.x1 - buffer * line.slope.x;
      const y1 = line.y1 - buffer * line.slope.y;
      const x2 = line.x2 + buffer * line.slope.x;
      const y2 = line.y2 + buffer * line.slope.y;
      
      const cx1 = x1 - x;
      const cy1 = y1 - y;
    
      const cx2 = x2 - x;
      const cy2 = y2 - y;

      const angle1 = Math.atan2( cy1, cx1 );
      const angle2 = Math.atan2( cy2, cx2 );
      
      return deltaAngle( angle1, angle2 ) > 0 ?
        { x: x, y: y, left: angle1, right: angle2, dist: dist, avoids: line } : 
        { x: x, y: y, left: angle2, right: angle1, dist: dist, avoids: line };
    }
  }

  addCone( cone ) {
    const newCombined = { left: cone.left, right: cone.right, cones: [ cone ] };

    for ( let i = 0; i < this.#combinedCones.length; i ++ ) {
      const other = this.#combinedCones[ i ];
      let merge = false;
      
      if ( betweenAngles( newCombined.left, other.left, other.right ) ) {
        newCombined.left = other.left;
        merge = true;
      }  
      if ( betweenAngles( newCombined.right, other.left, other.right ) ) {
        newCombined.right = other.right;
        merge = true;
      }
      
      if ( betweenAngles( other.left, newCombined.left, newCombined.right ) && 
           betweenAngles( other.right, newCombined.left, newCombined.right ) ) {
        merge = true;
      }
      
      if ( merge ) {
        newCombined.cones.push( ...other.cones );
        this.#combinedCones.splice( i, 1 );
        i --;
      }
    }
    
    this.#combinedCones.push( newCombined );
  }

  addCones( cones ) {
    cones.forEach( cone => this.addCone( cone ) );
  }

  getCones() { 
    return this.#combinedCones;
  }

  draw( x, y, ctx ) {
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'red';
    this.#combinedCones.forEach( combinedCone => { 
      ctx.beginPath();
      ctx.moveTo( x, y );
      ctx.arc( x, y, 100, combinedCone.left, combinedCone.right );
      ctx.closePath();
      ctx.stroke();
      
      ctx.globalAlpha = 0.1;
      combinedCone.cones.forEach( cone => {
        ctx.beginPath();
        ctx.moveTo( cone.x, cone.y );
        ctx.arc( cone.x, cone.y, cone.dist, cone.left, cone.right );
        ctx.closePath();
        ctx.fill();
      } );
      ctx.globalAlpha = 1;
    } );
  }
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

function betweenAngles( angle, left, right, inclusive = true ) {
  // return left < right ? left <= angle && angle <= right : left <= angle || angle <= right;
  // return left < right ? left < angle && angle < right : left < angle || angle < right;

  const EPSILON = ( inclusive ? 1 : -1 ) * -0.000001;
  return left < right ? 
    EPSILON < angle - left && EPSILON < right - angle : 
    EPSILON < angle - left || EPSILON < right - angle;
}