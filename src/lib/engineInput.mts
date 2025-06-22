
/** 
 * LittleJS Input System
 * - Tracks keyboard down, pressed, and released
 * - Tracks mouse buttons, position, and wheel
 * - Tracks multiple analog gamepads
 * - Touch input is handled as mouse input
 * - Virtual gamepad for touch devices
 * @namespace Input
 */

import { ITimer, type EngineInstance, type IVector2 } from "./definitions.mjs";
import { EngineMath } from "./engineMath.mjs";

/**
 * Timer object tracks how long has passed since it was set
 * @example
 * let a = new Timer;    // creates a timer that is not set
 * a.set(3);             // sets the timer to 3 seconds
 *
 * let b = new Timer(1); // creates a timer with 1 second left
 * b.unset();            // unset the timer
 */
class Timer {
    /** Create a timer object set time passed in
     *  @param {Number} [timeLeft] - How much time left before the timer elapses in seconds */
    static timer(instance:EngineInstance,timeLeft:number|undefined):ITimer { 
        return {
            time : timeLeft == undefined ? undefined : instance.time + timeLeft,
            setTime : timeLeft
        } 
    }

    /** Set the timer with seconds passed in
     *  @param {Number} [timeLeft] - How much time left before the timer is elapsed in seconds */
    static set(instance:EngineInstance,self:ITimer,timeLeft=0) { self.time = instance.time + timeLeft; self.setTime = timeLeft; }

    /** Unset the timer */
    static unset(self:ITimer) { self.time = undefined; }

    /** Returns true if set
     * @return {Boolean} */
    static isSet(self:ITimer) { return self.time != undefined; }

    /** Get how long since elapsed, returns 0 if not set (returns negative if currently active)
     * @return {Number} */
    static get(instance:EngineInstance,self:ITimer) { return Timer.isSet(self)? instance.time - self.time : 0; }

}



///////////////////////////////////////////////////////////////////////////////
// Input update called by engine


///////////////////////////////////////////////////////////////////////////////
class EngineInput{

    
    static inputUpdate(instance:EngineInstance) {
        if (instance.headlessMode) return;

        // clear input when lost focus (prevent stuck keys)
        if(!(instance.touchInputEnable && instance.isTouchDevice) && !document.hasFocus()){
            EngineInput.clearInput(instance);
        }
        // update gamepads if enabled
        EngineInput.gamepadsUpdate(instance);
    }

    static inputUpdatePost(instance:EngineInstance) {
        if (instance.headlessMode) return;

        // clear input to prepare for next frame
        for (const deviceInputData of instance.inputData)
        for (const i in deviceInputData){
            deviceInputData[i] &= 1;
        }
        instance.mouseWheel = 0;
    }

    static inputInit(instance:EngineInstance) {
        if (instance.headlessMode) return;

        instance.touchGamepadTimer = Timer.timer(instance,undefined);
        onkeydown = (e:KeyboardEvent)=>
        {
            if (!e.repeat) {
                instance.isUsingGamepad = false;
                instance.inputData[0][e.code as any as number] = 3;
                if (instance.inputWASDEmulateDirection)
                    instance.inputData[0][remapKey(e.code)] = 3;
            }
            instance.preventDefaultInput && e.preventDefault();
        }

        onkeyup = (e)=>
        {
            instance.inputData[0][e.code as any as number] = 4;
            if (instance.inputWASDEmulateDirection)
                instance.inputData[0][remapKey(e.code)] = 4;
        }

        // handle remapping wasd keys to directions
        function remapKey(c:any) {
            return instance.inputWASDEmulateDirection ? 
                c == 'KeyW' ? 'ArrowUp' : 
                c == 'KeyS' ? 'ArrowDown' : 
                c == 'KeyA' ? 'ArrowLeft' : 
                c == 'KeyD' ? 'ArrowRight' : c : c;
        }
        
        // mouse event handlers
        onmousedown   = (e)=>
        {
            // fix stalled audio requiring user interaction
            if (instance.soundEnable && !instance.headlessMode && instance.audioContext && instance.audioContext.state != 'running')
                instance.audioContext.resume();
            
            instance.isUsingGamepad = false; 
            instance.inputData[0][e.button] = 3; 
            instance.mousePos = EngineInput.mouseToScreen(instance,e); 
            e.button && e.preventDefault();
        }
        onmouseup     = (e)=> instance.inputData[0][e.button] = instance.inputData[0][e.button] & 2 | 4;
        onmousemove   = (e)=> instance.mousePos = EngineInput.mouseToScreen(instance,e);
        onwheel       = (e)=> instance.mouseWheel = e.ctrlKey ? 0 : Math.sign(e.deltaY);
        oncontextmenu = (e)=> false; // prevent right click menu
        onblur        = (e) => EngineInput.clearInput(instance); // reset input when focus is lost

        // init touch input
        if (instance.isTouchDevice && instance.touchInputEnable){
            EngineInput.touchInputInit(instance);
        }
    } 

    /** Returns true if device key is down *  @param {String|Number} key *  @param {Number} [device]
     *  @return {Boolean}
     *  @memberof Input */
    static keyIsDown(instance:EngineInstance,key:number, device=0) { 
        return instance.inputData[device] && !!(instance.inputData[device][key] & 1); 
    }

    /** Returns true if device key was pressed this frame *  @param {String|Number} key *  @param {Number} [device]
     *  @return {Boolean}
     *  @memberof Input */
    static keyWasPressed(instance:EngineInstance,key:number, device=0) { 
        return instance.inputData[device] && !!(instance.inputData[device][key] & 2); 
    }

    /** Returns true if device key was released this frame *  @param {String|Number} key *  @param {Number} [device]
     *  @return {Boolean}
     *  @memberof Input */
    static keyWasReleased(instance:EngineInstance,key:number, device=0) { 
        return instance.inputData[device] && !!(instance.inputData[device][key] & 4);
    }

    /** Clears all input
     *  @memberof Input */
    static clearInput(instance:EngineInstance) { instance.inputData = [[]]; instance.touchGamepadButtons = []; }

    /** Returns true if gamepad button is down *  @param {Number} button *  @param {Number} [gamepad]
     *  @return {Boolean}
     *  @memberof Input */
    static gamepadIsDown(instance:EngineInstance,button:number, gamepad=0) { return EngineInput.keyIsDown(instance,button, gamepad+1); }

    /** Returns true if gamepad button was pressed *  @param {Number} button *  @param {Number} [gamepad]
     *  @return {Boolean}
     *  @memberof Input */
    static gamepadWasPressed(instance:EngineInstance,button:number, gamepad=0) { return EngineInput.keyWasPressed(instance,button, gamepad+1); }

    /** Returns true if gamepad button was released *  @param {Number} button *  @param {Number} [gamepad]
     *  @return {Boolean}
     *  @memberof Input */
    static gamepadWasReleased(instance:EngineInstance,button:number, gamepad=0) { return EngineInput.keyWasReleased(instance,button, gamepad+1); }

    /** Returns gamepad stick value *  @param {Number} stick *  @param {Number} [gamepad]
     *  @return {Vector2}
     *  @memberof Input */
    static gamepadStick(instance:EngineInstance,stick:number,  gamepad=0) { return instance.gamepadStickData[gamepad] ? instance.gamepadStickData[gamepad][stick] || EngineMath.vec2() : EngineMath.vec2(); }

    // convert a mouse or touch event position to screen space
    static mouseToScreen(instance:EngineInstance,mousePos:MouseEvent|IVector2) {
        if (!instance.domCanvas || instance.headlessMode)
            return EngineMath.vec2(); // fix bug that can occur if user clicks before page loads

        const rect = instance.domCanvas.getBoundingClientRect();
        return EngineMath.multiply(EngineMath.vec2(instance.domCanvas.width, instance.domCanvas.height),
            EngineMath.vec2(EngineMath.percent(mousePos.x, rect.left, rect.right), EngineMath.percent(mousePos.y, rect.top, rect.bottom)));
    }
    static isMouseOver(instance:EngineInstance,rect:{x:number,y:number,w:number,h:number}){
        const ipt = instance.mousePos;
		return (rect.x <= ipt.x && ipt.x <= rect.x + rect.w &&
				rect.y <= ipt.y && ipt.y <= rect.y + rect.h);
    }

    // gamepads are updated by engine every frame automatically
    static gamepadsUpdate(instance:EngineInstance) {
        const applyDeadZones = (v:IVector2)=>
        {
            const min=.3, max=.8;
            const deadZone = (v:number)=> 
                v >  min ?  EngineMath.percent( v, min, max) : 
                v < -min ? -EngineMath.percent(-v, min, max) : 0;
            return EngineMath.clampLength(EngineMath.vec2(deadZone(v.x), deadZone(-v.y)));
        }

        // update touch gamepad if enabled
        if (instance.touchGamepadEnable && instance.isTouchDevice) {
            if (Timer.isSet(instance.touchGamepadTimer)) {
                // read virtual analog stick
                const sticks = instance.gamepadStickData[0] || (instance.gamepadStickData[0] = []);
                sticks[0] = EngineMath.vec2();
                if (instance.touchGamepadAnalog){
                    sticks[0] = applyDeadZones(instance.touchGamepadStick);
                }else if (EngineMath.lengthSquared(instance.touchGamepadStick) > .3) {
                    // convert to 8 way dpad
                    sticks[0].x = Math.round(instance.touchGamepadStick.x);
                    sticks[0].y = -Math.round(instance.touchGamepadStick.y);
                    sticks[0] = sticks[0].clampLength();
                }

                // read virtual gamepad buttons
                const data = instance.inputData[1] || (instance.inputData[1] = []);
                for (let i=10; i--;) {
                    const j = i == 3 ? 2 : i == 2 ? 3 : i; // fix button locations
                    const wasDown = EngineInput.gamepadIsDown(instance,j,0);
                    data[j] = instance.touchGamepadButtons[i] ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
                }
            }
        }

        // return if gamepads are disabled or not supported
        if (!instance.gamepadsEnable || !navigator || !navigator.getGamepads)
            return;

        // only poll gamepads when focused 
        if (!document.hasFocus())
            return;

        // poll gamepads
        const gamepads = navigator.getGamepads();
        for (let i = gamepads.length; i--;) {
            // get or create gamepad data
            const gamepad = gamepads[i];
            const data = instance.inputData[i+1] || (instance.inputData[i+1] = []);
            const sticks = instance.gamepadStickData[i] || (instance.gamepadStickData[i] = []);

            if (gamepad) {
                // read analog sticks
                for (let j = 0; j < gamepad.axes.length-1; j+=2)
                    sticks[j>>1] = applyDeadZones(EngineMath.vec2(gamepad.axes[j],gamepad.axes[j+1]));
                
                // read buttons
                for (let j = gamepad.buttons.length; j--;) {
                    const button = gamepad.buttons[j];
                    const wasDown = EngineInput.gamepadIsDown(instance,j,i);
                    data[j] = button.pressed ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
                    instance.isUsingGamepad ||= !i && button.pressed;
                }

                if (instance.gamepadDirectionEmulateStick) {
                    // copy dpad to left analog stick when pressed
                    const dpad = EngineMath.vec2(
                        (EngineInput.gamepadIsDown(instance,15,i)&&1) - (EngineInput.gamepadIsDown(instance,14,i)&&1), 
                        (EngineInput.gamepadIsDown(instance,12,i)&&1) - (EngineInput.gamepadIsDown(instance,13,i)&&1));
                    if (EngineMath.lengthSquared(dpad))
                        sticks[0] = EngineMath.clampLength(dpad);
                }

                // disable touch gamepad if using real gamepad
                instance.touchGamepadEnable && instance.isUsingGamepad && Timer.unset(instance.touchGamepadTimer); 
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////

    /** Pulse the vibration hardware if it exists *  @param {Number|Array} [pattern] - single value in ms or vibration interval array
     *  @memberof Input */
    static vibrate(instance:EngineInstance,pattern=100) { instance.vibrateEnable && !instance.headlessMode && navigator && navigator.vibrate && navigator.vibrate(pattern); }

    /** Cancel any ongoing vibration
     *  @memberof Input */
    static vibrateStop(instance:EngineInstance) { EngineInput.vibrate(instance,0); }

    ///////////////////////////////////////////////////////////////////////////////
    // Touch input & virtual on screen gamepad

    // enable touch input mouse passthrough
    static touchInputInit(instance:EngineInstance) {
        // add non passive touch event listeners
        let handleTouch = handleTouchDefault;
        if (instance.touchGamepadEnable) {
            // touch input internal variables
            handleTouch = handleTouchGamepad;
            instance.touchGamepadButtons = [];
            instance.touchGamepadStick = EngineMath.vec2();
        }
        document.addEventListener('touchstart', (e) => handleTouch(e), { passive: false });
        document.addEventListener('touchmove',  (e) => handleTouch(e), { passive: false });
        document.addEventListener('touchend',   (e) => handleTouch(e), { passive: false });

        // override mouse events
        onmousedown = onmouseup = ()=> 0;

        // handle all touch events the same way
        let wasTouching = 0;
        function handleTouchDefault(e:TouchEvent) {
            // fix stalled audio requiring user interaction
            if (instance.soundEnable && !instance.headlessMode && instance.audioContext && instance.audioContext.state != 'running')
                instance.audioContext.resume();

            // check if touching and pass to mouse events
            const touching = e.touches.length;
            const button = 0; // all touches are left mouse button
            if (touching) {
                // set event pos and pass it along
                const p = EngineMath.vec2(e.touches[0].clientX, e.touches[0].clientY);
                instance.mousePos = EngineInput.mouseToScreen(instance,p);
                wasTouching ? instance.isUsingGamepad = instance.touchGamepadEnable : instance.inputData[0][button] = 3;
            } else if (wasTouching){
                instance.inputData[0][button] = instance.inputData[0][button] & 2 | 4;
            }
            // set was touching
            wasTouching = touching;

            // prevent default handling like copy and magnifier lens
            if (document.hasFocus()) // allow document to get focus
                e.preventDefault();
            
            // must return true so the document will get focus
            return true;
        }

        // special handling for virtual gamepad mode
        function handleTouchGamepad(e:TouchEvent) {
            // clear touch gamepad input
            instance.touchGamepadStick = EngineMath.vec2();
            instance.touchGamepadButtons = [];
            instance.isUsingGamepad = true;
                
            const touching = e.touches.length;
            if (touching) {
                Timer.set(instance,instance.touchGamepadTimer);
            }

            // get center of left and right sides
            const stickCenter = EngineMath.vec2(instance.touchGamepadSize, instance.domCanvas.height-instance.touchGamepadSize);
            const domSize = EngineMath.vec2(instance.domCanvas.width,instance.domCanvas.height);
            const buttonCenter = EngineMath.subtract(domSize,
                EngineMath.vec2(instance.touchGamepadSize, instance.touchGamepadSize));
            const startCenter = EngineMath.scale(domSize,.5);

            // check each touch point
            for (const touch of e.touches) {
                const touchPos = EngineInput.mouseToScreen(instance,EngineMath.vec2(touch.clientX, touch.clientY));
                if (EngineMath.distance(touchPos,stickCenter) < instance.touchGamepadSize) {
                    // virtual analog stick
                    instance.touchGamepadStick = EngineMath.clampLength(EngineMath.scale(EngineMath.subtract(touchPos,stickCenter),2/instance.touchGamepadSize));
                } else if (EngineMath.distance(touchPos,buttonCenter) < instance.touchGamepadSize) {
                    // virtual face buttons
                    const button = EngineMath.direction(EngineMath.subtract(touchPos,buttonCenter));
                    instance.touchGamepadButtons[button] = 1;
                } else if (EngineMath.distance(touchPos,startCenter) < instance.touchGamepadSize && !wasTouching) {
                    // virtual start button in center
                    instance.touchGamepadButtons[9] = 1;
                }
            }

            // call default touch handler so normal touch events still work
            handleTouchDefault(e);
            
            // must return true so the document will get focus
            return true;
        }
    }

    // render the touch gamepad, called automatically by the engine
    static touchGamepadRender(instance:EngineInstance) {
        if (!instance.touchInputEnable || !instance.isTouchDevice || instance.headlessMode){ return; }
        if (!instance.touchGamepadEnable ){ return; }
        // fade off when not touching
        const alpha = EngineMath.percent(Timer.get(instance,instance.touchGamepadTimer), 4, 3);
        if (!alpha) {return;}

        // setup the canvas
        const context = instance.context2d;
        context.save();
        context.globalAlpha = alpha*instance.touchGamepadAlpha;
        context.strokeStyle = '#fff';
        context.lineWidth = 3;

        // draw left analog stick
        context.fillStyle = EngineMath.lengthSquared(instance.touchGamepadStick) > 0 ? '#fff' : '#000';
        context.beginPath();

        const leftCenter = EngineMath.vec2(instance.touchGamepadSize, instance.domCanvas.height-instance.touchGamepadSize);
        if (instance.touchGamepadAnalog) // draw circle shaped gamepad
        {
            context.arc(leftCenter.x, leftCenter.y, instance.touchGamepadSize/2, 0, 9);
            context.fill();
            context.stroke();
        } else {// draw cross shaped gamepad
            for(let i=10; i--;) {
                const angle = i*Math.PI/4;
                context.arc(leftCenter.x, leftCenter.y,instance.touchGamepadSize*.6, angle + Math.PI/8, angle + Math.PI/8);
                i%2 && context.arc(leftCenter.x, leftCenter.y, instance.touchGamepadSize*.33, angle, angle);
                i==1 && context.fill();
            }
            context.stroke();
        }
        
        // draw right face buttons
        const rightCenter = EngineMath.vec2(instance.domCanvas.width-instance.touchGamepadSize, instance.domCanvas.height-instance.touchGamepadSize);
        for (let i=4; i--;) {
            const pos = EngineMath.add(rightCenter,EngineMath.setDirection(i, instance.touchGamepadSize/2));
            context.fillStyle = instance.touchGamepadButtons[i] ? '#fff' : '#000';
            context.beginPath();
            context.arc(pos.x, pos.y, instance.touchGamepadSize/4, 0,9);
            context.fill();
            context.stroke();
        }

        // set canvas back to normal
        context.restore();
    }
}

export {
    EngineInput
}