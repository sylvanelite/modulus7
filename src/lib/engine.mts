import { type EngineInstance } from "./definitions.mjs";
import { EngineGL } from "./engineGL.mjs";
import { SpriteDescription } from "./spriteDefinition.mjs";
import { EngineInput } from "./engineInput.mjs";
import { EngineMath } from "./engineMath.mjs";
import { EngineSound } from "./engineSound.mjs";
import { World } from "./ecs.mjs";

//returns an object holding all the engine's information
function createInstance():EngineInstance{
    const res:EngineInstance= {
            sprites:{},
            audio:{},
            world:new World(),
        //},Settings:{
            //camera settings
            canvasMaxSize:EngineMath.vec2(1920, 1080),//The max size of the canvas, centered if window is larger
            canvasFixedSize:EngineMath.vec2(0,0), //Fixed size of the canvas, if enabled canvas size never changes
                                    // - you may also need to set mainCanvasSize if using screen space coords in startup
            headlessMode:false,//Disables all rendering, audio, and input for servers
            //Tile sheet settings
            tileFixBleedScale:0,//How many pixels smaller to draw tiles to prevent bleeding from neighbors
           //Input settings
            gamepadsEnable:true,/** Should gamepads be allowed */
            gamepadDirectionEmulateStick:true,/** If true, the dpad input is also routed to the left analog stick (for better accessability) */
            inputWASDEmulateDirection :true,/** If true the WASD keys are also routed to the direction keys (for better accessability)*/
            touchInputEnable:true, /** True if touch input is enabled for mobile devices
                                        *  - Touch events will be routed to mouse events*/
            touchGamepadEnable :true, /** True if touch gamepad should appear on mobile devices
                                        *  - Supports left analog stick, 4 face buttons and start button (button 9)
                                        *  - Must be set by end of gameInit to be activated*/
            touchGamepadAnalog :true,/** True if touch gamepad should be analog stick or false to use if 8 way dpad */
            touchGamepadSize :99,/** Size of virtual gamepad for touch devices in pixels */
            touchGamepadAlpha :0.3,/** Transparency of touch gamepad overlay */
            vibrateEnable :true,/** Allow vibration hardware if it exists */
            inputData:[[]],
            isTouchDevice: window.ontouchstart !== undefined,//True if a touch device has been detected
            touchGamepadTimer:undefined,// touch gamepad internal variables
            touchGamepadButtons:[],
            touchGamepadStick:EngineMath.vec2(),
            mousePos:EngineMath.vec2(),
            mouseWheel:0,
            isUsingGamepad:false,
            preventDefaultInput:false,
            
            //Audio settings
            soundEnable:true,//All audio code can be disabled and removed from build
            soundVolume:0.3,//Volume scale to apply to all sound, music and speech
            soundDefaultRange:40,// Default range where sound no longer plays
            soundDefaultTaper:0.7,//Default range percent to start tapering off sound (0-1)
            audioContext:new AudioContext(),
            audioGainNode:undefined,
        //},Engine:{
            engineName:'LittleJS-fork',//Name of engine
            engineVersion: '1.11.4--fork',//Version of engine
            maxSkippedFrames:20,//how many frames can be run after a skip (e.g. if animation frame is in a background tab)
            frameRate:60,//Frames per second to update
            frame:0,//Current update frame, used to calculate time
            time:0,//Current engine time since start in seconds
            timeReal:0,// //Actual clock time since start in seconds 
            //}
            domCanvas:undefined,//The primary 2D canvas visible to the user
            context2d:undefined,//2d context for mainCanvas
            textures:[],//Array containing texture info for batch rendering system
            drawCount:0,//Keep track of how many draw calls there were each frame for debugging
            //Gamepad
            gamepadStickData :[],// gamepad internal variables
            //WebGL
            glContext:undefined,// 2d context for glCanvas
            glAntialias:true,//Should webgl be setup with anti-aliasing? must be set before calling engineInit
            glActiveTexture:undefined,
            
            // Frame time tracking
            frameTimeLastMS:0,
            frameTimeBufferMS:0,
    };
    return res;
}


///////////////////////////////////////////////////////////////////////////////

class Engine{

    ///////////////////////////////////////////////////////////////////////////////
    // Main engine functions
    static engineInit(instance:EngineInstance,
        gameInit:Function, 
        gameUpdate:Function,
        gameUpdatePost:Function,
        gameRender:Function,
        gameRenderPost:Function,
        imageSources:Array<string>=[],
        audioSources:Array<string>=[],
        rootElement=document.body) {
            
        // internal update loop for engine
        function engineUpdate(frameTimeMS=0) {
            // update time keeping
            const frameTimeDeltaMS = frameTimeMS - instance.frameTimeLastMS;
            instance.frameTimeLastMS = frameTimeMS;
            instance.timeReal += frameTimeDeltaMS / 1e3;
            instance.frameTimeBufferMS += frameTimeDeltaMS;

            // apply time delta smoothing, improves smoothness of framerate in some browsers
            let deltaSmooth = 0;
            if (instance.frameTimeBufferMS < 0 && instance.frameTimeBufferMS > -9) {
                // force at least one update each frame since it is waiting for refresh
                deltaSmooth = instance.frameTimeBufferMS;
                instance.frameTimeBufferMS = 0;
            }
            let skip =0;
            // update multiple frames if necessary in case of slow framerate
            for (;instance.frameTimeBufferMS >= 0; instance.frameTimeBufferMS -= 1e3 / instance.frameRate) {
                // increment frame and update time
                instance.time = instance.frame++ / instance.frameRate;

                // update game and objects
                EngineInput.inputUpdate(instance);
                gameUpdate(instance);

                // do post update
                gameUpdatePost(instance);
                EngineInput.inputUpdatePost(instance);
                skip+=1;
                if(skip>instance.maxSkippedFrames){
                    //too many frames need to updated, drop the rest of the updates and wait for next animation frame
                    instance.frameTimeBufferMS=0;
                    break;
                }
            }

            // add the time smoothing back in
            instance.frameTimeBufferMS += deltaSmooth;
            

            if (!instance.headlessMode) {
                instance.context2d.clearRect(0,0,instance.context2d.canvas.width, instance.context2d.canvas.height);
                EngineGL.glClearCanvas(instance);
                gameRender(instance);
                gameRenderPost(instance);
                
                instance.context2d.drawImage(instance.glContext.canvas, 0, 0);
                EngineInput.touchGamepadRender(instance);

                const ctx = instance.domCanvas.getContext('2d');
                ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
                ctx.drawImage(instance.context2d.canvas, 0, 0);
            }

            requestAnimationFrame(engineUpdate);
        }

        
        function startEngine(instance:EngineInstance) {
            gameInit(instance).then(engineUpdate);
        }

        if (instance.headlessMode) {
            startEngine(instance);
            return;
        }
        //2d canvas, for overlays
        instance.context2d = new OffscreenCanvas(instance.domCanvas.width,instance.domCanvas.height).getContext('2d');
        instance.context2d.imageSmoothingEnabled = true;

        //GL canvas, for sprites and objects
        instance.glContext = new OffscreenCanvas(instance.domCanvas.width,instance.domCanvas.height).getContext('webgl2', {antialias:instance.glAntialias});
        // init stuff and start engine
        EngineInput.inputInit(instance);
        EngineSound.audioInit(instance);
        
        // create promises for loading images
        const promises = imageSources.map((src, textureIndex)=>
            new Promise(resolve => 
            {
                const image = new Image;
                image.crossOrigin = 'anonymous';
                image.onerror = image.onload = ()=> 
                {
                    SpriteDescription.texture(instance,image,textureIndex);//create texture and add to the instance
                    resolve(instance);
                }
                image.src = src;
            })
        );

        for(const s of audioSources){
            promises.push(fetch(s)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => instance.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    const sound = EngineSound.sound(instance,undefined);
                    sound.sampleChannels = [];
                    for (let i = audioBuffer.numberOfChannels; i--;){
                        sound.sampleChannels[i] = Array.from(audioBuffer.getChannelData(i));
                    }
                    sound.sampleRate = audioBuffer.sampleRate;
                    instance.audio[s]=sound;
                })
            );
        }
        // load all of the images
        Promise.all(promises).then(()=>{
            
            
            //init canvases
            //dom canvas, apply styles and resize
            const styleRoot = 
                'margin:0;overflow:hidden;' + // fill the window
                'width:100vw;height:100vh;' + // fill the window
                'display:flex;' +             // use flexbox
                'align-items:center;' +       // horizontal center
                'justify-content:center;' +   // vertical center
                'background:#000;' +          // set background colour
                'image-rendering:pixelated;'+ // pixel art
                'user-select:none;' +         // prevent hold to select
                '-webkit-user-select:none;' + // compatibility for ios
                (!instance.touchInputEnable ? '' :     // no touch css settings
                'touch-action:none;' +        // prevent mobile pinch to resize
                '-webkit-touch-callout:none');// compatibility for ios
            rootElement.style.cssText = styleRoot;
            if(!instance.domCanvas){
                rootElement.appendChild(instance.domCanvas = document.createElement('canvas'));
            }
            if (instance.canvasFixedSize.x) {
                instance.domCanvas.width  = instance.canvasFixedSize.x;
                instance.domCanvas.height = instance.canvasFixedSize.y;
                
                // fit to window by adding space on top or bottom if necessary
                const aspect = innerWidth / innerHeight;
                const fixedAspect = instance.domCanvas.width / instance.domCanvas.height;
                (instance.domCanvas).style.width = instance.domCanvas.style.width = aspect < fixedAspect ? '100%' : '';
                (instance.domCanvas).style.height = instance.domCanvas.style.height = aspect < fixedAspect ? '' : '100%';
            } else {
                instance.domCanvas.width  = Math.min(innerWidth,  instance.canvasMaxSize.x);
                instance.domCanvas.height = Math.min(innerHeight, instance.canvasMaxSize.y);
            }
            startEngine(instance)});
    }

    
}

export {
    createInstance,
	// Engine
    Engine,

};

