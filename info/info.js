export const GunInfo = {
  rifle: {
    maxAmmo: 30,
    timeBetweenShots: 100,
    bulletsPerShot: 1,
    spread: 0.1,
    reloadTime: 1000,
  },
  shotgun: {
    maxAmmo: 8,
    timeBetweenShots: 500,
    bulletsPerShot: 6,
    spread: 0.2,
    reloadTime: 1500,
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

export const ActorInfo = {
  marine: {
    maxSpeed: 0.1,
    turnSpeed: 0.008,
    accelSpeed: 0.0005,
    size: 10,
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