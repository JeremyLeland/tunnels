import { Line } from './Line.js';

export class Entity {
  x = 0;
  y = 0;
  angle = 0;
  size = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;
  dSize = 0;

  isAlive = true;
  boundingLines;
  createdEntities = [];
  
  constructor( info ) {
    Object.assign( this, info );
  }

  getBounds() {
    if ( this.boundingLines ) {
      const cos = Math.cos( this.angle );
      const sin = Math.sin( this.angle );
      
      return this.boundingLines.map( line => new Line(
        this.x + cos * line.x1 - sin * line.y1,
        this.y + sin * line.x1 + cos * line.y1,
        this.x + cos * line.x2 - sin * line.y2,
        this.y + sin * line.x2 + cos * line.y2,
      ) );
    }
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

  update( dt ) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    this.angle += this.dAngle * dt;
    this.size += this.dSize * dt;
  }

  draw( ctx ) {
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );

    this.drawEntity( ctx );

    ctx.restore();

    ctx.strokeStyle = 'red';
    this.getBounds()?.forEach( line => line.draw( ctx ) );
  }

  drawEntity( ctx ) {

  }
}