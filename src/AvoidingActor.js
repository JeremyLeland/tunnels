import { Actor } from '../src/Actor.js';
import { Entity } from './Entity.js';

const AVOID_DIST = 100, CLOSE_ENOUGH = 50;

export class AvoidingActor extends Actor {
  target;
  avoidList = [];

  #avoidCones;

  getAvoidCones( entities, maxDist ) {
    let combinedCones = [];

    // TODO: Create combined cones as we go, preserving original cones

    entities.forEach( e => {
      if ( e == this )  return;     // TODO: Need to account for this elsewhere if we are moving AvoidCones functionality out

      const cone = e instanceof Entity ? this.getAvoidEntity( e, maxDist ) : this.getAvoidLine( e, maxDist );
      
      if ( cone ) {   
        const newCombined = { left: cone.left, right: cone.right, cones: [ cone ] };

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
            newCombined.cones.push( ...other.cones );
            combinedCones.splice( i, 1 );
            i --;
          }
        }
        
        combinedCones.push( newCombined );
      }
    } );

    return combinedCones;
  }

  getAvoidEntity( entity, maxDist ) {
    const cx = entity.x - this.x;
    const cy = entity.y - this.y;
    const h = Math.hypot( cx, cy );

    if ( h < maxDist ) {
      const angle = Math.atan2( cy, cx );

      // TODO: Either entity should include size again, or this should be made to clearly apply to actor
      const r = entity.info.size + this.info.size;   // TODO: Plus some buffer space?
      const spread = Math.asin( Math.min( 1, r / h ) );   // prevent floating point errors when really close
      
      return { 
        left: fixAngle( angle - spread ), 
        right: fixAngle( angle + spread ),
        dist: h,
        avoids: entity,
      };
    }
  }

  getAvoidLine( line, maxDist ) {
    const cx1 = line.x1 - this.x;
    const cy1 = line.y1 - this.y;
    const h1 = Math.hypot( cx1, cy1 );

    const cx2 = line.x2 - this.x;
    const cy2 = line.y2 - this.y;
    const h2 = Math.hypot( cx2, cy2 );

    if ( h1 < maxDist || h2 < maxDist ) {
      const angle1 = Math.atan2( cy1, cx1 );
      const angle2 = Math.atan2( cy2, cx2 );

      const r = this.info.size;   // TODO: Plus some buffer space?
      const spread1 = Math.asin( Math.min( 1, r / h1 ) );
      const spread2 = Math.asin( Math.min( 1, r / h2 ) );

      const left1 = fixAngle( angle1 - spread1 );
      const right1 = fixAngle( angle1 + spread1 );
      const left2 = fixAngle( angle2 - spread2 );
      const right2 = fixAngle( angle2 + spread2 );

      const dist = Math.min( h1, h2 );
      
      return deltaAngle( angle1, angle2 ) > 0 ?
        { left: left1, right: right2, dist: dist, avoids: line } : 
        { left: left2, right: right1, dist: dist, avoids: line };
    }
  }

  update( dt ) {
    if ( this.target ) {
      const cx = this.target.x - this.x;
      const cy = this.target.y - this.y;
      const targetDist = Math.hypot( cx, cy );

      // TODO: How to account for target size? Should we be using a line from bounding box instead?
      //       Maybe getClosestPoint from the various bounding box lines?
      const goalDist = this.info.size + ( this.target.info?.size ?? 0 );

      if ( targetDist /*- this.speed * dt*/ > goalDist ) {
        this.#avoidCones = this.getAvoidCones( this.avoidList, Math.min( targetDist + this.info.size, AVOID_DIST ) );
        
        this.goalAngle = Math.atan2( cy, cx );
        const combinedCone = this.#avoidCones.find( combined => 
          betweenAngles( this.goalAngle, combined.left, combined.right )
        );
        
        if ( combinedCone ) {
          const inFront = combinedCone.cones.filter( cone =>
            betweenAngles( this.angle, cone.left, cone.right, false )
          );

          let closest = inFront.reduce( 
            ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: Infinity }
          );
          
          if ( closest.dist < AVOID_DIST || targetDist < CLOSE_ENOUGH ) {
            this.goalSpeed = 0;
          }
          else {
            this.goalSpeed = this.info.maxSpeed;
          }

          // TODO: Maybe try variable speed based on turning radius again later
          // this.speed = Math.min( 
          //   this.info.maxSpeed, 
          //   closest.dist * this.info.turnSpeed / ( Math.PI / 2 ) 
          // );

          const fromLeft = Math.abs( deltaAngle( this.angle, combinedCone.left ) );
          const fromRight = Math.abs( deltaAngle( this.angle, combinedCone.right ) );
          this.goalAngle = fromLeft < fromRight ? combinedCone.left : combinedCone.right;
        }
        else {
          this.goalSpeed = this.info.maxSpeed;
        }
            
        super.update( dt );
      }
      else {
        // close enough
        this.target = null;
      }
    }
  }

  draw( ctx ) {
    super.draw( ctx );

    // if ( this.#avoidCones ) {
    //   this.drawAvoidCones( this.#avoidCones, ctx );
    // }

    // if ( this.target ) {
    //   ctx.beginPath();
    //   ctx.moveTo( this.x, this.y );
    //   ctx.lineTo( this.target.x, this.target.y );
    //   ctx.strokeStyle = 'yellow';
    //   ctx.stroke();

    //   ctx.beginPath();
    //   ctx.moveTo( this.x, this.y );
    //   ctx.lineTo( 
    //     this.x + Math.cos( this.goalAngle ) * 100, 
    //     this.y + Math.sin( this.goalAngle ) * 100,
    //   );
    //   ctx.strokeStyle = 'lime';
    //   ctx.stroke();
    // }
  }

  drawAvoidCones( avoidCones, ctx ) {
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'red';
    avoidCones.forEach( combinedCone => { 
      ctx.beginPath();
      ctx.moveTo( this.x, this.y );
      ctx.arc( this.x, this.y, 100, combinedCone.left, combinedCone.right );
      ctx.closePath();
      ctx.stroke();
      
      ctx.globalAlpha = 0.1;
      combinedCone.cones.forEach( cone => {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.arc( this.x, this.y, 100, cone.left, cone.right );
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
