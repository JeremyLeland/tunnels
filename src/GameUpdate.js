export class GameUpdate {
  #updateFunc;
  #lastTime;
  #reqId;

  constructor( updateFunc ) {
    this.#updateFunc = updateFunc;
  }

  #animate( now ) {
    this.#lastTime ??= now;  // for first call only
    this.#updateFunc( now - this.#lastTime );
    this.#lastTime = now;

    this.#reqId = requestAnimationFrame( ( now ) => this.#animate( now ) );
  }

  start() {
    this.#reqId = requestAnimationFrame( ( now ) => this.#animate( now ) );
  }

  stop() {
    cancelAnimationFrame( this.#reqId );
  }
}