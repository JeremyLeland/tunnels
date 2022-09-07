import { Actor } from '../src/Actor.js';
import { Entity } from './Entity.js';
import { AvoidCones } from './AvoidCones.js';

const AVOID_DIST = 100, CLOSE_ENOUGH = 50;

export class AvoidingActor extends Actor {
  target;
  avoidList = [];

  #avoidCones;

  update( dt ) {
    if ( this.target ) {
      const cx = this.target.x - this.x;
      const cy = this.target.y - this.y;
      const targetDist = Math.hypot( cx, cy );

      // TODO: How to account for target size? Should we be using a line from bounding box instead?
      //       Maybe getClosestPoint from the various bounding box lines?
      const goalDist = this.info.size + ( this.target.info?.size ?? 0 );

      if ( targetDist /*- this.speed * dt*/ > goalDist ) {
        const maxDist = Math.min( targetDist + this.info.size, AVOID_DIST );
        
        this.#avoidCones = new AvoidCones();
        this.avoidList.forEach( e => {
          if ( e != this && e != this.target ) {
            this.#avoidCones.addCones( AvoidCones.conesBetweenEntities( this, e, maxDist ) )
          }
        } );

        this.goalAngle = Math.atan2( cy, cx );
        const combinedCone = this.#avoidCones.getCones().find( combined => 
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
            //this.goalSpeed = this.info.maxSpeed;
            
            // TODO: Maybe try variable speed based on turning radius again later
            // TODO: Slow down for turns if turn speed is slower?
            this.goalSpeed = Math.min( 
              this.info.maxSpeed, 
              closest.dist * this.info.turnSpeed / ( Math.PI / 2 ) 
            );
          }

          const fromLeft = Math.abs( deltaAngle( this.angle, combinedCone.left ) );
          const fromRight = Math.abs( deltaAngle( this.angle, combinedCone.right ) );

          // TODO: Better way to avoid rubbing up against walls?
          const EXTRA = 0;
          this.goalAngle = fromLeft < fromRight ? combinedCone.left - EXTRA : combinedCone.right + EXTRA;
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

    this.#avoidCones?.draw( this.x, this.y, ctx );

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
