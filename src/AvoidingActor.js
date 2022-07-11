import { Actor } from '../src/Actor.js';

export class AvoidingActor extends Actor {
    
    target;

    #avoidCones;

    getAvoidCones( entities ) {
      let cones = [];

      entities.forEach( e => {
        const r = e.size + this.size;   // TODO: Plus some buffer space?
        const cx = e.x - this.x;
        const cy = e.y - this.y;
        const h = Math.hypot( cx, cy );
        const angle = Math.atan2( cy, cx );
        const spread = Math.asin( Math.min( 1, r / h ) );   // prevent floating point errors when really close

        const lower = angle - spread;
        const upper = angle + spread;
  
        const collidingCones = cones.filter( cone => 
          betweenAngles( lower, cone.lower, cone.upper ) ||
          betweenAngles( upper, cone.lower, cone.upper ) ||
          betweenAngles( cone.lower, lower, upper ) ||
          betweenAngles( cone.upper, lower, upper )
        );

        if ( collidingCones.length > 0 ) {
          cones = cones.filter( cone => !collidingCones.includes( cone ) );

          const lowers = collidingCones.map( cone => cone.lower ).concat( lower );
          const uppers = collidingCones.map( cone => cone.upper ).concat( upper );

          const deltaSort = ( a, b ) => deltaAngle( b, a );
          lowers.sort( deltaSort );
          uppers.sort( deltaSort );

          cones.push( {
            lower: lowers.at(  0 ),
            upper: uppers.at( -1 ),
          } );
        }
        else {
          cones.push( { lower: lower, upper: upper } );
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

        const blockingCone = this.#avoidCones.find( cone => 
          betweenAngles( targetAngle, cone.lower, cone.upper )
        );

        if ( blockingCone ) {  
          const fromLower = deltaAngle( blockingCone.lower, targetAngle );
          const fromUpper = deltaAngle( targetAngle, blockingCone.upper );
          this.goalAngle = fromLower < fromUpper ? blockingCone.lower : blockingCone.upper;
        }
        else {
          this.goalAngle = targetAngle;
        }
      }

      this.goalAngle

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
        ctx.arc( this.x, this.y, 100, cone.lower, cone.upper );
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

  function betweenAngles( angle, lower, upper ) {
    return 0 < deltaAngle( lower, angle ) && 0 < deltaAngle( angle, upper ); 
  }