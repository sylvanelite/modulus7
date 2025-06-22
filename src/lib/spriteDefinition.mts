
import { type EngineInstance,  type ISpriteDescription } from "./definitions.mjs";
import { EngineGL } from "./engineGL.mjs";

class SpriteDescription {
    //given a texture, creates a sprite that describtes a segment of that texture
    static sprite(instance:EngineInstance,textureIndex:number,srcWidth:number,srcHeight:number,srcX:number,srcY:number):ISpriteDescription {
        if(textureIndex<0||textureIndex>=instance.textures.length){
            throw new Error(`texture out of bounds ${textureIndex}`);
        }
        return {
            
            srcWidth,srcHeight,srcX,srcY,textureIndex:textureIndex 
        };
    }
    //creates a texture from a loaded image, stores it in the instance
    static texture(instance:EngineInstance,image:HTMLImageElement,idx:number){
        const res = {
            width:image.width,
            height:image.height,
            texture:EngineGL.glCreateTexture(instance,image)
        };
        instance.textures[idx]=res;
    }

    
}

export {SpriteDescription}