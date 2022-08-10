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
    speed: 0.9,
    size: 1,
    color: 'gray',
    trailLength: 40,
  },
  shotgun: {
    speed: 1.2,
    size: 1,
    color: 'darkgoldenrod',
    trailLength: 60,
  }
}

const GUN_W = 0.15, GUN_LEN = 1.7;

export const ActorInfo = {
  marine: {
    maxSpeed: 0.1,
    turnSpeed: 0.008,
    accelSpeed: 0.0005,
    size: 14,
    boundingLines: [
      [ -0.5, -1,  2,  0 ],
      [  2,  0, -0.5,  1 ],
      [ -0.5,  1, -0.5, -1 ],
    ],
    gun: {
      gunInfoKey: 'shotgun',
      offset: { front: 14, side: 0, angle: 0 }
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
    maxSpeed: 0.1,
    turnSpeed: 0.008,
    accelSpeed: 0.0005,
    size: 10,
    boundingLines: [
      [ -1,  0,  1, -1 ],
      [  1, -1,  1,  1 ],
      [  1,  1, -1,  0 ],
    ],
    drawPaths: [ {
      fillStyle: 'green',
      path: new Path2D( 'M -1 0 L 0.75 -1 A 0.5 1 0 0 1 0.75 1 Z' ),
    } ],
  }
}