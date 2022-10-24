export class Cones {
  cones = [];
  
  constructor( fromEntity, toList, maxDist ) {
    toList.forEach( toEntity => {
      this.cones.push( ...Cones.conesBetweenEntities( fromEntity, toEntity, maxDist ) )
    } );
  }

  // TODO: Should we just grab one big cone for all of them, so less comparison later?
  static conesBetweenEntities( a, b, maxDist ) {
    const cones = [];

    b.boundingLines.forEach( bLine => {
      const cone = Cones.coneFromLine( a.x, a.y, a.info.size, bLine, maxDist );
      if ( cone ) {
        cone.entity = b;
        cones.push( cone );
      }
    } );

    return cones;
  }

  static coneFromLine( x, y, radius, line, maxDist ) {
    const closest = line.getClosestPoint( x, y );
    const dist = Math.hypot( closest.x - x, closest.y - y ) /*- radius*/;   // TODO: Remove radius from dist? Or deal with elsewhere?

    if ( dist < maxDist ) {
      const cx1 = line.x1 - x;
      const cy1 = line.y1 - y;
      const h1 = Math.hypot( cx1, cy1 );
  
      const cx2 = line.x2 - x;
      const cy2 = line.y2 - y;
      const h2 = Math.hypot( cx2, cy2 );

      const angle1 = Math.atan2( cy1, cx1 );
      const angle2 = Math.atan2( cy2, cx2 );
  
      const r = radius;
      const spread1 = Math.asin( Math.min( 1, r / h1 ) );
      const spread2 = Math.asin( Math.min( 1, r / h2 ) );
  
      const left1 = fixAngle( angle1 - spread1 );
      const right1 = fixAngle( angle1 + spread1 );
      const left2 = fixAngle( angle2 - spread2 );
      const right2 = fixAngle( angle2 + spread2 );
      
      return deltaAngle( angle1, angle2 ) > 0 ?
        { x: x, y: y, left: left1, right: right2, dist: dist } : 
        { x: x, y: y, left: left2, right: right1, dist: dist };
    }
  }

  getAvoidCones( angle, ignoreEntity ) {
    const combinedCones = [];

    const cones = this.cones.filter( c => c.entity != ignoreEntity );

    cones.forEach( cone => {
      const newCombined = Object.assign( { cones: [ cone ] }, cone );

      for ( let i = 0; i < combinedCones.length; i ++ ) {
        const other = combinedCones[ i ];
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
          newCombined.dist = Math.min( newCombined.dist, other.dist );
          newCombined.cones.push( ...other.cones );
          combinedCones.splice( i, 1 );
          i --;
        }
      }
      
      combinedCones.push( newCombined );
    } );

    return combinedCones.find( combined => 
      betweenAngles( angle, combined.left, combined.right, false )
    );
  }

  getCones( angle ) {
    return this.cones.filter( cone => 
      betweenAngles( angle, cone.left, cone.right, false )
    );
  }

  // TODO: Separate debug function for individual cones

  static drawCone( cone, ctx ) {
    ctx.beginPath();
    ctx.moveTo( cone.x, cone.y );
    ctx.arc( cone.x, cone.y, cone.dist, cone.left, cone.right );
    ctx.closePath();
    ctx.fill();
  }

  static drawAvoidCones( combinedCone, ctx ) {
    ctx.strokeStyle = 'white';
    // ctx.fillStyle = 'red'; 
    ctx.beginPath();
    ctx.moveTo( combinedCone.x, combinedCone.y );
    ctx.arc( combinedCone.x, combinedCone.y, combinedCone.dist, combinedCone.left, combinedCone.right );
    ctx.closePath();
    ctx.stroke();
    
    ctx.globalAlpha = 0.1;
    combinedCone.cones.forEach( cone => Cones.drawCone( cone, ctx ) );
    ctx.globalAlpha = 1;
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

  const EPSILON = ( inclusive ? 1 : -1 ) * -0.1;
  return left < right ? 
    EPSILON < angle - left && EPSILON < right - angle : 
    EPSILON < angle - left || EPSILON < right - angle;
}