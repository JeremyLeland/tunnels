import { Entity } from './Entity.js';
import { Gun } from './Gun.js';

import { ActorInfo } from '../info/info.js';

export class Actor extends Entity {
  speed = 0;

  avoidVector = { x: 0, y: 0 };

  goalSpeed = 0;
  goalAngle = 0;

  isShooting = false;
  guns = [];

  constructor( values ) {
    super( values, ActorInfo[ values.type ] );

    this.info.guns?.forEach( gunValues => 
      this.guns.push( new Gun( gunValues, this ) ) 
    );
  }
  
  update( dt ) {
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
  
    this.dx = this.speed * Math.cos( this.angle );
    this.dy = this.speed * Math.sin( this.angle );

    // TODO: Make sure we don't go too fast? Blend this better?
    this.dx += this.avoidVector.x * this.info.maxSpeed;
    this.dy += this.avoidVector.y * this.info.maxSpeed;

    this.avoidVector.x = 0;
    this.avoidVector.y = 0;

    super.update( dt );

    this.guns.forEach( gun => gun.update( dt ) );
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