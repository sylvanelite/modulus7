
import { EngineInstance } from '../lib/definitions.mjs';
import { World } from '../lib/index.mjs';
import { Position } from './position.mjs';
 
class Physics {
    velocityX:number=0;
    velocityY:number=0;
    velocityZ:number=0;
    accelerationX:number=0;
    accelerationY:number=0;
    accelerationZ:number=0;
}

function updatePhysics(instance:EngineInstance) {
    instance.world.view(Position, Physics).each((entity, position, physics) => {
        // apply physics
        position.x += physics.velocityX;
        position.y += physics.velocityY;
        position.z += physics.velocityZ;

        physics.velocityX+=physics.accelerationX;
        physics.velocityY+=physics.accelerationY;
        physics.velocityZ+=physics.accelerationZ;
        
    });
}

export {Physics, updatePhysics}