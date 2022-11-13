import { Line } from './Line.js';

const DEBUG_BOUNDING = true;

export class Entity {
  x = 0;
  y = 0;
  angle = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;

  life = 1;
  lifeSpan = Infinity;
  isAlive = true;

  boundingLines = [];

  info = {};
  createdEntities = [];

  static firstRayHit( x, y, dx, dy, entities ) {
    const dists = entities.map( entity => entity.getRayHit( x, y, dx, dy ) );
    return dists.reduce( 
      ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: Infinity }
    );
  }
  
  constructor( values, info ) {
    Object.assign( this, values );
    this.info = info;

    this.life = this.info.life ?? this.life;
    this.lifeSpan = this.info.lifeSpan ?? this.lifeSpan;

    this.updateBoundingLines();
  }

  hitWith( hit ) {
    hit.entities.forEach( e => {
      if ( e != this ) {
        this.life -= e.info.damage;

        if ( this.info.hit ) {
          const hitInfo = this.info.hit;

          for ( let i = 0; i < hitInfo.count; i ++ ) {
            const values = { ...hit.position };
            
            // TODO: Use bounce angle?
            values.angle = e.angle + Math.PI;
            values.angle += hitInfo.spread * ( -0.5 + Math.random() );
            
            const speed = ( 0.5 + 0.5 * Math.random() ) * hitInfo.maxSpeed;
            values.dx = this.dx + Math.cos( values.angle ) * speed;
            values.dy = this.dy + Math.sin( values.angle ) * speed;
            
            this.createdEntities.push( new Entity( values, hitInfo.particle ) );
          }
        }

        if ( this.life <= 0 ) {
          this.isAlive = false;
        }
      }
    } );
  }

  getOffset( offset ) {
    const cos = Math.cos( this.angle );
    const sin = Math.sin( this.angle );
    
    return {
      x: this.x + this.info.size * ( cos * offset.front - sin * offset.side ),
      y: this.y + this.info.size * ( sin * offset.front + cos * offset.side ),
      angle: this.angle + offset.angle,
    }
  }

  updateBoundingLines() {
    const cos = Math.cos( this.angle );
    const sin = Math.sin( this.angle );

    this.boundingLines = [];

    const points = this.info.boundingPoints;
    if ( points ) {
      for ( let i = 0; i < points.length; i ++ ) {
        const current = points[ i ], next = points[ ( i + 1 ) % points.length ];
        this.boundingLines.push( 
          new Line (
            this.x + this.info.size * ( cos * current[ 0 ] - sin * current[ 1 ] ),
            this.y + this.info.size * ( sin * current[ 0 ] + cos * current[ 1 ] ),
            this.x + this.info.size * ( cos * next[ 0 ] - sin * next[ 1 ] ),
            this.y + this.info.size * ( sin * next[ 0 ] + cos * next[ 1 ] ),
          ) 
        );
      }
    }
  }

  // TODO: distanceToEntity and timeToHitEntity are similar
  //       distance checks rays against each normal
  //       timeToHit uses existing dx/dy
  // Can these be combined/use each other somehow?

  // getClosestRay( other ) {
  //   const rayHits = [];

  //   this.boundingLines.forEach( thisLine => {
  //     other.boundingLines.forEach( otherLine => {
  //       rayHits.push( thisLine.getClosestRay( otherLine ) )
  //     } );
  //   } );

  //   return rayHits.reduce(
  //     ( closest, rayHit ) => 0 < rayHit.time && rayHit.time < closest.time ? rayHit : closest, 
  //     { time: Infinity }
  //   );
  // }

  getClosestPoints( other ) {
    const lineComps = [];

    this.boundingLines.forEach( thisLine => {
      other.boundingLines.forEach( otherLine => {
        lineComps.push( Line.compare( thisLine, otherLine ) )
      } );
    } );

    return lineComps.reduce(
      ( closest, pos ) => pos.distance < closest.distance ? pos : closest
    );
  }

  getRayHit( x, y, dx, dy ) {
    const closestTime = this.boundingLines.map( line => 
      line.getRayHit( x, y, dx, dy )
    ).reduce(
      ( closest, time ) => 0 < time && time < closest ? time : closest, 
      Infinity
    );

    return {
      entity: this,
      dist: closestTime,
    };
  }

  getHit( other ) {
    let closestHit = { time: Infinity };

    if ( this.info.hit?.types?.includes( other.info.type ) || 
         other.info.hit?.types?.includes( this.info.type ) ) {
      
      const dx = this.dx - other.dx;
      const dy = this.dy - other.dy;

      this.boundingLines.forEach( thisLine => {
        other.boundingLines.forEach( otherLine => {

          // TODO: Move all this into some grand Line vs Line collision function?
          let lineHit = thisLine.getLineHit( otherLine );
          if ( 0 <= lineHit.uA && lineHit.uA <= 1 &&
               0 <= lineHit.uB && lineHit.uB <= 1 ) {
            closestHit = {
              time: 0,
              position: lineHit.position,
              entities: [ this, other ],
            };
          }
          
          let hit = thisLine.getHit( { x: otherLine.x1, y: otherLine.y1, dx: -dx, dy: -dy } );

          if ( 0 <= hit.time && hit.time < closestHit.time ) {
            closestHit = hit;
          }

          hit = otherLine.getHit( { x: thisLine.x1, y: thisLine.y1, dx: dx, dy: dy } );

          if ( 0 <= hit.time && hit.time < closestHit.time ) {
            closestHit = hit;
          }
        } );
      } );

      closestHit.entities = [ this, other ];
    }

    return closestHit;
  }

  update( dt ) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    this.angle += this.dAngle * dt;

    this.lifeSpan -= dt;
    if ( this.lifeSpan <= 0 ) {
      this.isAlive = false;
    }

    this.updateBoundingLines();
  }

  draw( ctx ) {
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );

    if ( this.lifeSpan < Infinity ) {
      ctx.globalAlpha = this.lifeSpan / this.info.lifeSpan;
    }

    this.drawEntity( ctx );

    ctx.restore();

    if ( DEBUG_BOUNDING ) {
      ctx.strokeStyle = 'red';
      this.boundingLines?.forEach( line => line.draw( ctx ) );
    }
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