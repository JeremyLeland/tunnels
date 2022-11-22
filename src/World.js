import { Wall } from './Wall.js';
import { Entity } from './Entity.js';
import { PathfindingActor } from './PathfindingActor.js';

import { CellMap } from '../test/cdt/CellMap.js';
import * as Pathfinding from './Pathfinding.js';

export class World {
  entities = [];

  #cellMap;

  static async fromFile( path ) {
    const json = JSON.parse( await ( await fetch( path ) ).text() );    // TODO: error handling
    return new World( json );
  }

  constructor( json ) {
    const walls = json.walls.map( points => new Wall( points ) );
    const entities = json.entities.map( values => new PathfindingActor( values ) );
    
    this.entities.push( ...walls );
    this.entities.push( ...entities );

    this.#cellMap = new CellMap( json.walls );
    this.#cellMap.mergeConvex();
  }

  getRandomLocation( x, y, radius, size ) {
    for ( let tries = 0; tries < 10; tries ++ ) {
      const angle = ( Math.random() - 0.5 ) * Math.PI * 2;
      const location = {
        x: x + Math.cos( angle ) * radius,
        y: y + Math.sin( angle ) * radius,
      };
      const cell = this.#cellMap.cellAt( location.x, location.y );

      // TODO: Use size to make sure location will not place actor outside of cell
      //       For now, use center of cell and hope for the best

      if ( cell ) {
        // return { x: cell.x, y: cell.y };
        return location;
      }
    }
  }

  getPathBetween( start, end ) {
    const startCell = this.#cellMap.cellAt( start.x, start.y );
    const endCell = this.#cellMap.cellAt( end.x, end.y );

    if ( startCell && endCell ) {
      const path = Pathfinding.getPath( startCell, endCell );

      const waypoints = [];
      for ( let i = 0; i < path?.length - 1; i ++ ) {
        const edgeIndex = path[ i ].links.findIndex( link => link == path[ i + 1 ] );
        waypoints.push( path[ i ].edges[ edgeIndex ] );
      }

      return waypoints;
    }
  }

  update( dt ) {
    for ( let tries = 0; dt > 0 && tries < 8; tries ++ ) {
      let closestHit = { time: Infinity };
      
      for ( let i = 0; i < this.entities.length; i ++ ) {
        for ( let j = i + 1; j < this.entities.length; j ++ ) {
          const A = this.entities[ i ];
          const B = this.entities[ j ];

          // Collisions
          const hit = A.getHit( B );
          
          if ( 0 <= hit.time && hit.time < closestHit.time ) {
            closestHit = hit;
          }

          // Avoidance
          // TODO: What if it's a target? (e.g. do aliens avoid marines if they are persuing another target?)
          const aAvoidsB = A.info.avoids?.includes( B.info.type );
          const bAvoidsA = B.info.avoids?.includes( A.info.type );

          if ( aAvoidsB || bAvoidsA ) {
            const points = A.getClosestPoints( B );

            const angle = Math.atan2( points.closestB.y - points.closestA.y, points.closestB.x - points.closestA.x );
            const dist  = points.distance;
    
            const AVOID_DIST = 10;  // TODO: specify this somewhere else?
            const repulsion = Math.max( 0, 1 - dist / AVOID_DIST );
    
            if ( aAvoidsB ) {
              A.avoidVector.x -= Math.cos( angle ) * repulsion;
              A.avoidVector.y -= Math.sin( angle ) * repulsion;
            }
    
            if ( bAvoidsA ) {
              B.avoidVector.x += Math.cos( angle ) * repulsion;
              B.avoidVector.y += Math.sin( angle ) * repulsion;
            }
          }
        }
      }
      
      let updateTime = Math.min( closestHit.time, dt );
      this.entities.forEach( entity => {
        if ( entity.info.avoids && entity.info.targets ) {
          const avoidList = this.entities.filter( other => other != entity && entity.info.avoids.includes( other.info.type ) );
          const targetList = this.entities.filter( other => other != entity && entity.info.targets.includes( other.info.type ) );

          const allTargets = targetList.filter( e => e.isAlive ).map( target => ( {
            entity: target, 
            angle: Math.atan2( target.y - entity.y, target.x - entity.x ),
            dist:  Math.hypot( target.x - entity.x, target.y - entity.y ),
          } ) );
          
          const visibleTargets = allTargets.filter( target =>
            target.entity == Entity.firstRayHit( 
              entity.x, entity.y, 
              Math.cos( target.angle ), Math.sin( target.angle ), 
              avoidList 
            ).entity
          );
      
          entity.attackTarget = visibleTargets.reduce( 
            ( closest, e ) => e.dist < closest.dist ? e : closest, { dist: entity.info.targetRange }
          ).entity;
        }

        entity.update( updateTime, this );
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

    // this.#cellMap.draw( ctx );

    this.entities.forEach( e => e.draw( ctx ) );
  }
}