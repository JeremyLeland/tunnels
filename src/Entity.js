export class Entity {
  x = 0;
  y = 0;
  angle = 0;

  dx = 0;
  dy = 0;
  dAngle = 0;

  isAlive = true;
  boundingLines = [];
  createdEntities = [];
  
  constructor( values ) {
    Object.assign( this, values );
  }

  hitWith( hit ) {
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
  }

  draw( ctx ) {
    ctx.save();
    ctx.translate( this.x, this.y );
    ctx.rotate( this.angle );

    this.drawEntity( ctx );

    ctx.restore();

    // ctx.strokeStyle = 'red';
    // this.boundingLines?.forEach( line => line.draw( ctx ) );
  }

  drawEntity( ctx ) {
  }
}