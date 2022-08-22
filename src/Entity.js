import { Line } from './Line.js';

export class Entity {
  x = 0;
  y = 0;
  angle = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;

  life = 1;
  isAlive = true;

  boundingLines = [];

  info = {};
  createdEntities = [];
  
  constructor( values, info ) {
    Object.assign( this, values );
    this.info = info;

    this.life = this.info.life;

    this.#updateBoundingLines();
  }

  hitWith( hit ) {
    hit.entities.forEach( e => {
      if ( e != this ) {
        this.life -= e.info.damage;

        // const values = hit.position;

        // // TODO: Use bounce angle?
        // values.angle = e.angle + Math.PI;
        // //values.angle += this.#info.spread * ( -0.5 + Math.random() );
        
        // values.dx = this.dx;
        // values.dy = this.dy;
        
        // this.createdEntities.push( new Entity( values, this.info.hitParticle ) );

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

  #updateBoundingLines() {
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

  getHit( other ) {
    let closestHit = { time: Infinity };

    this.boundingLines.forEach( thisLine => {
      other.boundingLines.forEach( otherLine => {
        let hit = thisLine.getHit( { x: otherLine.x1, y: otherLine.y1, dx: other.dx, dy: other.dy } );

        if ( 0 < hit.time && hit.time < closestHit.time ) {
          closestHit = hit;
        }

        hit = otherLine.getHit( { x: thisLine.x1, y: thisLine.y1, dx: this.dx, dy: this.dy } );

        if ( 0 < hit.time && hit.time < closestHit.time ) {
          closestHit = hit;
        }
      } );
    } );

    closestHit.entities = [ this, other ];

    return closestHit;
  }

  update( dt ) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    this.angle += this.dAngle * dt;

    this.#updateBoundingLines();
  }

  draw( ctx ) {
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );

    this.drawEntity( ctx );

    ctx.restore();

    ctx.strokeStyle = 'red';
    this.boundingLines?.forEach( line => line.draw( ctx ) );
  }

  drawEntity( ctx ) {
  }
}