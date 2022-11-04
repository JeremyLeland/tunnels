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

export function betweenAngles( angle, left, right, inclusive = true ) {
  // return left < right ? left <= angle && angle <= right : left <= angle || angle <= right;
  // return left < right ? left < angle && angle < right : left < angle || angle < right;

  const EPSILON = ( inclusive ? 1 : -1 ) * -0.1;
  return left < right ? 
    EPSILON < angle - left && EPSILON < right - angle : 
    EPSILON < angle - left || EPSILON < right - angle;
}