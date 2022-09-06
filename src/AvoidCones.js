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
      } );
    } );

    return cones;
  }

  static coneFromLine( x, y, line, maxDist ) {
    const cx1 = line.x1 - x;
    const cy1 = line.y1 - y;
    const h1 = Math.hypot( cx1, cy1 );
  
    const cx2 = line.x2 - x;
    const cy2 = line.y2 - y;
    const h2 = Math.hypot( cx2, cy2 );
  
    if ( h1 < maxDist || h2 < maxDist ) {
      const angle1 = Math.atan2( cy1, cx1 );
      const angle2 = Math.atan2( cy2, cx2 );
  
      const dist = Math.min( h1, h2 );
      
      return deltaAngle( angle1, angle2 ) > 0 ?
        { left: angle1, right: angle2, dist: dist, avoids: line } : 
        { left: angle2, right: angle1, dist: dist, avoids: line };
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
        ctx.moveTo( x, y );
        ctx.arc( x, y, 100, cone.left, cone.right );
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