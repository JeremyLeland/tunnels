import { Actor } from '../src/Actor.js';

export class AvoidingActor extends Actor {
    
    target;
    avoidList = [];

    getAvoidCones( entities ) {
      return Array.from( entities, e => {
        const r = e.size;
        const cx = e.x - this.x;
        const cy = e.y - this.y;
        const h = Math.hypot( cx, cy );
        const angle = Math.atan2( cy, cx );
        const spread = Math.asin( Math.min( 1, r / h ) );   // prevent floating point errors when really close
  
        return {
          left: fixAngle( angle - spread ),
          right: fixAngle( angle + spread ),
          dist: h,
        }  
      } );
    }

    update( dt ) {
      super.update( dt );
    }

    drawEntity( ctx ) {
      ctx.fillStyle = 'red';
      ctx.strokeStyle = 'white';
      ctx.fillRect( -this.size, -this.size, this.size * 2, this.size * 2 );
      ctx.strokeRect( -this.size, -this.size, this.size * 2, this.size * 2 );
    }

    draw( ctx ) {
      super.draw( ctx );
      
      const avoidCones = this.getAvoidCones( this.avoidList );
  
      ctx.fillStyle = 'red';
      ctx.globalAlpha = 0.5;
      avoidCones.forEach( cone => { 
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.arc( this.x, this.y, cone.dist, cone.left, cone.right );
        ctx.fill();
      } );
      ctx.globalAlpha = 1;

      if ( this.target ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.target.x, this.target.y );
        ctx.strokeStyle = 'yellow';
        ctx.stroke();

        const targetAngle = Math.atan2(
          this.target.y - this.y, 
          this.target.x - this.x 
        );

        const blockingCones = avoidCones.filter( e => 
          deltaAngle( e.left, targetAngle ) > 0 && 
          deltaAngle( targetAngle, e.right ) > 0 
        );

        ctx.fillStyle = 'red';
        blockingCones.forEach( cone => { 
          ctx.beginPath();
          ctx.moveTo( this.x, this.y );
          ctx.arc( this.x, this.y, cone.dist, cone.left, cone.right );
          ctx.fill();
        } );
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