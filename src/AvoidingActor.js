import { Actor } from '../src/Actor.js';

export class AvoidingActor extends Actor {
    
    target;

    #avoidCones;

    getAvoidCones( entities ) {
      let cones = [];

      entities.forEach( e => {
        const r = e.size;
        const cx = e.x - this.x;
        const cy = e.y - this.y;
        const h = Math.hypot( cx, cy );
        const angle = Math.atan2( cy, cx );
        const spread = Math.asin( Math.min( 1, r / h ) );   // prevent floating point errors when really close

        const left  = fixAngle( angle - spread );
        const right = fixAngle( angle + spread );
  
        const collidingCones = cones.filter( cone => 
          betweenAngles( left,  cone.left, cone.right ) ||
          betweenAngles( right, cone.left, cone.right ) ||
          betweenAngles( cone.left,  left, right ) ||
          betweenAngles( cone.right, left, right )
        );

        if ( collidingCones.length > 0 ) {
          cones = cones.filter( cone => !collidingCones.includes( cone ) );
          cones.push( {
            left:  Math.min( ...collidingCones.map( cone => cone.left ).concat( left ) ),
            right: Math.max( ...collidingCones.map( cone => cone.right ).concat( right ) ),
          } );
        }
        else {
          cones.push( { left: left, right: right } );
        }
      } );

      return cones;
    }

    update( dt, avoidList ) {
      this.#avoidCones = this.getAvoidCones( avoidList );

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
  
      ctx.fillStyle = 'red';
      ctx.globalAlpha = 0.5;
      this.#avoidCones.forEach( cone => { 
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.arc( this.x, this.y, 100, cone.left, cone.right );
        ctx.fill();
      } );
      ctx.globalAlpha = 1;

      if ( this.target ) {
        const targetAngle = Math.atan2(
          this.target.y - this.y, 
          this.target.x - this.x 
        );

        const blockingCone = this.#avoidCones.find( cone => 
          betweenAngles( targetAngle, cone.left, cone.right )
        );

        if ( blockingCone ) {
          ctx.beginPath();
          ctx.moveTo( this.x, this.y );
          ctx.arc( this.x, this.y, 100, blockingCone.left, blockingCone.right );
          ctx.fillStyle = 'red';
          ctx.fill();
        }

        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( this.target.x, this.target.y );
        ctx.strokeStyle = 'yellow';
        ctx.stroke();

        if ( blockingCone ) {  
          const fromLeft = deltaAngle( blockingCone.left, targetAngle );
          const fromRight = deltaAngle( targetAngle, blockingCone.right );
          const angle = fromLeft < fromRight ? blockingCone.left : blockingCone.right;

          ctx.beginPath();
          ctx.moveTo( this.x, this.y );
          ctx.lineTo( this.x + Math.cos( angle ) * 100, this.y + Math.sin( angle ) * 100 );
          ctx.strokeStyle = 'lime';
          ctx.stroke();
        }

        ctx.lineWidth = 1;
      }
    }
  }

  function fixAngle( a ) {
    return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
  }

  function deltaAngle( a, b ) {
    return fixAngle( b - a );
  }

  function betweenAngles( angle, lower, upper ) {
    return 0 < deltaAngle( lower, angle ) && 0 < deltaAngle( angle, upper ); 
  }