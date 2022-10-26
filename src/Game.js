export class Game {
  scroll = { x: 0, y: 0 };

  #ctx;
  #reqId;

  constructor() {
    const canvas = document.createElement( 'canvas' );
    document.body.appendChild( canvas );
    
    this.#ctx = canvas.getContext( '2d' );

    canvas.oncontextmenu = () => { return false };
    window.onresize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      this.#ctx.scale( devicePixelRatio, devicePixelRatio );
    }
    window.onresize();
  }

  start() {
    let lastTime;
    const animate = ( now ) => {
      lastTime ??= now;  // for first call only
      this.update( now - lastTime );
      lastTime = now;
  
      this.#ctx.clearRect( 0, 0, this.#ctx.canvas.width, this.#ctx.canvas.height );

      this.#ctx.save();
      this.#ctx.translate( this.scroll.x, this.scroll.y );
      this.draw( this.#ctx );
      this.#ctx.restore();
  
      this.#reqId = requestAnimationFrame( animate );
    };

    this.#reqId = requestAnimationFrame( animate );
  }

  stop() {
    cancelAnimationFrame( this.#reqId );
  }

  update( dt ) {}
  draw( ctx ) {}
}
