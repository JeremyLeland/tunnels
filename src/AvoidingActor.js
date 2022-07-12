import { Actor } from '../src/Actor.js';

const AVOID_TIME = 2000;

export class AvoidingActor extends Actor {
    
    target;

    #avoidCones;

    getAvoidCones( entities ) {
      let cones = [];

      entities.forEach( e => {
        const cx = e.x - this.x;
        const cy = e.y - this.y;
        const h = Math.hypot( cx, cy );

        if ( h < this.speed * AVOID_TIME ) {
          const angle = Math.atan2( cy, cx );
          
          const r = e.size + this.size;   // TODO: Plus some buffer space?
          const spread = Math.asin( Math.min( 1, r / h ) );   // prevent floating point errors when really close
          
          let left = fixAngle( angle - spread );
          let right = fixAngle( angle + spread );
          
          for ( let i = 0; i < cones.length; i ++ ) {
            const cone = cones[ i ];
            
            if ( betweenAngles( left, cone.left, cone.right ) )   left = cone.left;
            if ( betweenAngles( right, cone.left, cone.right ) )  right = cone.right;
            
            if ( betweenAngles( cone.left, left, right ) && 
                 betweenAngles( cone.right, left, right ) ) {
                cones.splice( i, 1 );
              i --;
            }
          }

          cones.push( { left: left, right: right } );
        }
      } );

      return cones;
    }

    update( dt, avoidList ) {
      this.#avoidCones = this.getAvoidCones( avoidList );

      if ( this.target ) {
        const targetAngle = Math.atan2(
          this.target.y - this.y, 
          this.target.x - this.x 
        );

        const cone = this.#avoidCones.find( cone => 
          betweenAngles( targetAngle, cone.left, cone.right )
        );

        // TODO: Base this on how we're currently facing, so we don't bounce around so much
        if ( cone ) {  
          const fromLeft = targetAngle + ( targetAngle < cone.left ? Math.PI * 2 : 0 ) - cone.left;
          const fromRight = cone.right - targetAngle - ( cone.right < targetAngle ? Math.PI * 2 : 0 );
          this.goalAngle = fromLeft < fromRight ? cone.left : cone.right;
        }
        else {
          this.goalAngle = targetAngle;
        }
      }

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
        ctx.lineWidth = 2;

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

  function betweenAngles( angle, left, right ) {
    return left < right ? left <= angle && angle <= right : left <= angle || angle <= right;
  }