import { Actor } from './Actor.js';
import * as Util from './Util.js';

export class PathfindingActor extends Actor {
  target;

  // waypoints;
  #debug = {};

  update( dt, world ) {
    if ( this.target ) {
      const waypoints = world.getPathBetween( this, this.target );
      this.#debug.waypoints = waypoints;

      // if ( this.waypoints?.length > 0 && this.waypoints[ 0 ].distanceTo( this.x, this.y ) < 0 ) {
      //   this.waypoints.shift();
      // }

      const goalAngle = Math.atan2( this.target.y - this.y, this.target.x - this.x );

      if ( waypoints?.length > 0 ) {
        let cone = waypoints[ 0 ].getCone( this.x, this.y, this.info.size )
        for ( let i = 1; i < waypoints.length; i ++ ) {
          const nextCone = waypoints[ i ].getCone( this.x, this.y, this.info.size );
          const overlap = Util.overlappingCone( cone, nextCone );
          if ( overlap ) {
            cone = overlap;
          }
        }

        this.goalAngle = Util.clampAngle( goalAngle, cone.left, cone.right );
        this.goalSpeed = this.info.maxSpeed;

        this.#debug.cone = cone;
      }
      else {
        // this.waypoints = null;
        this.#debug.cone = null;
        this.goalAngle = goalAngle;

        const goalDist = Math.hypot( this.target.x - this.x, this.target.y - this.y );

        if ( goalDist < this.speed * dt ) {
          this.x = this.target.x;
          this.y = this.target.y;
          this.target = null;
          this.goalSpeed = 0;
        }
        else {
          this.goalSpeed = this.info.maxSpeed;
        }
      }
    }

    super.update( dt );
  }
  
  draw( ctx ) {
    if ( this.target ) {
      ctx.save();

      ctx.strokeStyle = 'orange';
      ctx.setLineDash( [ 4, 2 ] );
      
      ctx.beginPath();
      ctx.moveTo( this.target.x, this.target.y );
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
