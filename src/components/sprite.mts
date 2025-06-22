
import { IGLMode7Renderer } from 'src/GLMode7Renderer.mjs';
import { EngineInstance, IColour, IGLSpriteRenderer, ISpriteDescription, Utils } from '../lib/definitions.mjs';
import { World,Colour,  GLSpriteRenderer, EngineMath } from '../lib/index.mjs';
import { Position } from './position.mjs';


class SpriteComponent implements ISpriteDescription {
    srcX:number=0;
    srcY:number=0;
    srcWidth:number=0;
    srcHeight:number=0;
    textureIndex:number=0;
 }
 class Drawing {
    scaleX:number = 1;
    scaleY:number = 1;
    colour:IColour = Colour.rgb();
    additive:IColour = Colour.rgb(0,0,0);
 }

function darwSprite(instance:EngineInstance,spriteLayer:IGLSpriteRenderer,mode7:IGLMode7Renderer) {
   const f =  instance.world.view(Position, SpriteComponent, Drawing);
    GLSpriteRenderer.beginFrame(instance,spriteLayer);
    f.each((entity,position, sprite, drawing) => {
        
        const screenPos = spriteToScreen(instance,position.x,position.y,mode7);
        if(!screenPos){return;}//sprite not visible
        const angle = 0;
        //scale sprites by depth from horizon
        const distanceScale = ((screenPos.screenY-mode7.horizon)/(mode7.render_height-mode7.horizon));
        const scaleX = distanceScale;
        const scaleY = distanceScale;
        
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,sprite as ISpriteDescription,
            
            screenPos.screenX,
            screenPos.screenY - position.z*distanceScale,
            
            scaleX*drawing.scaleX,scaleY*drawing.scaleY,angle,Colour.rgbaInt(drawing.colour),drawing.additive.a!=1?Colour.rgbaInt(drawing.additive):undefined);
    });
    GLSpriteRenderer.glFlush(instance,spriteLayer);
}

function spriteToScreen(instinstance:EngineInstance,floorX:number,floorY:number,mode7:IGLMode7Renderer){

    const rotation_sin = Math.sin((mode7.theta - mode7.fov) * Utils.DEG_TO_RAD);
    const rotation_cos = Math.cos((mode7.theta - mode7.fov) * Utils.DEG_TO_RAD);

    const spr={
        screenX:0,
        screenY:0,
    };

    //TODO: check clipping (esp horizon)  

    //check sprites are in  the camera's viewport (angle to sprite should be between the camera's left/right fov edges)
    const angle = Math.atan2(mode7.y0 - floorY, mode7.x0 - floorX) * Utils.RAD_TO_DEG;
    const anglediff = (mode7.theta - angle + 180 + 360) % 360 - 180;
    const visible = (anglediff <= mode7.fov && anglediff>=-mode7.fov);
    if(!visible){return;}
    //get position on the screen, worked out by inverting the projection above
    const deltaObjectSum = floorX + floorY - mode7.x0 - mode7.y0;
    const screenYDenominator = rotation_cos * deltaObjectSum + rotation_sin * (-floorX +  floorY - mode7.y0 + mode7.x0);
    const denominatorX = (rotation_cos + rotation_sin) * ( floorY - mode7.y0);
    //skip if there's a divide by 0
    if (screenYDenominator === 0 || denominatorX === 0) return;
    const screenXDenominator = 1 + (rotation_cos * (floorX - mode7.x0) - rotation_sin * (floorX - mode7.x0)) /denominatorX;
    if (screenXDenominator === 0) return;
    const screenX = ( (rotation_cos *floorY - rotation_cos *mode7.y0 -  rotation_sin *floorX + rotation_sin *mode7.x0)  * (mode7.render_width/denominatorX)) / screenXDenominator;
    const screenY = (-rotation_cos * rotation_cos * mode7.height * mode7.render_width +
                    rotation_cos * deltaObjectSum * mode7.horizon - rotation_sin*mode7.height*rotation_sin*mode7.render_width - 
                    rotation_sin*mode7.horizon*floorX + rotation_sin*mode7.horizon*mode7.x0 - 
                    rotation_sin*mode7.horizon*mode7.y0 + rotation_sin*mode7.horizon*floorY) / screenYDenominator;
    if(screenY<mode7.horizon-32){return;}//approximately where the lower BG ends
    spr.screenX = screenX;
    spr.screenY = screenY;
    //ctx.fillRect(spr.screenX-8, spr.screenY-16, 16, 16);
    //console.log(floorX,floorX,screenX,screenY);
    return spr;
}

export {SpriteComponent,darwSprite,Drawing}