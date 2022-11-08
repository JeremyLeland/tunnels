//
// Angles
//

export function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

export function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

export function clampAngle( angle, left, right ) {
  if ( left < right ) {
    if ( left < angle && angle < right ) {
      return angle;
    }
  }
  else {
    if ( angle < right || left < angle ) {
      return angle;
    }
  }

  const dLeft = Math.abs( deltaAngle( left, angle ) );
  const dRight = Math.abs( deltaAngle( angle, right ) );

  return dLeft < dRight ? left : right;
}

export function betweenAngles( angle, left, right /*, inclusive = true*/ ) {
  // return left < right ? left <= angle && angle <= right : left <= angle || angle <= right;
  return left < right ? left < angle && angle < right : left < angle || angle < right;

  // const EPSILON = ( inclusive ? 1 : -1 ) * -0.1;
  // return left < right ? 
  //   EPSILON < angle - left && EPSILON < right - angle : 
  //   EPSILON < angle - left || EPSILON < right - angle;
}

//
// Cones
//

export function overlappingCone( a, b ) {
  let cone = Object.assign( {}, a );
  let overlap = false;

  if ( betweenAngles( b.left,  a.left, a.right ) ) {
    cone.left = b.left;
    overlap = true;
  }  
  if ( betweenAngles( b.right, a.left, a.right ) ) {
    cone.right = b.right;
    overlap = true;
  }
  
  if ( betweenAngles( a.left,  b.left, b.right ) && 
       betweenAngles( a.right, b.left, b.right ) ) {
    overlap = true;
  }
  
  if ( overlap ) {
    return cone;
  }
}