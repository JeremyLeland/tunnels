import { Actor } from '../src/Actor.js';
import { Entity } from './Entity.js';

const AVOID_DIST = 100;

export class AvoidingActor extends Actor {
  target;
  avoidList = [];

  #avoidCones;

  getAvoidCones( entities, maxDist ) {
    let cones = [];

    entities.forEach( e => {
      if ( e == this )  return;

      const cone = e instanceof Entity ? this.getAvoidEntity( e, maxDist ) : this.getAvoidLine( e, maxDist );
      
      if ( cone ) {   
        for ( let i = 0; i < cones.length; i ++ ) {
          const other = cones[ i ];
          
          if ( betweenAngles( cone.left, other.left, other.right ) ) {
            cone.left = other.left;
          }  
          if ( betweenAngles( cone.right, other.left, other.right ) ) {
            cone.right = other.right;
          }
          
          if ( betweenAngles( other.left, cone.left, cone.right ) && 
              betweenAngles( other.right, cone.left, cone.right ) ) {
            
            // TODO: Combine cones for avoid purposes, but keep track of sub-cones for checking if enemies/allies are in front of us
            cone.avoids.push( ...other.avoids );
            cones.splice( i, 1 );
            i --;
          }
        }
        
        cones.push( cone );
      }
    } );

    return cones;
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
        avoids: [ entity ],
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
      
      return deltaAngle( angle1, angle2 ) > 0 ?
        { left: left1, right: right2, avoids: [ line ] } : 
        { left: left2, right: right1, avoids: [ line ] };
    }
  }

  update( dt ) {
    if ( this.target ) {
      const cx = this.target.x - this.x;
      const cy = this.target.y - this.y;
      const targetDist = Math.hypot( cx, cy );
      const goalDist = this.info.size + ( this.target.size ?? 0 );

      // TODO: Better way to decide when we're done
      if ( targetDist /*- this.speed * dt*/ > goalDist ) {
        this.#avoidCones = this.getAvoidCones( this.avoidList, Math.min( targetDist + this.info.size, AVOID_DIST ) );
        
        this.goalAngle = Math.atan2( cy, cx );
        const cone = this.#avoidCones.find( cone => 
          betweenAngles( this.goalAngle, cone.left, cone.right )
        );
        
        if ( cone ) {
          // TODO: Keep track of individual avoid cones within larger cone group, so we don't need to recalculate this?
          // We can also use different ranges to avoid walls and actors?
          if ( cone.avoids.find( e => 
                e instanceof Actor && 
                Math.abs( Math.atan2( e.y - this.y, e.x - this.x ) - this.angle ) < 1
             ) ) {
            this.speed = 0;
          }
          else {
            this.speed = this.info.maxSpeed;

            const fromLeft = Math.abs( deltaAngle( this.angle, cone.left ) );
            const fromRight = Math.abs( deltaAngle( this.angle, cone.right ) );
            this.goalAngle = fromLeft < fromRight ? cone.left : cone.right;
          }
        }
        else {
          this.speed = this.info.maxSpeed;
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

    if ( this.#avoidCones ) {
      ctx.fillStyle = 'red';
      ctx.globalAlpha = 0.1;
      this.#avoidCones.forEach( cone => { 
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.arc( this.x, this.y, 100, cone.left, cone.right );
        ctx.fill();
      } );
      ctx.globalAlpha = 1;
    }

    if ( this.target ) {
      ctx.beginPath();
      ctx.moveTo( this.x, this.y );
      ctx.lineTo( this.target.x, this.target.y );
      ctx.strokeStyle = 'yellow';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo( this.x, this.y );
      ctx.lineTo( 
        this.x + Math.cos( this.goalAngle ) * 100, 
        this.y + Math.sin( this.goalAngle ) * 100,
      );
      ctx.strokeStyle = 'lime';
      ctx.stroke();
    }
  }
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

function betweenAngles( angle, left, right ) {
  return left < right ? left <= angle && angle <= right : left <= angle || angle <= right;
}