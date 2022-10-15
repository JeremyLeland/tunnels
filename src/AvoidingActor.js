import { Actor } from '../src/Actor.js';
import { Cones } from './Cones.js';

const AVOID_DIST = 50, TARGET_DIST = 200, CLOSE_ENOUGH = 50;

const DEBUG_CONES = false, DEBUG_ANGLES = false;

export class AvoidingActor extends Actor {
  avoidList = [];
  targetList = [];

  moveTarget;
  attackTarget;

  timeUntilWander = 0;
  TIME_BETWEEN_WANDERS = 3000;

  #debug = {};

  #closestTarget( range ) {
    const targetInfo = this.targetList.filter( e => e.isAlive ).map( entity => {
      return { 
        entity: entity, 
        dist: Math.hypot( entity.x - this.x, entity.y - this.y ),
      }; 
    } );

    const closestTarget = targetInfo.reduce( 
      ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: Infinity }
    );

    if ( closestTarget.dist < range ) {
      return closestTarget.entity;
    }
  }
  
  update( dt ) {
    
    const cones = new Cones( this, this.avoidList );

    const inFront = cones.getCones( this.angle ).reduce( 
      ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: Infinity }
    );
    this.#debug.inFront = inFront;

    this.attackTarget = this.#closestTarget( TARGET_DIST );

    // TODO: Only wander if we've set this in our info
    if ( this.TIME_BETWEEN_WANDERS ) {
      this.timeUntilWander -= dt;
      if ( this.timeUntilWander <= 0 ) {
        // TODO: Base this on a range from home base?
        const wanderAngle = ( Math.random() - 0.5 ) * Math.PI * 2;
        this.moveTarget = {
          x: this.x + Math.cos( wanderAngle ) * 100,
          y: this.y + Math.sin( wanderAngle ) * 100,
        };
        this.timeUntilWander = this.TIME_BETWEEN_WANDERS;
      }
    }

    const target = this.attackTarget ?? this.moveTarget;
    const targetDist  = Math.hypot( target.x - this.x, target.y - this.y ) - this.info.size - ( target.info?.size ?? 0 );
    const targetAngle = Math.atan2( target.y - this.y, target.x - this.x );

    // TODO: Don't add buffer in Cones, add buffer in avoidance (so that inFront is more accurate for aiming)

    if ( inFront?.entity == target ) {
      const inSight = Math.abs( targetAngle - this.angle ) < 0.4; // TODO: constant for 0.4?
      const inRange = targetDist < this.guns[ 0 ].info.range;

      this.isShooting = inSight && inRange;
      this.goalSpeed = inRange ? 0 : this.info.maxSpeed;
      this.goalAngle = targetAngle;
    } 
    else {
      this.isShooting = false;

      this.goalSpeed = inFront.dist < AVOID_DIST || targetDist < 10 ? 0 : this.info.maxSpeed;

      const maxDist = Math.min( targetDist, AVOID_DIST );
      const avoidCones = cones.getAvoidCones( targetAngle, target, maxDist );
      this.#debug.avoidCones = avoidCones;
      
      this.goalAngle = avoidCones ? closestAngleTo( this.angle, avoidCones.left, avoidCones.right ) : targetAngle;
    }

    super.update( dt );
  }

  draw( ctx ) {
    super.draw( ctx );

    if ( DEBUG_CONES ) {
      if ( this.#debug.inFront ) {
        ctx.fillStyle = 'green';
        Cones.drawCone( this.#debug.inFront, ctx );
      }

      if ( this.#debug.avoidCones ) {
        ctx.fillStyle = 'red';
        Cones.drawAvoidCones( this.#debug.avoidCones, ctx );
      }
    }

    if ( DEBUG_ANGLES ) {
      if ( this.attackTarget ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.attackTarget.x, this.attackTarget.y );
        ctx.strokeStyle = 'orange';
        ctx.stroke();
      }

      if ( this.moveTarget ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.moveTarget.x, this.moveTarget.y );
        ctx.strokeStyle = 'yellow';
        ctx.stroke();  
      }
      
      ctx.beginPath();
      ctx.moveTo( this.x, this.y );
      ctx.lineTo( 
        this.x + Math.cos( this.goalAngle ) * 50,
        this.y + Math.sin( this.goalAngle ) * 50,
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

function betweenAngles( angle, left, right, inclusive = true ) {
  // return left < right ? left <= angle && angle <= right : left <= angle || angle <= right;
  // return left < right ? left < angle && angle < right : left < angle || angle < right;

  const EPSILON = ( inclusive ? 1 : -1 ) * -0.000001;
  return left < right ? 
    EPSILON < angle - left && EPSILON < right - angle : 
    EPSILON < angle - left || EPSILON < right - angle;
}

function closestAngleTo( angle, left, right ) {
  const fromLeft = Math.abs( deltaAngle( angle, left ) );
  const fromRight = Math.abs( deltaAngle( angle, right ) );
  return fromLeft < fromRight ? left : right;
}