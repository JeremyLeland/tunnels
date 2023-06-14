import { BoundingLines } from "./BoundingLines.js";
import * as Util from "./Util.js";

export const Constants = {
  TargetWeight: 0.25,
  AvoidDistance: 40,
  AvoidWeight: 4,
  AlignWeight: 5,
  UIScale: 100,
  Debug: false,
};

export class Entity {
  static DebugBounds = false;
  static DebugNavigation = false;

  x = 0;
  y = 0;
  angle = 0;
  size = 1;

  dx = 0;
  dy = 0;
  dAngle = 0;
  dSize = 0;

  ddx = 0;
  ddy = 0;
  ddAngle = 0;
  ddSize = 0;

  life = 1;
  lifeSpan = Infinity;
  isAlive = true;
  
  mass = 1;

  boundingLines;

  createdEntities = [];

  constructor( values, info ) {
    Object.assign( this, values );
    this.info = info;

    if ( this.info.boundingPoints ) {
      this.boundingLines = new BoundingLines( this.info.boundingPoints );
      this.boundingLines.update( this );
    }

    if ( this.info.maxTurnSpeed ) {
      this.turnSpeed = 0;
    }

    if ( this.info.maxMoveSpeed ) {
      this.moveSpeed = 0;
    }
  }

  update( dt, alignEntities ) {

    this.goal = this.targetGoal ?? this.wanderGoal;

    if ( this.goal ) {
      this.goalAngle = Math.atan2( this.goal.y - this.y, this.goal.x - this.x );

      this.align( alignEntities );

      // TODO: Break goal vector into forward and side components
      // Adjust speed based on forward component, angle based on side component?

      // Differentiate between our actual goal and adjustments that are being made for alignment purposes
      // That is, we shouldn't turn completely around just because someone is infront of us
      // But we should turn completely around if our new goal is behind us 

      // TODO: Accelerate/decelerate turns?
      // So we slow down as we get closer?

      const goalTurn = Util.deltaAngle( this.angle, this.goalAngle );

      // TODO: Increase/decrease turnSpeed to match how far we need to turn
      // FIXME: Need to figure out stop distance (how long does it take to slow down?)
      //        and start slowing down then

      // Braking distance = v^2 / 2ug   (u=friction, g=gravity)
      // We'll use turnAccel in place of ug

      const turnStop = Math.sign( this.turnSpeed ) * Math.pow( this.turnSpeed, 2 ) / ( 2 * this.info.turnAccel );

      // TODO: Allow partial turnAccel (only accel as much as we need to -- don't be jittery with fast accels)

      if ( goalTurn < turnStop )   this.turnSpeed -= this.info.turnAccel * dt;
      if ( turnStop < goalTurn )   this.turnSpeed += this.info.turnAccel * dt;

      // TODO: Max speed

      // const goalTurnSpeed = Math.abs( goalTurn ) / dt;
      // this.turnSpeed += Math.sign( goalTurnSpeed ) * this.info.turnAccel

      this.angle = Util.fixAngle( this.angle + this.turnSpeed * dt );

      if ( this.moveSpeed ) {
        const goalMoveSpeed = this.info.maxMoveSpeed * ( 1 - Math.abs( goalTurn ) / Math.PI );
        
        // TODO: Differentiate between goal speed (accel/decel) and max speed (clamping)
        // So we slow to a smooth stop?
        const goalMoveAccel = goalMoveSpeed - this.moveSpeed;
        const moveAccel = Math.min( Math.abs( goalMoveAccel ), this.info.moveAccel * dt );
        this.moveSpeed += Math.sign( goalMoveAccel ) * moveAccel;
        
        this.dx = Math.cos( this.angle ) * this.moveSpeed * dt;
        this.dy = Math.sin( this.angle ) * this.moveSpeed * dt;
        
        this.x += this.dx * dt;
        this.y += this.dy * dt;
      }
    }
    else {
      this.dAngle += this.ddAngle * dt;
      this.angle += this.dAngle * dt;
      this.dx += this.ddx * dt;
      this.dy += this.ddy * dt;
      this.x += this.dx * dt;
      this.y += this.dy * dt;
    }

    this.dSize += this.ddSize * dt;
    this.size += this.dSize * dt;

    this.boundingLines?.update( this );

    this.lifeSpan -= dt;
    this.isAlive = this.life > 0 && this.lifeSpan > 0;
  }

  align( others ) {
    this.vectors = [];

    if ( this.goalAngle ) {
      const targetWeight = Constants.TargetWeight;
      this.vectors.push( {
        x: Math.cos( this.goalAngle ) * targetWeight,
        y: Math.sin( this.goalAngle ) * targetWeight,
        color: 'gray',
      } );
    }

    others.forEach( other => {
      if ( other != this ) {
        const cx = other.x - this.x;
        const cy = other.y - this.y;
        const dist = Math.max( 0.1, Math.hypot( cx, cy ) - this.size - other.size );
        const angle = Math.atan2( cy, cx );
        
        // TODO: Should these be averaged as well? (Not just weighted?)
        // If we have a bunch of small align vectors, they can overwhelm one big avoid vector
        // Seems like dividing by number of ships could mitigate that
        
        const avoidWeight = Constants.AvoidWeight * Math.max( 0, Constants.AvoidDistance / dist - 1 );
        this.vectors.push( {
          x: -Math.cos( angle ) * avoidWeight,
          y: -Math.sin( angle ) * avoidWeight,
          color: 'red',
        } );
        
        // const alignWeight = Constants.AlignWeight / dist;
        // const averageAngle = this.angle + Util.deltaAngle( this.angle, other.angle ) / 2;
        
        // this.vectors.push ( {
        //   x: Math.cos( averageAngle ) * alignWeight,
        //   y: Math.sin( averageAngle ) * alignWeight,
        //   color: 'yellow',
        // } );
      }
    } );
    
    this.totalVector = this.vectors.reduce( ( a, b ) => ( { x: a.x + b.x, y: a.y + b.y } ), { x: 0, y: 0 } );
    this.goalAngle = Math.atan2( this.totalVector.y, this.totalVector.x );
  }

  getOffsetPosition( offset ) {
    const cos = Math.cos( this.angle );
    const sin = Math.sin( this.angle );
    
    return {
      x: this.x + this.size * ( cos * offset.front - sin * offset.side ),
      y: this.y + this.size * ( sin * offset.front + cos * offset.side ),
      angle: this.angle + offset.angle,
    }
  }

  getQuickHitTime( other ) {
    if ( this.boundingLines && other.boundingLines ) {

      // See https://stackoverflow.com/questions/33140999/at-what-delta-time-will-two-objects-collide
    
      const cx = this.x - other.x
      const cy = this.y - other.y
      const vx = this.dx - other.dx;
      const vy = this.dy - other.dy;
      const rr = this.size + other.size;

      const a = vx * vx + vy * vy;
      const b = 2 * ( cx * vx + cy * vy );
      const c = cx * cx + cy * cy - rr * rr;

      const disc = b * b - 4 * a * c;

      // If the objects don't collide, the discriminant will be negative
      // We only care about first intersection, so just return t0 (which uses -b)
      
      return disc < 0 ? Infinity : ( -b - Math.sqrt( disc ) ) / ( 2 * a );
    }
    else {
      return Infinity;
    }
  }

  getHit( other ) {
    if ( this.boundingLines && other.boundingLines ) {

      // TODO: Find a better way to make sure these are set
      if ( !this.boundingLines.lines )  this.boundingLines.update( this );
      if ( !other.boundingLines.lines )  other.boundingLines.update( other );

      const hit = this.boundingLines.getHit( other.boundingLines, this.dx, this.dy, other.dx, other.dy );
      hit.entities = [ this, other ];
      return hit;
    }
    else {
      return { time: Infinity };
    }
  }

  hitWith( hit ) {
    hit.entities.forEach( e => {
      if ( e != this && e.damage ) {
        this.life -= e.damage;
        this.bleed( hit );

        if ( this.life <= 0 ) {
          this.isAlive = false;
          this.die( hit );
        }
      }
    } );
  }

  bleed( hit ) {
    if ( this.getBleedParticle ) {
      // TODO: Normal should come from hit object
      const normal = Math.atan2( hit.position.y - this.y, hit.position.x - this.x );
      
      for ( let i = 0; i < 2; i ++ ) {
        const angle = normal + 0.5 * ( -0.5 + Math.random() );

        const speed = ( 0.01 + 0.1 * Math.random() );
        
        this.createdEntities.push( 
          Object.assign( this.getBleedParticle(), {
            x: hit.position.x,
            y: hit.position.y,
            dx: 0.5 * this.dx + speed * Math.cos( angle ),
            dy: 0.5 * this.dy + speed * Math.sin( angle ),
            dAngle: 0.02 * ( -0.5 + Math.random() ),
            lifeSpan: 1000 + 1000 * Math.random(),
          } )
        );
      }
    }
  }

  die( hit ) {
    if ( this.getDieParticle ) {
      for ( let i = 0; i < this.size * 3; i ++ ) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.size / 2;

        const speed = ( 0.01 + 0.03 * Math.random() );
        
        this.createdEntities.push( 
          Object.assign( this.getDieParticle(), {
            x: this.x,// + Math.cos( angle ) * dist,
            y: this.y,// + Math.sin( angle ) * dist,
            dx: 0.5 * this.dx + speed * Math.cos( angle ),
            dy: 0.5 * this.dy + speed * Math.sin( angle ),
            dAngle: 0.02 * ( -0.5 + Math.random() ),
            lifeSpan: 500 + 500 * Math.random(),
          } )
        );
      }
    }

    if ( this.getBleedParticle ) {
      for ( let i = 0; i < this.size * 4; i ++ ) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.5 + Math.random() * this.size;

        const speed = ( 0.01 + 0.1 * Math.random() );
        
        this.createdEntities.push( 
          Object.assign( this.getBleedParticle(), {
            x: this.x + Math.cos( angle ) * dist,
            y: this.y + Math.sin( angle ) * dist,
            dx: 0.5 * this.dx + speed * Math.cos( angle ),
            dy: 0.5 * this.dy + speed * Math.sin( angle ),
            dAngle: 0.02 * ( -0.5 + Math.random() ),
            lifeSpan: 1000 + 1000 * Math.random(),
          } )
        );
      }
    }
  }

  draw( ctx ) {
    ctx.save();

    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );
    ctx.scale( this.size, this.size );

    // Fade out at end of lifespan
    if ( this.lifeSpan < 1000 ) {
      ctx.globalAlpha = this.lifeSpan / 1000;
    }

    this.info?.drawPaths?.forEach( e => {
      ctx.fillStyle = e.fillStyle;
      ctx.fill( e.path );
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1 / this.size;
      ctx.stroke( e.path );
    } );

    ctx.restore();

    if ( Entity.DebugBounds ) {
      ctx.strokeStyle = 'red';
      this.boundingLines?.draw( ctx );
    }

    if ( Entity.DebugNavigation ) {
      if ( this.goal ) {
        ctx.strokeStyle = 'gray';
        ctx.beginPath();
        ctx.moveTo( this.goal.x, this.goal.y );
        ctx.lineTo( this.x, this.y );
        ctx.setLineDash( [ 5, 5 ] );
        ctx.stroke();
        ctx.setLineDash( [] );
      }

      ctx.save();
      ctx.translate( this.x, this.y );

      // ctx.fillStyle = 'rgba( 0, 100, 0, 0.5 )';
      // ctx.beginPath();
      // ctx.moveTo( 0, 0 );
      // ctx.arc( 0, 0, this.size, 0, Math.PI * 2 );
      // ctx.fill();

      ctx.fillStyle = 'rgba( 100, 100, 100, 0.1 )';
      ctx.beginPath();
      ctx.moveTo( 0, 0 );
      ctx.arc( 0, 0, this.size + Constants.AvoidDistance / 2, 0, Math.PI * 2 );
      ctx.fill();

      ctx.strokeStyle = this.info.color;
      ctx.beginPath();
      ctx.moveTo( 0, 0 );
      ctx.lineTo( Math.cos( this.goalAngle ) * Constants.UIScale, Math.sin( this.goalAngle ) * Constants.UIScale );
      ctx.stroke();

      drawVector( this.totalVector, ctx, 'white' );
      this.vectors?.forEach( v => drawVector( v, ctx, v.color ) );

      ctx.restore();
    }
  }
}

function drawVector( vector, ctx, color = 'white' ) {
  if ( vector ) { 
    const x = vector.x * Constants.UIScale;
    const y = vector.y * Constants.UIScale;
    const angle = Math.atan2( y, x );
    
    ctx.strokeStyle = ctx.fillStyle = color;
    
    ctx.beginPath();
    ctx.moveTo( 0, 0 );
    ctx.lineTo( x, y );
    ctx.stroke();
    
    const HEAD_LENGTH = 5;
    const HEAD_WIDTH = 2.5;
    ctx.beginPath();
    ctx.moveTo( x, y );
    ctx.arc( x, y, HEAD_LENGTH, angle + HEAD_WIDTH, angle - HEAD_WIDTH );
    ctx.fill();
  }
}