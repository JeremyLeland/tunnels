import { Actor } from '../src/Actor.js';
import * as Pathfinding from '../src/Pathfinding.js';

export class PathfindingActor extends Actor {
    size = 10;
    speed = 0.1;
    turnSpeed = 0.008;

    target;

    cell;
    path;
    nextEdge;

    spawnInCell( cell ) {
      this.cell = cell;

      // TODO: Pick random spot on random edge, 
      //       random distance between that spot and center?
      // TODO: Maybe that can come from Cell instead, get random spot with given size?
      this.x = cell.x;
      this.y = cell.y;
    }

    update( dt ) {
      if ( this.target ) {
        if ( Math.hypot( this.target.x - this.x, this.target.y - this.y ) > this.speed * dt ) {
          this.goalAngle = Math.atan2( this.target.y - this.y, this.target.x - this.x );

          if ( !this.path || this.target.cell != this.path[ this.path.length - 1 ] ) {
            this.path = Pathfinding.getPath( this.cell, this.target.cell );
            this.nextEdge = null;
          }

          if ( this.path && this.path[ 0 ].contains( this.x, this.y ) ) {
            this.cell = this.path.shift();

            if ( this.path.length == 0 ) {
              this.path = this.nextEdge = null;
            }
            else {
              this.nextEdge = this.cell.edges[ this.cell.links.indexOf( this.path[ 0 ] ) ];
            }
          }

          // TODO: This fixation on heading to the edge can result in some weird navigation
          // The links between cells can give us the spirit of what route we should take, but 
          // maybe it's better to avoid walls than to specifically target cell edges

          if ( this.nextEdge ) {
            const left = { 
              x: this.nextEdge.x2 - this.nextEdge.slope.x * this.size,
              y: this.nextEdge.y2 - this.nextEdge.slope.y * this.size,
            };
            const right = { 
              x: this.nextEdge.x1 + this.nextEdge.slope.x * this.size,
              y: this.nextEdge.y1 + this.nextEdge.slope.y * this.size,
            };
            const leftAngle = Math.atan2( left.y - this.y, left.x - this.x );
            const rightAngle = Math.atan2( right.y - this.y, right.x - this.x );
            
            this.goalAngle = clampAngle( this.goalAngle, leftAngle, rightAngle );
          }

          super.update( dt );
        }
      }
    }

    drawEntity( ctx ) {
      ctx.fillStyle = 'red';
      ctx.strokeStyle = 'white';
      ctx.fillRect( -this.size, -this.size, this.size * 2, this.size * 2 );
      ctx.strokeRect( -this.size, -this.size, this.size * 2, this.size * 2 );
    }

    draw( ctx ) {
      super.draw( ctx );
      
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

      this.cell?.drawShaded( ctx, 'green' );
      this.path?.forEach( cell => cell.drawShaded( ctx, 'orange' ) );
      
      // DEBUG: left and right lines of nextEdge
      if ( this.nextEdge ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y )
        ctx.lineTo( this.nextEdge.x1, this.nextEdge.y1 );
        ctx.strokeStyle = 'red';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.nextEdge.x2, this.nextEdge.y2 );
        ctx.strokeStyle = 'blue';
        ctx.stroke();
        
      }
    }
  }

  // TODO: I'd like these to live in one place...can whatever we are
  // using this for come from Cell instead?
  export function fixAngle( a ) {
    return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
  }

  export function deltaAngle( a, b ) {
    return fixAngle( b - a );
  }

  function clampAngle( angle, lower, upper ) {
    const dLower = deltaAngle( lower, angle );
    const dUpper = deltaAngle( angle, upper );

    return dLower < 0 ? lower : dUpper < 0 ? upper : angle;
  }