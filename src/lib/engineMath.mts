import { type EngineInstance, type IVector2 } from "./definitions.mjs";


class EngineMath{
    
    /** Returns first parm modulo the second param, but adjusted so negative numbers work as expected */
    static mod(dividend:number, divisor=1) { return ((dividend % divisor) + divisor) % divisor; }

    /** Clamps the value between max and min */
    static clamp(value:number, min=0, max=1) { return value < min ? min : value > max ? max : value; }

    /** Returns what percentage the value is between valueA and valueB */
    static percent(value:number, valueA:number, valueB:number) { return (valueB-=valueA) ? EngineMath.clamp((value-valueA)/valueB) : 0; }

    ///////////////////////////////////////////////////////////////////////////////

    /** Returns a random value between the two values passed in *  @param {Number} [valueA] *  @param {Number} [valueB] */
    static rand(valueA=1, valueB=0) { return valueB + Math.random() * (valueA-valueB); }

    ///////////////////////////////////////////////////////////////////////////////
    
    static vec2(x:number|IVector2=0, y:number=undefined):IVector2 {
        if(typeof x == 'number' ){
            return {x,y:y == undefined? x : y}
        }
        return {x:x.x, y:x.y};
    }


    /** Returns a copy of this vector plus the vector passed in*/
    static add(a:IVector2,b:IVector2) {
        return EngineMath.vec2(a.x + b.x, a.y + b.y);
    }

    /** Returns a copy of this vector minus the vector passed in */
    static subtract(a:IVector2,b:IVector2) {
        return EngineMath.vec2(a.x - b.x, a.y - b.y);
    }

    /** Returns a copy of this vector times the vector passed in */
    static multiply(a:IVector2,b:IVector2) {
        return EngineMath.vec2(a.x * b.x, a.y * b.y);
    }

    /** Returns a copy of this vector divided by the vector passed in*/
    static divide(a:IVector2,b:IVector2) {
        return EngineMath.vec2(a.x / b.x, a.y / b.y);
    }

    /** Returns a copy of this vector scaled by the vector passed in*/
    static scale(v:IVector2,s:number) {
        return EngineMath.vec2(v.x * s, v.y * s);
    }

    /** Returns the length of this vector*/
    static length(v:IVector2) { return EngineMath.lengthSquared(v)**.5; }

    /** Returns the length of this vector squared*/
    static lengthSquared(v:IVector2) { return v.x**2 + v.y**2; }

    /** Returns the distance from this vector to vector passed in */
    static distance(a:IVector2,b:IVector2)  {
        return EngineMath.distanceSquared(a,b)**.5;
    }

    /** Returns the distance squared from this vector to vector passed in*/
    static distanceSquared(a:IVector2,b:IVector2) {
        return (a.x - b.x)**2 + (a.y - b.y)**2;
    }

    /** Returns a new vector clamped to length passed in*/
    static clampLength(v:IVector2,length=1) {
        const l = EngineMath.length(v);
        return l > length ? EngineMath.scale(v, length/l) : v;
    }

    /** Set the integer direction of this vector, corresponding to multiples of 90 degree rotation (0-3) */
    static setDirection(direction:number, length=1) {
        direction = EngineMath.mod(direction, 4);
        return EngineMath.vec2(direction%2 ? direction-1 ? -length : length : 0, 
            direction%2 ? 0 : direction ? -length : length);
    }

    /** Returns the integer direction of this vector, corresponding to multiples of 90 degree rotation (0-3) */
    static direction(v:IVector2) { return Math.abs(v.x) > Math.abs(v.y) ? v.x < 0 ? 3 : 1 : v.y < 0 ? 2 : 0; }

}




export {EngineMath}