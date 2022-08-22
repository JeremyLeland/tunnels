export class World {
  entities = [];

  update( dt ) {    
    for ( let tries = 0; dt > 0 && tries < 8; tries ++ ) {
      let closestHit = { time: Infinity };
      
      for ( let i = 0; i < this.entities.length; i ++ ) {
        for ( let j = i + 1; j < this.entities.length; j ++ ) {
          const hit = this.entities[ i ].getHit( this.entities[ j ] );
          
          if ( 0 < hit.time && hit.time < closestHit.time ) {
            closestHit = hit;
          }
        }
      }
      
      let updateTime = Math.min( closestHit.time, dt );
      this.entities.forEach( e => e.update( updateTime ) );
      
      if ( closestHit.time < dt ) {
        closestHit.entities.forEach( e => e.hitWith( closestHit ) );  
      }

      dt -= updateTime;
      
      const createdEntities = [];
      this.entities.forEach( 
        e => createdEntities.push( ...e.createdEntities.splice( 0 ) ) 
      );
      this.entities.push( ...createdEntities );
      this.entities = this.entities.filter( e => e.isAlive );
    }
  }

  draw( ctx ) {
    this.entities.forEach( e => e.draw( ctx ) );
  }
}