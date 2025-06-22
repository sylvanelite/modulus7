import { IGLMode7Renderer } from "../GLMode7Renderer.mjs";
import { EngineInstance, IGLSpriteRenderer, ISpriteDescription } from "../lib/definitions.mjs";
import { GLSpriteRenderer } from "../lib/GLSpriteRenderer.mjs";
import { Colour, EngineMath, World } from "../lib/index.mjs";

//TODO: instance this...
interface ICloud{
    parallax:number,//width of parallax area to scroll, should be bigger than screen size.
    x:number,//x offset from parallax position  
    y:number//position from top of screen
}
interface IBackground {
    moonBigparallax:number;
    moonBigY:number;
    moonSmallparallax:number;
    moonSmallY:number;
    clouds:Array<ICloud>;
}
class Background{
    static background():IBackground{
        const res={
            moonBigparallax:400,
            moonBigY:25,
            moonSmallparallax:500,
            moonSmallY:20,
            clouds:[
                {parallax:400,y:10,x:100},
                {parallax:500,y:20,x:200},
                {parallax:600,y:30,x:300},
                {parallax:700,y:0,x:400},
            ]
        }
        //sort by depth
        res.clouds.sort((a,b)=>a.x-b.x);
        return res;
    }
    
    static draw(instance:EngineInstance,mode7:IGLMode7Renderer,spriteLayer:IGLSpriteRenderer,angle:number,background:IBackground,
        gradient:ISpriteDescription,moon:ISpriteDescription,
        cloudA:ISpriteDescription,cloudB:ISpriteDescription
    ) {
        GLSpriteRenderer.beginFrame(instance,spriteLayer);
        const parallaxMargin = 64;//how far offscreen do the parallax sprites wrap from
        //draw moons
        const bigMoonPx = ((1-angle/360)*background.moonBigparallax+100) % background.moonBigparallax;
        const bigMoonPos = EngineMath.vec2(bigMoonPx-parallaxMargin,mode7.horizon-background.moonBigY);
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,moon,
            bigMoonPos.x,bigMoonPos.y,
            1,1,0,
            Colour.rgbaInt(Colour.rgb(1,1,1,1)));
        const smallMoonPx = ((1-angle/360)*background.moonSmallparallax+100) % background.moonSmallparallax;
        const smallMoonPos = EngineMath.vec2(smallMoonPx-parallaxMargin,mode7.horizon-background.moonSmallY);
        GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,moon,
            smallMoonPos.x,smallMoonPos.y,
            0.7,0.7,0,
            Colour.rgbaInt(Colour.rgb(1,1,1,1)));

        for(const c of background.clouds){
            const scroll = 1-angle/360;//convert angle to percent
            const px = (scroll*c.parallax+c.x) % c.parallax;//add offset (modulo parallax size)

            const pos = EngineMath.vec2(px-parallaxMargin,mode7.horizon-c.y);
            GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,cloudA,
                pos.x,pos.y,
                1,1,0,
                Colour.rgbaInt(Colour.rgb(1,1,1,1)));

        }
        const pos = EngineMath.vec2(-64,mode7.horizon+4);
        //horizon fog
         GLSpriteRenderer.addSpriteToDrawList(instance,spriteLayer,gradient,
                pos.x,pos.y,
                512,1,0,
                Colour.rgbaInt(Colour.rgb(1,1,1,1)));

        
        GLSpriteRenderer.glFlush(instance,spriteLayer);
    }
}

export{Background,type IBackground}
