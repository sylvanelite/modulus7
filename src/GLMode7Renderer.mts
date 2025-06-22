import { EngineInstance } from "./lib/definitions.mjs";
import { EngineGL } from "./lib/engineGL.mjs";

const mode7VS = `#version 300 es

precision highp float;
in vec4 a_position;
in vec2 a_texcoord;
uniform mat4 u_matrix;
out vec2 uv;
void main() {
    gl_Position = u_matrix * a_position;
    uv = a_texcoord;
}`;
const mode7FS = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 uv;//normalised coordinates of the pixel 0->1
out vec4 out_color;
uniform vec2 in_Resolution;// size of the canvas in pixels
uniform sampler2D in_RenderScene;//floor texture sampler

uniform vec4 in_CameraPos;//position of camera on floor
    //x: x position in pixels
    //y: y position in pixels
    //z: height above floor 
    //w: theta, rotation of camera in degrees

uniform float in_Horizon;//in pixels, where the horizon is drawn

uniform float in_Fov;//camera's field of view in degrees


void main(){
    out_color = vec4(0.0,0.0,0.0,0.0);//default BG colour
    //consts for rendering
    float DEG_TO_RAD = 0.0174533;
    float RAD_TO_DEG = 57.2958;

    float x0 = in_CameraPos.x;//camera location on floor
    float y0 = in_CameraPos.y;//camera location on floor
    float height = in_CameraPos.z;//camera height above floor
    float horizon = in_Horizon;//where the mode7 line start
    float theta = in_CameraPos.w;//camera angle in degrees

    //compute projection from screen X,Y to floor texture X,Y
    float rotation_sin = sin((theta - in_Fov) * DEG_TO_RAD);
    float rotation_cos = cos((theta - in_Fov) * DEG_TO_RAD);
    float screenX = uv.x * in_Resolution.x;
    float screenY = uv.y * in_Resolution.y;
    float projection_z = horizon - screenY;
    float position = in_Resolution.x - screenX;
    float projection_x = x0+ ((position * rotation_cos - screenX * rotation_sin) / projection_z) * height;
    float projection_y = y0+ ((position * rotation_sin + screenX * rotation_cos) / projection_z) * height;
    if(screenY<horizon){
        return;//above horizon, do nothing
    }
    ivec2 floorTex = textureSize(in_RenderScene, 0);
    /*if (!( projection_x > 0.0 && projection_x < float(floorTex.x) && projection_y > 0.0 && projection_y < float(floorTex.y))) {
        return;//sample is out of bounds for the floor texture
    }*/
    vec4 tex=texture(in_RenderScene,vec2(projection_x/float(floorTex.x),projection_y/float(floorTex.y)));
    out_color = vec4(tex.r,tex.g,tex.b,1.0);
}
`;

interface IGLMode7Renderer{
    program:WebGLProgram,
    in_Resolution:WebGLUniformLocation,
    render_width:number,
    render_height:number,
    in_CameraPos:WebGLUniformLocation,
    x0:number,
    y0:number,
    height:number,
    theta:number,
    in_Fov:WebGLUniformLocation,
    fov:number,
    in_Horizon:WebGLUniformLocation,
    horizon:number,
    in_RenderScene:WebGLUniformLocation,
    floorTexture:WebGLTexture,
    positionBuffer:WebGLBuffer,
    texcoordBuffer:WebGLBuffer,
}
class GLMode7Renderer {

    private static _attribIndices:Record<string,number> = {
        //offset by engineGL attributes//TODO: is there a better way?
        'a_position': 8,
        'a_texcoord': 9
    };
    private static _positions = new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]);
    private static _texcoords = new Float32Array([ 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]);
    static glMode7Renderer(gl: WebGLRenderingContext,floorCanvas:OffscreenCanvas):IGLMode7Renderer {
        const program = EngineGL.compileProgram(gl,mode7VS,mode7FS,GLMode7Renderer._attribIndices);
        
        const render_width = gl.canvas.width;
        const render_height = gl.canvas.height;
        const in_Resolution = gl.getUniformLocation(program, "in_Resolution");
        const in_CameraPos = gl.getUniformLocation(program, "in_CameraPos");
        const in_Horizon = gl.getUniformLocation(program, "in_Horizon");
        const in_Fov = gl.getUniformLocation(program, "in_Fov");
        const in_RenderScene = gl.getUniformLocation(program, "in_RenderScene");

        const floorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, floorCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);//gl.CLAMP_TO_EDGE);//gl.REPEAT and change shader to not return; out of bounds
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // Setup the attributes to pull data from our buffers
        const positionBuffer = gl.createBuffer();
        const texcoordBuffer = gl.createBuffer();
        return {
            program,
            in_Resolution,
            render_width,
            render_height,
            in_CameraPos,
            x0:45,
            y0:256,
            height:15,
            theta:90,
            fov:45,
            in_Horizon,
            in_Fov,
            horizon:render_height/2,
            in_RenderScene,
            floorTexture,
            positionBuffer,
            texcoordBuffer,
        }
    }

    static draw(instance:EngineInstance,self:IGLMode7Renderer): void {
        const gl = instance.glContext;
        let {
            program,
            in_Resolution,
            render_width,
            render_height,
            in_CameraPos,
            x0,
            y0,
            height,
            theta,
            in_Fov,
            fov,
            in_Horizon,
            horizon,
            in_RenderScene,
            floorTexture,
            positionBuffer,
            texcoordBuffer,
        }=self;
        gl.useProgram(program);


        const matrix = [2, 0, 0, 0, 0, -2, 0, 0, 0, 0, -1, 0, -1, 1, -0, 1];
        // look up where the vertex data needs to go.
        const positionLocationOutput = GLMode7Renderer._attribIndices["a_position"];
        const texcoordLocationOutput = GLMode7Renderer._attribIndices["a_texcoord"];
        const matrixLocationOutput = gl.getUniformLocation(program, "u_matrix");
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(GLMode7Renderer._positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocationOutput);
        gl.vertexAttribPointer(positionLocationOutput, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(GLMode7Renderer._texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texcoordLocationOutput);
        gl.vertexAttribPointer(texcoordLocationOutput, 2, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(matrixLocationOutput, false, matrix);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(in_RenderScene, 0);//0 needs match the value at the end of:activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        
        gl.uniform2f(in_Resolution, render_width,render_height);
        gl.uniform4f(in_CameraPos,x0,y0,height,theta);
        gl.uniform1f(in_Horizon, horizon);
        gl.uniform1f(in_Fov, fov);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);

    }
    
}



export {
    GLMode7Renderer,type IGLMode7Renderer
}