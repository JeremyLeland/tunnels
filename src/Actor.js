import { Entity } from './Entity.js';
import { Gun } from './Gun.js';

import { ActorInfo } from '../info/info.js';
import * as Util from './Util.js';

export class Actor extends Entity {
  speed = 0;

  // avoidVector = { x: 0, y: 0 };

  goalSpeed = 0;
  goalAngle = 0;

  isShooting = false;
  guns = [];

  #debug = {};

  constructor( values ) {
    super( values, ActorInfo[ values.type ] );

    this.info.guns?.forEach( gunValues => 
      this.guns.push( new Gun( gunValues, this ) ) 
    );
  }
  
  update( dt, world ) {
    this.angle = approach( 
      fixAngleTo( this.angle, this.goalAngle ), 
      this.goalAngle, 
      this.info.turnSpeed, 
      dt 
    );

    this.speed = approach(
      this.speed, 
      this.goalSpeed,
      this.info.accelSpeed,
      dt
    );

    // Avoid other entities
    const avoidList = world.entities.filter( e => this != e && this.info.avoids.includes( e.info.type ) );

    const goalVector = {
      x: Math.cos( this.angle ),
      y: Math.sin( this.angle ),
    };

    const avoidVectors = [];
    const dodgeVectors = [];

    const AVOID_DIST = 80, DODGE_DIST = 100;    // TODO: define elsewhere

    avoidList.forEach( other => {
      const p = this.getClosestPoints( other );
      const angle = Math.atan2( p.closestB.y - p.closestA.y, p.closestB.x - p.closestA.x );
      const repulsion = Math.max( 0, 1 - p.distance / AVOID_DIST );

      avoidVectors.push( {
        x: -Math.cos( angle ) * repulsion,
        y: -Math.sin( angle ) * repulsion,
      } );

      // Distance from other's line of movement
      const otherSpeed = Math.hypot( other.dx, other.dy );
      if ( otherSpeed > 0 ) {
        const otherVector = {
          x: other.dx / otherSpeed,
          y: other.dy / otherSpeed,
        };
        const cx = this.x - other.x;
        const cy = this.y - other.y;
        const front = cx * otherVector.x + cy * otherVector.y;
        const side  = cx * otherVector.y - cy * otherVector.x;

        // TODO: Maybe do this in both cases, to avoid running into someone from behind?
        //if ( front > 0 ) {

        const dist = 1;//Math.max( 0, 1 - front / DODGE_DIST );
        const dodge = Math.max( 0, 1 - Math.abs( side ) / AVOID_DIST );

        // TODO: We should dodge whichever way is closest to how we're already going (so we don't slow ourselves down!)
        //       Calculate both side angles and use whichever is closer to front angle?
        // But also need to account for if they are parallel

        // TODO: Maybe emphasize the old dodge vector, but override it if too far away from our angle?

        if ( this.angle == other.angle ) {  // TODO: Within epsilon?
          dodgeVectors.push( {
             x: otherVector.y * dist * dodge,
             y: -otherVector.x * dist * dodge,
          } );
        }
        else {
          const dodge1 = other.angle - Math.PI / 2;
          const dodge2 = other.angle + Math.PI / 2;

          const bestDodge = 
            Math.abs( Util.deltaAngle( dodge1, this.angle ) ) < 
            Math.abs( Util.deltaAngle( dodge2, this.angle ) ) ? dodge1 : dodge2;
        
          dodgeVectors.push( {
            x: Math.cos( bestDodge ) * dist * dodge,
            y: Math.sin( bestDodge ) * dist * dodge,
          } );
        }

        //}
      }
    } );

    this.#debug.goalVector = goalVector;
    this.#debug.avoidVectors = avoidVectors;
    this.#debug.dodgeVectors = dodgeVectors;

    const moveVector = { x: 0, y: 0 };
  
    const vectors = [ goalVector ].concat( avoidVectors ).concat( dodgeVectors );
    vectors.forEach( v => {
      moveVector.x += v.x;
      moveVector.y += v.y;
    } );
    
    const moveLength = Math.hypot( moveVector.x, moveVector.y );
    if ( moveLength > 1 ) {
      moveVector.x /= moveLength;
      moveVector.y /= moveLength;
    }
      
    this.dx = moveVector.x * this.speed;
    this.dy = moveVector.y * this.speed;

    super.update( dt );

    this.guns.forEach( gun => gun.update( dt ) );
  }

  draw( ctx ) {
    super.draw( ctx );

    ctx.lineWidth = 2;
    if ( this.#debug.goalVector ) {
      ctx.strokeStyle = 'green';
      drawVector( ctx, this.x, this.y, this.#debug.goalVector );
    }

    this.#debug.avoidVectors?.forEach( avoidVector => {
      ctx.strokeStyle = 'yellow';
      drawVector( ctx, this.x, this.y, avoidVector );
    } );

    this.#debug.dodgeVectors?.forEach( dodgeVector => {
      ctx.strokeStyle = 'cyan';
      drawVector( ctx, this.x, this.y, dodgeVector );
    } );

    ctx.lineWidth = 1;
  }

  drawUI( ctx ) {
    const WIDTH = this.info.size * 2;
    const HEIGHT = 4;

    drawBar( ctx, 'red', this.life / this.info.life, this.x - WIDTH / 2, this.y - WIDTH - HEIGHT - 2, WIDTH, HEIGHT );
    drawBar( ctx, 'dimgray', this.guns[ 0 ].getUIPercentage(), this.x - WIDTH / 2, this.y - WIDTH, WIDTH, HEIGHT );
  }
}


function approach( current, goal, speed, dt ) {
  if ( goal < current ) {
    return Math.max( goal, current - speed * dt );
  }
  else if ( current < goal ) {
    return Math.min( goal, current + speed * dt );
  }
  else {
    return current;
  }
}

function fixAngleTo( angle, otherAngle ) {
  if ( otherAngle - angle > Math.PI ) {
    return angle + Math.PI * 2;
  }
  else if ( angle - otherAngle > Math.PI ) {
    return angle - Math.PI * 2;
  }

  return angle;
}

function drawBar( ctx, color, val, x, y, width, height ) {
  ctx.fillStyle = color;
  ctx.fillRect( x, y, width * val, height );
  
  ctx.strokeStyle = 'white';
  ctx.strokeRect( x, y, width, height );
}

function drawVector( ctx, x, y, vector, size = 40 ) {
  ctx.beginPath();
  ctx.moveTo( x, y );
  ctx.lineTo( x + vector.x * size, y + vector.y * size );
  ctx.stroke();
}