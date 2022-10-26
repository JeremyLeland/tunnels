import { Wall } from './Wall.js';
import { AvoidingActor } from './AvoidingActor.js';

export class World {
  entities = [];

  static async fromFile( path ) {
    const json = JSON.parse( await ( await fetch( path ) ).text() );    // TODO: error handling
    return new World( json );
  }

  constructor( json ) {
    const walls = json.walls.map( points => new Wall( points ) );
    const entities = json.entities.map( values => new AvoidingActor( values ) );
    
    this.entities.push( ...walls );
    this.entities.push( ...entities );
  }

  update( dt ) {    
    for ( let tries = 0; dt > 0 && tries < 8; tries ++ ) {
      let closestHit = { time: Infinity };
      
      for ( let i = 0; i < this.entities.length; i ++ ) {
        for ( let j = i + 1; j < this.entities.length; j ++ ) {
          const hit = this.entities[ i ].getHit( this.entities[ j ] );
          
          if ( 0 <= hit.time && hit.time < closestHit.time ) {
            closestHit = hit;
          }
        }
      }
      
      let updateTime = Math.min( closestHit.time, dt );
      this.entities.forEach( entity => {
        if ( entity.info.avoids ) {
          entity.avoidList = this.entities.filter( other => other != entity && entity.info.avoids.includes( other.info.type ) );
        }

        if ( entity.info.targets ) {
          entity.targetList = this.entities.filter( other => other != entity && entity.info.targets.includes( other.info.type ) );
        }

        entity.update( updateTime );
      } );
      
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