import { Entity } from './Entity.js';
import { WallInfo } from '../info/info.js';

export class Wall extends Entity {  
  constructor( points ) {
    super( {}, Object.assign( { boundingPoints: points }, WallInfo.rock ) );
  }

  update( dt ) {
    // walls don't move
  }

  // draw( ctx ) {
  // }
}