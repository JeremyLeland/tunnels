import { Entity } from './Entity.js';
import { Gun } from './Gun.js';

import { ActorInfo } from '../info/info.js';
import * as Util from './Util.js';

export class Actor extends Entity {
  speed = 0;

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

    const AVOID_DIST = 20, DODGE_DIST = 100;    // TODO: define elsewhere

    avoidList.forEach( other => {
      const p = this.getClosestPoints( other );
      const angle = Math.atan2( p.closestB.y - p.closestA.y, p.closestB.x - p.closestA.x );
      const repulsion = 1 - p.distance / AVOID_DIST;

      if ( repulsion > 0 ) {
        avoidVectors.push( {
          x: -Math.cos( angle ) * repulsion,
          y: -Math.sin( angle ) * repulsion,
          src: other, // DEBUG
        } );

        if ( other.dx != 0 || other.dy != 0 ) {
          // If we are heading straight toward this entity, try to dodge around it
          // TODO: base this on their avoid cone somehow?
          if ( Math.abs( Util.deltaAngle( this.angle, angle ) ) < 1 ) {  // TODO: what angle range?
            dodgeVectors.push( {
              x:  Math.sin( angle ) * repulsion,
              y: -Math.cos( angle ) * repulsion,
              src: other,
            } );
          }
        }
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

    // ctx.lineWidth = 2;
    // if ( this.#debug.goalVector ) {
    //   ctx.strokeStyle = 'green';
    //   drawVector( ctx, this.x, this.y, this.#debug.goalVector );
    // }

    // const colors = [ 'red', 'orange', 'yellow', 'green', 'blue', 'purple' ];

    // this.#debug.avoidVectors?.forEach( ( avoidVector, index ) => {
    //   ctx.strokeStyle = colors[ index ];//'yellow';
    //   drawVector( ctx, this.x, this.y, avoidVector );

    //   // DEBUG: clarify source
    //   ctx.save();

    //   const src = avoidVector.src;
    //   ctx.beginPath();
    //   // ctx.arc( src.x, src.y, src.info.size, 0, Math.PI * 2 );
    //   ctx.moveTo( this.x, this.y );
    //   ctx.lineTo( src.x, src.y );

    //   ctx.setLineDash( [ 4, 2 ] );
    //   ctx.stroke(); 

    //   ctx.restore();
    // } );

    // this.#debug.dodgeVectors?.forEach( dodgeVector => {
    //   ctx.strokeStyle = 'cyan';
    //   drawVector( ctx, this.x, this.y, dodgeVector );
    // } );

    // ctx.lineWidth = 1;
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