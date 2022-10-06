import { Actor } from '../src/Actor.js';
import { AvoidCones } from './AvoidCones.js';

const AVOID_DIST = 50, TARGET_DIST = 200, CLOSE_ENOUGH = 50;

const DEBUG_CONES = false, DEBUG_ANGLES = true;

export class AvoidingActor extends Actor {
  avoidList = [];
  targetList = [];

  wanderAngle = 0;
  timeUntilWander = 0;
  TIME_BETWEEN_WANDERS = 3000;

  #avoidCones;
  #target;


  // TODO: Add Wander support. 
  //       Maybe make wander a range from their start position? So they can wander locally, or an entire level
  //       Make wander based on goalAngle, not a specific location. Pick a random direction every x seconds?

  #closestTarget( range ) {
    // Find target
    const targetInfo = this.targetList.filter( e => e.isAlive ).map( entity => {
      const cx = entity.x - this.x;
      const cy = entity.y - this.y;
      return { 
        entity: entity, 
        dist: Math.hypot( cx, cy ), 
        angle: Math.atan2( cy, cx ) 
      }; 
    } );

    const closestTarget = targetInfo.reduce( 
      ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: Infinity }
    );

    if ( closestTarget.dist < range ) {
      this.#target = closestTarget.entity;
      return closestTarget;
    }
    else {
      this.#target = null;
    }
  }

  #avoid( entities, maxDist ) {
    this.#avoidCones = new AvoidCones( this, entities, maxDist );

    const combinedCone = this.#avoidCones.getCones().find( combined => 
      betweenAngles( this.goalAngle, combined.left, combined.right, false )
    );

    if ( combinedCone ) {
      const closest = combinedCone.cones.filter( cone =>
        betweenAngles( this.angle, cone.left, cone.right, false )
      ).reduce( 
        ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: Infinity }
      );

      if ( closest.dist < AVOID_DIST ) {
        this.goalSpeed = 0;
      }
      else {
        this.goalSpeed = this.info.maxSpeed;
      }

      // TODO: Keep from going back and forth if we're right in the middle

      const fromLeft = Math.abs( deltaAngle( this.angle, combinedCone.left ) );
      const fromRight = Math.abs( deltaAngle( this.angle, combinedCone.right ) );
      this.goalAngle = fromLeft < fromRight ? combinedCone.left : combinedCone.right;
    }
    else {
      this.goalSpeed = this.info.maxSpeed;
    }
  }
  
  update( dt ) {
    
    const closestTarget = this.#closestTarget( TARGET_DIST );

    if ( closestTarget?.entity ) {
      // TODO: We may only want to avoid nearby walls, but we want to know if walls are between us and our target
      //       What if our gun range is greater than avoid dist?
      const maxDist = Math.min( closestTarget.dist /*+ this.info.size */, AVOID_DIST );
      
      this.goalAngle = closestTarget.angle;

      this.#avoid( this.avoidList.filter( e => e != this && e != closestTarget.entity ), maxDist );

      // TODO: How to account for target size? Should we be using a line from bounding box instead?
      //       Maybe getClosestPoint from the various bounding box lines?
      const attackDist = this.info.size + ( closestTarget.entity.info?.size ?? 0 ) + this.guns[ 0 ].info.range;

      const AIM_DIST = 0.4;   // TODO: base on gun spread? lead target?
      if ( //closestTarget.dist < closestDist && 
          closestTarget.dist < attackDist &&
          Math.abs( this.angle - closestTarget.angle ) < AIM_DIST ) {
        this.isShooting = true;
        this.goalSpeed = 0;
      }
      else {
        this.isShooting = false;
      }
    }
    else {
      this.isShooting = false;

      this.timeUntilWander -= dt;
      if ( this.timeUntilWander <= 0 ) {
        this.wanderAngle = ( Math.random() - 0.5 ) * Math.PI * 2;
        this.timeUntilWander = this.TIME_BETWEEN_WANDERS;
      }

      this.goalAngle = this.wanderAngle;

      this.#avoid( this.avoidList.filter( e => e != this ), AVOID_DIST );
    }

  //   const AIM_DIST = 0.4;   // TODO: base on gun spread? lead target?
  //   if ( closestTarget.dist < closestDist && 
  //        closestTarget.dist < attackDist &&
  //        Math.abs( this.angle - closestTarget.angle ) < AIM_DIST ) {
  //     this.isShooting = true;
  //     this.goalSpeed = 0;
  //   }
  //   else {
  //     this.isShooting = false;

  //     // TODO: Need to re-think Close Enough -- the real question is whether this is as close as we can get
  //     //       Hard to answer!
  //     if ( closestDist < AVOID_DIST /*|| closestTarget.dist < CLOSE_ENOUGH*/ ) {
  //       this.goalSpeed = 0;
  //     }
  //     else {
  //       this.goalSpeed = this.info.maxSpeed;
        
  //       // TODO: Maybe try variable speed based on turning radius again later
  //       // TODO: Slow down for turns if turn speed is slower?
  //       // this.goalSpeed = Math.min( 
  //       //   this.info.maxSpeed, 
  //       //   closest.dist * this.info.turnSpeed / ( Math.PI / 2 ) 
  //       // );
  //     }

  //     if ( combinedCone ) {
  //       const fromLeft = Math.abs( deltaAngle( this.angle, combinedCone.left ) );
  //       const fromRight = Math.abs( deltaAngle( this.angle, combinedCone.right ) );
  //       this.goalAngle = fromLeft < fromRight ? combinedCone.left : combinedCone.right;
  //     }
  //   }
  // }

    super.update( dt );
  }

  draw( ctx ) {
    super.draw( ctx );

    if ( DEBUG_CONES ) {
      ctx.fillStyle = 'red';
      this.#avoidCones?.draw( this.x, this.y, ctx );
    }

    if ( DEBUG_ANGLES ) {
      if ( this.#target ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.#target.x, this.#target.y );
        ctx.strokeStyle = 'orange';
        ctx.stroke();
      }
      else {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( 
          this.x + Math.cos( this.wanderAngle ) * 50, 
          this.y + Math.sin( this.wanderAngle ) * 50,
        );
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
