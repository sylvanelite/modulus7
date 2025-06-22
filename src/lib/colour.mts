

///////////////////////////////////////////////////////////////////////////////
import { type IColour } from "./definitions.mjs";
import { EngineMath } from "./engineMath.mjs";

class Colour {
    /** Create a colour with the rgba components passed in, white by default
     *  @param {Number} [r] - red
     *  @param {Number} [g] - green
     *  @param {Number} [b] - blue
     *  @param {Number} [a] - alpha*/
    static rgb(r=1, g=1, b=1, a=1):IColour { 
         return {r, g, b, a};
    }

    /** Returns a random colour between the two passed in colours, combine components if linear *  @param {Colour}   [colourA=(1,1,1,1)] *  @param {Colour}   [colourB=(0,0,0,1)] *  @param {Boolean} [linear]*/
    static randColour(colourA=Colour.rgb(), colourB=Colour.rgb(0,0,0,1), linear=false) {
        return linear ? Colour.lerp(colourA, colourB, EngineMath.rand()) : 
            Colour.rgb(EngineMath.rand(colourA.r,colourB.r), EngineMath.rand(colourA.g,colourB.g), EngineMath.rand(colourA.b,colourB.b), EngineMath.rand(colourA.a,colourB.a));
    }
    /** Sets this colour given a hue, saturation, lightness, and alpha
     * @param {Number} [h] - hue
     * @param {Number} [s] - saturation
     * @param {Number} [l] - lightness
     * @param {Number} [a] - alpha
     * @return {Colour} */
    static hsla(h=0, s=0, l=1, a=1) {
        h = EngineMath.mod(h,1);
        s = EngineMath.clamp(s);
        l = EngineMath.clamp(l);
        const q = l < .5 ? l*(1+s) : l+s-l*s, p = 2*l-q,
            f = (p:number, q:number, t:number)=>
                (t = EngineMath.mod(t,1))*6 < 1 ? p+(q-p)*6*t :
                t*2 < 1 ? q :
                t*3 < 2 ? p+(q-p)*(4-t*6) : p;
        const r = f(p, q, h + 1/3);
        const g = f(p, q, h);
        const b = f(p, q, h - 1/3);
        return {r,g,b,a};
    }
    /** Returns a copy of this colour plus the colour passed in
     * @param {Colour} c - other colour
     * @return {Colour} */
    static add(self:IColour,c:IColour) {
        return Colour.rgb(self.r+c.r, self.g+c.g, self.b+c.b, self.a+c.a);
    }

    /** Returns a copy of this colour minus the colour passed in
     * @param {Colour} c - other colour
     * @return {Colour} */
    static subtract(self:IColour,c:IColour) {
        return Colour.rgb(self.r-c.r, self.g-c.g, self.b-c.b, self.a-c.a);
    }

    /** Returns a copy of this colour scaled by the value passed in, alpha can be scaled separately
     * @param {Number} scale
     * @param {Number} [alphaScale=scale]
     * @return {Colour} */
    static scale(self:IColour,scale:number, alphaScale=scale) 
    { return Colour.rgb(self.r*scale, self.g*scale, self.b*scale, self.a*alphaScale); }

    /** Returns a Colour.rgb() that is p percent between this and the colour passed in
     * @param {Colour}  c - other colour
     * @param {Number} percent
     * @return {Colour} */
    static lerp(self:IColour,c:IColour, percent:number) {
        const diff = Colour.subtract(c,self);
        const scale = Colour.scale(diff,EngineMath.clamp(percent));
        return Colour.add(self,scale);
    }

    
    /** Returns this colour expressed as 32 bit RGBA value
     * @return {Number} */
    static rgbaInt(self:IColour)  
    {
        const r = EngineMath.clamp(self.r)*255|0;
        const g = EngineMath.clamp(self.g)*255<<8;
        const b = EngineMath.clamp(self.b)*255<<16;
        const a = EngineMath.clamp(self.a)*255<<24;
        return r + g + b + a;
    }
}

export {Colour}