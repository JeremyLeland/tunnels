import { Bullet } from './Bullet.js';
import { GunInfo } from '../info/info.js';

export class Gun {
  gunInfoKey;

  ammo = 0;
  timeUntilReady = 0;
  isReloading = false;

  info;
  #owner;

  constructor( values, owner ) {
    Object.assign( this, values );

    this.info = GunInfo[ this.gunInfoKey ];
    this.#owner = owner;

    this.ammo = this.info.maxAmmo;
  }

  update( dt ) {
    this.timeUntilReady -= dt;

    if ( this.timeUntilReady < 0 ) {
      this.isReloading = false;

      if ( this.#owner.isShooting && this.ammo > 0 ) {
        for ( let i = 0; i < this.info.bulletsPerShot; i ++ ) {
          const values = this.#owner.getOffset( this.offset );

          values.angle += this.info.spread * ( -0.5 + Math.random() );
          
          values.bulletInfoKey = this.info.bulletInfoKey;
          values.dx = this.#owner.dx;
          values.dy = this.#owner.dy;
          
          this.#owner.createdEntities.push( new Bullet( values ) );
        }

        this.ammo --;

        if ( this.ammo == 0 ) {
          this.isReloading = true;
          this.ammo = this.info.maxAmmo;
          this.timeUntilReady = this.info.reloadTime;
        }
        else {
          this.timeUntilReady = this.info.timeBetweenShots;
        }
      }
    }
  }

  getUIPercentage() {
    return this.isReloading ? 
      1 - this.timeUntilReady / this.info.reloadTime : 
      this.ammo / this.info.maxAmmo;
  }
}