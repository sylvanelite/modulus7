
import { EngineInstance, ISpriteDescription, Utils } from '../lib/definitions.mjs';
import { World } from '../lib/index.mjs';
import { Physics } from './physics.mjs';
import { Position } from './position.mjs';
import { Drawing, SpriteComponent } from './sprite.mjs';
 
enum EmitterKind{
    None,
    //each has 3x particles
    Engine,
    Explode,
    Hit,
    Shield,
    Smoke
}
class Emitter {
    active:boolean = false;//flag for if the emitter is alive
    transient:boolean = true;//if the emitter should be destroyed on complete
    duration:number = 0;//how long to spawn particles for
    emitRate:number = 1;//number of particles per frame
    kind:EmitterKind = EmitterKind.None;
}

function createEmitter(instance:EngineInstance, x:number,y:number,z:number,kind:EmitterKind){

    const entity =  instance.world.create(new Position, new Emitter);
    const position = instance.world.get(entity,Position);
    position.x = x;
    position.y = y;
    position.z = z;
    const emitter = instance.world.get(entity,Emitter);
    emitter.kind = kind;
    emitter.active = true;
    switch(emitter.kind){
        case EmitterKind.Engine:
            emitter.emitRate=1;
            emitter.duration=4;
            break;
        case EmitterKind.Explode:
            emitter.emitRate=1;
            emitter.duration=4;
            break;
        case EmitterKind.Hit:
            emitter.emitRate=3;
            emitter.duration=1;
            break;
        case EmitterKind.Shield:
            emitter.emitRate=1;
            emitter.duration=5;
            break;
        case EmitterKind.Smoke:
            emitter.emitRate=3;
            emitter.duration=20;
            break;
    }
    return entity;
    
}

class Particle{
    duration:number;
}
function pickRandSprite(choice:Array<ISpriteDescription>){
    return choice[Math.floor(Math.random()*choice.length)];
}
function updateEmitter(instance:EngineInstance) {
            
    instance.world.view(Position,Emitter).each((emitterEntity, emitterPosition, emitter) => {
        emitter.duration-=1;
        if(emitter.duration<=0){
            emitter.active = false;
            if(emitter.transient){
                instance.world.destroy(emitterEntity);
            }
            return;
        }
        //spawn particle
        for(let i=0;i<emitter.emitRate;i+=1){
            const entity =  instance.world.create(new SpriteComponent, new Drawing, new Position,new Physics, new Particle);
            const drawing = instance.world.get(entity,Drawing);
            drawing.scaleX=4+(1+Math.random()*0.5-Math.random()*0.5);
            drawing.scaleY=4+(1+Math.random()*0.5-Math.random()*0.5);
            const position = instance.world.get(entity,Position);
            position.x = emitterPosition.x;
            position.y = emitterPosition.y;
            position.z = emitterPosition.z;
            let moveSpeed = -Math.random()*0.5;
            let angle = 360*Math.random();
            const physics = instance.world.get(entity,Physics);
            physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*moveSpeed;
            physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
            physics.velocityZ = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
            const particle = instance.world.get(entity,Particle);
            particle.duration = 20;
            let spriteDesc = instance.sprites.particleEngineA;
            const sprites = instance.sprites;
            switch(emitter.kind){
                case EmitterKind.Engine:
                    particle.duration = 5+Math.random()*2-Math.random()*2;
                    spriteDesc = pickRandSprite([sprites.particleEngineA,sprites.particleEngineB,sprites.particleEngineC]);
                    moveSpeed = -Math.random()*0.5;
                    angle = 360*Math.random();
                    physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityZ = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    break;
                case EmitterKind.Explode:
                    particle.duration = 50+Math.random()*10-Math.random()*10;
                    spriteDesc = pickRandSprite([sprites.particleExplodeA,sprites.particleExplodeB,sprites.particleExplodeC]);
                    moveSpeed = -Math.random()*0.5;
                    angle = 360*Math.random();
                    physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityZ = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    break;
                case EmitterKind.Hit:
                    particle.duration = 5+Math.random()*2-Math.random()*2;
                    spriteDesc = pickRandSprite([sprites.particleHitA,sprites.particleHitB,sprites.particleHitC]);
                    moveSpeed = -Math.random();
                    angle = 360*Math.random();
                    physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityZ = Math.random()-Math.random();
                    break;
                case EmitterKind.Shield:
                    particle.duration = 20+Math.random()*10-Math.random()*10;
                    spriteDesc = pickRandSprite([sprites.particleShieldA,sprites.particleShieldB,sprites.particleShieldC]);
                    moveSpeed = 0;
                    angle = 0;
                    physics.velocityX = 0;
                    physics.velocityY = 0;
                    physics.velocityZ = 0;
                    break;
                case EmitterKind.Smoke:
                    particle.duration = 80+Math.random()*20-Math.random()*20;
                    spriteDesc = pickRandSprite([sprites.particleSmokeA,sprites.particleSmokeB,sprites.particleSmokeC]);
                    moveSpeed = -Math.random()*0.5;
                    angle = 360*Math.random();
                    physics.velocityX = Math.cos(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityY = Math.sin(angle*Utils.DEG_TO_RAD)*moveSpeed;
                    physics.velocityZ = 0;
                    physics.accelerationZ = 0.1+Math.random()*0.2;
                    break;
            }
            const sprite = instance.world.get(entity,SpriteComponent);
            sprite.srcWidth = spriteDesc.srcWidth;//TODO: wrap create() with props copy 
            sprite.srcHeight = spriteDesc.srcHeight;
            sprite.srcX = spriteDesc.srcX;
            sprite.srcY = spriteDesc.srcY;
            sprite.textureIndex = spriteDesc.textureIndex;
        }
    });
}
function udpateParticle(instance:EngineInstance){  
    instance.world.view(Particle).each((entity, particle) => {
        particle.duration-=1;
        if(particle.duration<=0){
            instance.world.destroy(entity);
        }
    });

}

export {Emitter, EmitterKind, Particle, updateEmitter, createEmitter, udpateParticle}