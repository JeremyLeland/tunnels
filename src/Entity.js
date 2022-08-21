import { Line } from './Line.js';

export class Entity {
  x = 0;
  y = 0;
  angle = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;

  life = 0;
  damage = 0;

  isAlive = true;
  boundingLines = [];

  info = {};
  createdEntities = [];
  
  constructor( values, info ) {
    Object.assign( this, values );
    this.info = info;
    
    this.#updateBoundingLines();
  }

  hitWith( hit ) {
    hit.entities.forEach( e => {
      if ( e != this ) {
        this.life -= e.damage;
      }
    } );
  }

  getOffset( offset ) {
    const cos = Math.cos( this.angle );
    const sin = Math.sin( this.angle );
    
    return {
      x: this.x + cos * offset.front - sin * offset.side,
      y: this.y + sin * offset.front + cos * offset.side,
      angle: this.angle + offset.angle,
    }
  }

  #updateBoundingLines() {
    const cos = Math.cos( this.angle );
    const sin = Math.sin( this.angle );

    this.boundingLines = this.info.boundingLines?.map( 
      line => new Line(
        this.x + this.info.size * ( cos * line[ 0 ] - sin * line[ 1 ] ),
        this.y + this.info.size * ( sin * line[ 0 ] + cos * line[ 1 ] ),
        this.x + this.info.size * ( cos * line[ 2 ] - sin * line[ 3 ] ),
        this.y + this.info.size * ( sin * line[ 2 ] + cos * line[ 3 ] ),
      )
    );
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