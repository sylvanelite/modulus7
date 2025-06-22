
import { EngineInstance, IGLSpriteRenderer, ISound, Utils } from '../lib/definitions.mjs';
import { EngineInput } from '../lib/engineInput.mjs';
import { GLSpriteRenderer } from '../lib/GLSpriteRenderer.mjs';
import { EngineSound } from '../lib/engineSound.mjs';
import { changeMode,ModeKind } from './gameMode.mjs';
import { Colour } from '../lib/colour.mjs';
import { type ISpawner,Spawner } from './spawner.mjs';
import { Player } from './player.mjs';
import { Enemy } from './enemy.mjs';
import { Bullet } from './bullet.mjs';
import { Emitter, Particle } from './emitter.mjs';


class MainMenu{
    constructor(instance:EngineInstance){}
    static updateMainMenu(instance:EngineInstance,menu:MainMenu,player:Player,spawner:ISpawner) {
        
        // play sound when mouse is pressed
        if (EngineInput.keyWasPressed(instance,0)){
            EngineSound.play(instance,
                instance.audio.sfx_menu,
                undefined,1,1,1,false);
            
            //reset level
            const level = Math.ceil(Math.random()*5);
            Spawner.setLevel(spawner,level);
            Player.resetPlayer(player);
            
            changeMode(instance,ModeKind.Game);
            EngineSound.stop(instance.audio['./media/audio/menu.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level1.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level2.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level3.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level4.mp3']);
            EngineSound.stop(instance.audio['./media/audio/level5.mp3']);
            EngineSound.play(instance,instance.audio[`./media/audio/level${level}.mp3`],undefined,1,1,1,true);
            for (const entity of instance.world.all()){
                if(instance.world.has(entity,Enemy)){
                    instance.world.destroy(entity);
                    continue;
                }
                if(instance.world.has(entity,Bullet)){
                    instance.world.destroy(entity);
                    continue;
                }
                if(instance.world.has(entity,Particle)){
                    instance.world.destroy(entity);
                    continue;
                }
                if(instance.world.has(entity,Emitter)){
                    if(entity == player.engineEmitter ||entity==player.shieldEmitter ){
                        continue;//don't despawn engine
                    }
                    instance.world.destroy(entity);
                    continue;
                }
            }

            console.log("begin");
            return level;
        }
        return 0;
    }
    static drawMainMenu(instance:EngineInstance,menu:MainMenu,spriteLayer:IGLSpriteRenderer){
        GLSpriteRenderer.beginFrame(instance,spriteLayer);
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.menuBG,
            instance.domCanvas.width/2,instance.domCanvas.height/2, 4, 4,0,Colour.rgbaInt(Colour.rgb()));

        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.menuMainBegin,
            instance.domCanvas.width/2,216, 2, 2,0,Colour.rgbaInt(Colour.rgb()));
        if(EngineInput.isMouseOver(instance,{x:32,y:32,w:320-64,h:270-64})){
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.menuMainBeginHover,
                instance.domCanvas.width/2,216, 2, 2,0,Colour.rgbaInt(Colour.rgb()));
        }
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,instance.sprites.menuMainTag,
            instance.domCanvas.width/2,256, 2, 2,0,Colour.rgbaInt(Colour.rgb()));
        
        
        GLSpriteRenderer.glFlush(instance,spriteLayer);
    }
}



export {MainMenu}