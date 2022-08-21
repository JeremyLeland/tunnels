import { Entity } from './Entity.js';
import { Trail } from './Trail.js';
import { BulletInfo } from '../info/info.js';


export class Bullet extends Entity {
  #info;
  #trail;

  constructor( values ) {
    super( values );

    this.#info = BulletInfo[ this.bulletInfoKey ];

    this.dx += Math.cos( this.angle ) * this.#info.speed;
    this.dy += Math.sin( this.angle ) * this.#info.speed;

    this.#trail = new Trail( this.#info.trailLength );
  }

  hitWith( hit ) {
    
  }

  update( dt ) {
    super.update( dt );
    this.#trail.addPoint( this.x, this.y, this.angle, this.#info.speed * dt );
  }

  draw( ctx ) {
    ctx.fillStyle = this.#info.color;
    ctx.fill( this.#trail.getPath( this.#info.size ) );
  }
}