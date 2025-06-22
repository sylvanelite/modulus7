
import { EngineInstance, IGLSpriteRenderer, ISound, Utils } from '../lib/definitions.mjs';
import { EngineInput } from '../lib/engineInput.mjs';
import { GLSpriteRenderer } from '../lib/GLSpriteRenderer.mjs';
import { EngineSound } from '../lib/index.mjs';
import { changeMode,ModeKind } from './gameMode.mjs';
import { Player } from './player.mjs';
import { BulletKind, IWeapon, Weapon } from './bullet.mjs';
import { Colour } from '../lib/colour.mjs';


class levelVictoryMenu{
    static updateVictoryMenu(instance:EngineInstance,player:Player) {
        
        // go to main menu
        if (EngineInput.keyWasPressed(instance,0)){
            changeMode(instance,ModeKind.MainMenu);
            
        }
    }
    
    static drawVictoryMenu(instance:EngineInstance,spriteLayer:IGLSpriteRenderer){
        
        GLSpriteRenderer.beginFrame(instance,spriteLayer); 
    
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,
            instance.sprites.levelVictory,
            instance.domCanvas.width/2,instance.domCanvas.height/2, 4, 4,0,Colour.rgbaInt(Colour.rgb()));
        
        
        GLSpriteRenderer.glFlush(instance,spriteLayer);
    }
}



export {levelVictoryMenu}