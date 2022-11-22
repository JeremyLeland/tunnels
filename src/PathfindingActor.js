import { Actor } from './Actor.js';
import { Entity } from './Entity.js';
import * as Util from './Util.js';

export class PathfindingActor extends Actor {
  moveTarget;
  attackTarget;

  avoidVector = { x: 0, y: 0 };

  timeUntilWander = 0;

  // waypoints;
  #debug = {};

  update( dt, world ) {

    if ( this.moveTarget ) {
      const dist = Math.hypot( this.moveTarget.x - this.x, this.moveTarget.y - this.y );

      if ( dist < this.speed * dt ) {
        this.x = this.moveTarget.x;
        this.y = this.moveTarget.y;
        this.moveTarget = null;
        this.goalSpeed = 0;
      }
    }

    if ( this.info.wander ) {
      this.timeUntilWander -= dt;
      if ( this.timeUntilWander <= 0 ) {
        // TODO: Base this on a range from home base?
        this.moveTarget = world.getRandomLocation( this.x, this.y, this.info.wander.radius, this.info.size );
        this.timeUntilWander = this.info.wander.time;
      }
    }

    const target = this.attackTarget ?? this.moveTarget;

    this.isShooting = false;

    if ( target ) {
      const targetAngle = Math.atan2( target.y - this.y, target.x - this.x );
      const targetDist  = Math.hypot( target.x - this.x, target.y - this.y ) - this.info.size - ( target.info?.size ?? 0 );

      this.goalAngle = targetAngle;
      this.goalSpeed = target == this.attackTarget ? this.info.maxSpeed : this.info.moveSpeed;

      const inFront = Entity.firstRayHit( 
        this.x, this.y, Math.cos( this.angle ), Math.sin( this.angle ), 
        world.entities.filter( e => e != this && this.info.avoids?.includes( e.info.type ) )
      );

      if ( inFront?.entity == target ) {
        const inSight = Math.abs( targetAngle - this.angle ) < 0.1; // TODO: make this an aim constant?
        const inRange = targetDist < this.guns[ 0 ].info.range;
        
        this.isShooting = inSight && inRange;
        this.goalAngle = targetAngle;
        this.goalSpeed = inRange ? 0 : this.info.maxSpeed;
      }
      else {
        // TODO: Only recalculate this if something changes?
        const waypoints = world.getPathBetween( this, target );
        this.#debug.waypoints = waypoints;

        // Or maybe any time we cross our next waypoint?
        // TODO: Handle moving targets
        // if ( this.waypoints?.length > 0 && this.waypoints[ 0 ].distanceTo( this.x, this.y ) < 0 ) {
        //   this.waypoints.shift();
        // }

        if ( waypoints?.length > 0 ) {
          let cone = waypoints[ 0 ].getCone( this.x, this.y, this.info.size )

          if ( cone ) {
            for ( let i = 1; i < waypoints.length; i ++ ) {
              const nextCone = waypoints[ i ].getCone( this.x, this.y, this.info.size );
              const overlap = Util.overlappingCone( cone, nextCone );
              if ( overlap ) {
                cone = overlap;
              }
              else {
                break;
              }
            }

            this.goalAngle = Util.clampAngle( targetAngle, cone.left, cone.right );
            // this.goalSpeed = this.info.maxSpeed;
          }
            
          this.#debug.cone = cone;
        }
        else {
          // this.waypoints = null;
          this.#debug.cone = null;
          // this.goalAngle = targetAngle;
          // this.goalSpeed = this.info.maxSpeed;
        }
      }
    }

    super.update( dt );
  }
  
  draw( ctx ) {
    if ( this.moveTarget ) {
      ctx.save();

      ctx.strokeStyle = 'orange';
      ctx.setLineDash( [ 4, 2 ] );
      
      ctx.beginPath();
      ctx.moveTo( this.moveTarget.x, this.moveTarget.y );
      ctx.lineTo( this.x, this.y );
      ctx.stroke();
      
      ctx.restore();
    }

    if ( this.#debug.waypoints ) {
      ctx.strokeStyle = 'yellow';
      this.#debug.waypoints.forEach( line => line.draw( ctx ) );

      if ( this.#debug.cone ) {
        ctx.fillStyle = '#ff02';
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.arc( this.x, this.y, 100, this.#debug.cone.left, this.#debug.cone.right );
        ctx.fill();
      }
    }

    // this.cell?.drawShaded( ctx, 'green' );
    // this.path?.forEach( cell => cell.drawShaded( ctx, 'orange' ) );
   
    super.draw( ctx );
  }
}
