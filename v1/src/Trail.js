export class Trail {
  maxLength;
  
  #points = [];
  #length = 0;

  constructor( maxLength ) {
    this.maxLength = maxLength;
  }

  addPoint( x, y, angle, length ) {
    this.#points.push( { x: x, y: y, angle: angle, length: length } );
    this.#length += length;

    while ( this.#length > this.maxLength && this.#points.length > 0 ) {
      const excess = this.#length - this.maxLength;
      const tail = this.#points[ 0 ];

      if ( excess > tail.length ) {
        this.#points.shift();
        this.#length -= tail.length;
      }
      else {
        tail.length -= excess;
        this.#length -= excess;
      }
    }
  }

  getPath( size ) {
    const path = new Path2D();

    if ( this.#points.length > 0 ) {
      const last = this.#points[ 0 ];
      path.moveTo( 
        last.x - Math.cos( last.angle ) * last.length, 
        last.y - Math.sin( last.angle ) * last.length,
      );
      for ( let i = 1; i < this.#points.length - 1; i ++ ) {
        const width = size * i / this.#points.length;
        const segment = this.#points[ i ];
  
        const leftAng = segment.angle - Math.PI / 2;
        const leftX = segment.x + Math.cos( leftAng ) * width;
        const leftY = segment.y + Math.sin( leftAng ) * width;
  
        path.lineTo( leftX, leftY );
      }
  
      const first = this.#points[ this.#points.length - 1 ];
      path.arc( first.x, first.y, size, first.angle - Math.PI / 2, first.angle + Math.PI / 2 );
  
      for ( let i = this.#points.length - 2; i > 0; i -- ) {
        const width = size * i / this.#points.length;
        const segment = this.#points[ i ];
  
        const rightAng = segment.angle + Math.PI / 2;
        const rightX = segment.x + Math.cos( rightAng ) * width;
        const rightY = segment.y + Math.sin( rightAng ) * width;
  
        path.lineTo( rightX, rightY );
      }
  
      path.closePath();
    }

    return path;
  }
}
