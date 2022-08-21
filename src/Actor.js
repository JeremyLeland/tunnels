import { Entity } from './Entity.js';

export class Actor extends Entity {
  speed = 0;

  goalSpeed = 0;
  goalAngle = 0;

  constructor( values, actorInfo ) {
    super( values, actorInfo );
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
  }

  drawEntity( ctx ) {
    ctx.scale( this.info.size, this.info.size );

    this.info.drawPaths?.forEach( e => {
      ctx.fillStyle = e.fillStyle;
      ctx.fill( e.path );
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1 / this.info.size;
      ctx.stroke( e.path );
    } );
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