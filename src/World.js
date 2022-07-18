export class World {
  actors = [];
  bullets = [];
  lines = [];
  
  #pendingBullets = [];
  
  addBullet( bullet ) {
    this.#pendingBullets.push( bullet );
  }

  update( dt ) {
    this.bullets = this.bullets.concat( this.#pendingBullets );
    this.#pendingBullets = [];

    this.bullets.forEach( b => b.update( dt ) );
    this.bullets = this.bullets.filter( b => b.isAlive );
    
    this.actors.forEach( a => a.update( dt ) );
  }

  draw( ctx ) {
    ctx.strokeStyle = 'white';
    this.lines.forEach( line => line.draw( ctx ) );
    this.bullets.forEach( bullet => bullet.draw( ctx ) );
    this.actors.forEach( alien => alien.draw( ctx ) );
  }
}