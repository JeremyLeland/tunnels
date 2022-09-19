import { Entity } from './Entity.js';
import { Gun } from './Gun.js';

export class Actor extends Entity {
  speed = 0;

  goalSpeed = 0;
  goalAngle = 0;

  isShooting = false;
  guns = [];

  constructor( values, actorInfo ) {
    super( values, actorInfo );

    actorInfo.guns?.forEach( gunValues => 
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

    super.update( dt );

    this.guns.forEach( gun => gun.update( dt ) );
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