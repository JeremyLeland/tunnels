import { Actor } from '../src/Actor.js';
import { Cones } from './Cones.js';
import { Entity } from './Entity.js';

const AVOID_DIST = 20, TARGET_DIST = 200, CLOSE_ENOUGH = 50;

const DEBUG_CONES = false, DEBUG_ANGLES = false;

export class AvoidingActor extends Actor {
  avoidList = [];
  targetList = [];

  moveTarget;
  attackTarget;
  wanderTarget;

  timeUntilWander = 0;
  // TIME_BETWEEN_WANDERS = 3000;

  #debug = {};

  #closestTarget( range ) {
    const allTargets = this.targetList.filter( e => e.isAlive ).map( entity => ( {
      entity: entity, 
      angle: Math.atan2( entity.y - this.y, entity.x - this.x ),
      dist:  Math.hypot( entity.x - this.x, entity.y - this.y ),
    } ) );
    
    const visibleTargets = allTargets.filter( target =>
      target.entity == Entity.firstRayHit( 
        this.x, this.y, 
        Math.cos( target.angle ), Math.sin( target.angle ), 
        this.avoidList 
      ).entity
    );

    return visibleTargets.reduce( 
      ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: range }
    ).entity;
  }
  
  update( dt ) {

    const inFront = Entity.firstRayHit( 
      this.x, this.y, Math.cos( this.angle ), Math.sin( this.angle ), this.avoidList 
    );
    this.#debug.inFront = inFront;

    this.attackTarget = this.#closestTarget( TARGET_DIST );

    if ( this.info.wander ) {
      this.timeUntilWander -= dt;
      if ( this.timeUntilWander <= 0 ) {
        // TODO: Base this on a range from home base?
        const wanderAngle = ( Math.random() - 0.5 ) * Math.PI * 2;
        this.wanderTarget = {
          x: this.x + Math.cos( wanderAngle ) * this.info.wander.radius,
          y: this.y + Math.sin( wanderAngle ) * this.info.wander.radius,
        };
        this.timeUntilWander = this.info.wander.time;
      }
    }

    const target = this.attackTarget ?? this.moveTarget ?? this.wanderTarget;

    if ( target ) {
      const targetDist  = Math.hypot( target.x - this.x, target.y - this.y ) - this.info.size - ( target.info?.size ?? 0 );
      const targetAngle = Math.atan2( target.y - this.y, target.x - this.x );

      // TODO: Detect move/wander target arrival separately above?
      if ( target == this.moveTarget && Math.abs( targetDist ) < 10 ) {
        this.moveTarget = null;
      }
      
      if ( inFront?.entity == target ) {
        const inSight = Math.abs( targetAngle - this.angle ) < 0.1; // TODO: make this an aim constant?
        const inRange = targetDist < this.guns[ 0 ].info.range;
        
        this.isShooting = inSight && inRange;
        this.goalSpeed = inRange ? 0 : this.info.maxSpeed;
        this.goalAngle = targetAngle;
      }
      else {
        this.isShooting = false;
        
        this.goalSpeed = inFront.dist < AVOID_DIST ? 0 : 
          ( target == this.wanderTarget ? this.info.wander.speed : this.info.maxSpeed );
        
        const maxDist = Math.min( targetDist, AVOID_DIST );
        
        // TODO: Call this with avoidList - target, so we don't need to make getAvoidCones more awkward?
        const avoidCones = new Cones( this, this.avoidList, maxDist ).getAvoidCones( targetAngle, target );
        this.#debug.avoidCones = avoidCones;
        
        this.goalAngle = avoidCones ? closestAngleTo( this.angle, avoidCones.left, avoidCones.right ) : targetAngle;
      }
    }
    else {
      this.isShooting = false;
      this.goalSpeed = 0;
    }

    super.update( dt );
  }

  draw( ctx ) {
    super.draw( ctx );

    // ctx.beginPath();
    // ctx.arc( this.x, this.y, this.info.size + this.guns[ 0 ].info.range, 0, Math.PI * 2 );
    // ctx.strokeStyle = 'red';
    // ctx.stroke();

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