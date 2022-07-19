import { Bullet } from './Bullet.js';
// TODO: Forget the info objects, just make everything classes and duplicate everything?

const gunInfo = {
  'rifle': {
    'maxAmmo': 30,
    'timeBetweenShots': 100,
    'bulletsPerShot': 1,
    'spread': 0.1,
    'reloadTime': 1000,
  },
  'shotgun': {
    'maxAmmo': 8,
    'timeBetweenShots': 500,
    'bulletsPerShot': 6,
    'spread': 0.2,
    'reloadTime': 1500,
  }
}

export class Gun {
  type;
  ammo;
  timeUntilReady = 0;
  isShooting = false;
  isReloading = false;

  #info;
  #owner;

  constructor( gunType, owner ) {
    this.#info = gunInfo[ gunType ];
    this.#owner = owner;

    this.type = gunType;
    this.ammo = this.#info.maxAmmo;
  }

  update( dt ) {
    this.timeUntilReady -= dt;

    if ( this.timeUntilReady < 0 ) {
      this.isReloading = false;

      if ( this.isShooting && this.ammo > 0 ) {
        for ( let i = 0; i < this.#info.bulletsPerShot; i ++ ) {
          const info = this.#owner.getOffset( { 
            front: this.#owner.size,
            side:  0,
            angle: this.#info.spread * ( -0.5 + Math.random() ),
          } );
          
          info.type = this.type;
          info.dx = this.#owner.dx;
          info.dy = this.#owner.dy;
          
          this.#owner.shoot( new Bullet( info ) );
        }

        this.ammo --;

        if ( this.ammo == 0 ) {
          this.isReloading = true;
          this.ammo = this.#info.maxAmmo;
          this.timeUntilReady = this.#info.reloadTime;
        }
        else {
          this.timeUntilReady = this.#info.timeBetweenShots;
        }
      }
    }
  }

  getUIPercentage() {
    return this.isReloading ? 
      1 - this.timeUntilReady / this.#info.reloadTime : 
      this.ammo / this.#info.maxAmmo;
  }
}