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

    // TODO: Find first bullet collision

    let closestHit;
    
    do {
      closestHit = { time: Infinity };

      // TODO: Moving lines collision?
      // https://stackoverflow.com/questions/9099085/intersection-of-two-moving-line-segments-or-a-moving-line-segment-and-a-point
      // Or just check all our points against their lines, then all their points against our lines?


      this.bullets.forEach( bullet => {
        this.lines.forEach( line => { 
          const hit = line.getHit( bullet );
  
          if ( 0 < hit.time && hit.time < closestHit.time ) {
            closestHit = hit;
          }
        } );
      } );
  
      let time = dt;

      if ( closestHit.time < dt ) {
        time = closestHit.time;

        // closestHit.entities.forEach( e => e.hitWith( hit ) );
        closestHit.entities.forEach( e => {
          e.isAlive = false;
        } );
      }

      this.bullets.forEach( b => b.update( time ) );
      this.bullets = this.bullets.filter( b => b.isAlive );
      
      this.actors.forEach( a => a.update( time ) );

      dt -= time;
    }
    while ( dt > 0 );    
  }

  draw( ctx ) {
    ctx.strokeStyle = 'white';
    this.lines.forEach( line => line.draw( ctx ) );
    this.bullets.forEach( bullet => bullet.draw( ctx ) );
    this.actors.forEach( alien => alien.draw( ctx ) );
  }
}