export const GunInfo = {
  rifle: {
    maxAmmo: 30,
    timeBetweenShots: 100,
    bulletsPerShot: 1,
    spread: 0.1,
    reloadTime: 1000,
    bulletInfoKey: 'rifle',
  },
  shotgun: {
    maxAmmo: 8,
    timeBetweenShots: 500,
    bulletsPerShot: 6,
    spread: 0.2,
    reloadTime: 1500,
    bulletInfoKey: 'shotgun',
  }
}

export const BulletInfo = {
  rifle: {
    life: 1,
    damage: 10,
    speed: 0.9,
    size: 2,
    boundingPoints: [
      [ -1, -1 ],
      [  1,  0 ],
      [ -1,  1 ],
    ],
    color: 'gray',
    trailLength: 40,
  },
  shotgun: {
    life: 1,
    damage: 10,
    speed: 1.2,
    size: 1,
    boundingPoints: [
      [ -1, -1 ],
      [  1,  0 ],
      [ -1,  1 ],
    ],
    color: 'darkgoldenrod',
    trailLength: 60,
  }
}

const GUN_W = 0.15, GUN_LEN = 1.7;

export const ActorInfo = {
  marine: {
    life: 100,
    damage: 1,
    maxSpeed: 0.1,
    turnSpeed: 0.008,
    accelSpeed: 0.0005,
    size: 14,
    boundingPoints: [
      [ -0.5, -1 ],
      [  2.0,  0 ],
      [ -0.5,  1 ],
    ],
    gun: {
      gunInfoKey: 'rifle',
      offset: { front: 2, side: 0, angle: 0 }
    },
    hitParticle: {
      size: 4,
      maxSpeed: 0.1,
      fillStyle: 'red',
      path: new Path2D( 'M 0 -0.5 A 0.5 0.5 0 0 1 0 0.5 A 0.5 0.5 0 0 1 0 -0.5' ),
    },
    drawPaths: [ {
      fillStyle: 'gray',
      path: new Path2D( `M 0.5 ${ -GUN_W } L ${ GUN_LEN } ${ -GUN_W } L ${ GUN_LEN } ${ GUN_W } L 0.5 ${ GUN_W } Z` ),
    }, {
      fillStyle: 'blue',
      path: new Path2D( `M 0 -1 L 1.5 ${ -GUN_W } L 1.2 ${ -GUN_W } L 0 -0.5 Z` ),
    }, {
      fillStyle: 'blue',
      path: new Path2D( `M 0 1 L 1.2 ${ GUN_W } L 1 ${ GUN_W } L 0 0.5 Z` ),
    }, {
      fillStyle: 'darkblue',
      path: new Path2D( 'M 0 -1 A 0.3 1 0 0 1 0 1 A 0.3 1 0 0 1 0 -1' ),
    }, {
      fillStyle: 'blue',
      path: new Path2D( 'M 0 -0.5 A 0.5 0.5 0 0 1 0 0.5 A 0.5 0.5 0 0 1 0 -0.5' ),
    } ],
  },
  alien: {
    life: 50,
    damage: 1,
    maxSpeed: 0.1,
    turnSpeed: 0.008,
    accelSpeed: 0.0005,
    size: 10,
    boundingPoints: [
      [ -1,  0 ],
      [  1, -1 ],
      [  1,  1 ],
    ],
    hitParticle: {
      size: 4,
      maxSpeed: 0.1,
      fillStyle: 'green',
      path: new Path2D( 'M 0 -0.5 A 0.5 0.5 0 0 1 0 0.5 A 0.5 0.5 0 0 1 0 -0.5' ),
    },
    drawPaths: [ {
      fillStyle: 'green',
      path: new Path2D( 'M -1 0 L 0.75 -1 A 0.5 1 0 0 1 0.75 1 Z' ),
    } ],
  }
}