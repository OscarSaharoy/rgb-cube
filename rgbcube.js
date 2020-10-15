
window.onload = () => {

const cube = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
];

var forward  = vec3.fromValues(1, 0, 0);
var up       = vec3.fromValues(0, 1, 0);
var right    = vec3.fromValues(0, 0, 1);

const vsSource = `

attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying lowp vec4 vColor;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor      = aVertexPosition*0.5 + 0.5;
}

`;

const fsSource = `

varying lowp vec4 vColor;

void main() {
    gl_FragColor = vColor;
}

`;

function loadShader(gl, type, source) {
  
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);
    
    if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
        
        console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function makeShaderProgram(gl, vsSource, fsSource) {
  
    const vertexShader   = loadShader(gl, gl.VERTEX_SHADER,   vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    return shaderProgram;
}

function initgl() {
  
    const w   = window.innerWidth; 
    const h   = window.innerHeight;
    const dpr = window.devicePixelRatio;

    const canvas = document.querySelector("#glCanvas");

    canvas.width  = w * dpr;
    canvas.height = h * dpr;

    const gl = canvas.getContext("webgl");

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    mat4.rotateY(projectionMatrix, projectionMatrix, 3.14159);

    return [canvas, gl];
}

function initBuffers(gl) {
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {position: positionBuffer,
            indices:  indexBuffer   };
}

function drawScene(gl, programInfo, buffers) {

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
       
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3, gl.FLOAT, false, 0, 0);
      
    gl.enableVertexAttribArray( programInfo.attribLocations.vertexPosition );
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    
    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
    
    mat4.mul(viewMatrix, rot, viewMatrix);
    mat4.mul(modelViewMatrix, modelMatrix, viewMatrix);
    
    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
    
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame( () => drawScene(gl, programInfo, buffers) );
}


function downFunc(e, prop) { 
    
    clicked = true;
    prevClientX = prop.clientX;
    prevClientY = prop.clientY;
    mat4.identity(rot);
}

function moveFunc(e, prop) {
    
    if(clicked) {
        e.preventDefault();
        var dx = (prop.clientX - prevClientX)/300;
        var dy = (prop.clientY - prevClientY)/300;
        prevClientX = prop.clientX;
        prevClientY = prop.clientY;
        
        var ds = vec3.fromValues(dx, dy, 0);
        var axis = vec3.create();
        vec3.cross(axis, ds, right);
        
        mat4.fromRotation(rot, -vec3.length(ds), axis);
    }
}

function upFunc(e) {
    clicked = false;
}

const modelMatrix = mat4.create();
mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, 7.0]);
    
const viewMatrix = mat4.create();
mat4.fromRotation(viewMatrix, 3.14159, [0, 1, 0]);
    
const rot = mat4.create();
mat4.fromRotation(rot, 0.02, [-0.3,0.5,0.2]);
    
const modelViewMatrix = mat4.create();
const projectionMatrix = mat4.create();


const [canvas, gl]  = initgl();
const shaderProgram = makeShaderProgram(gl, vsSource, fsSource);
const buffers = initBuffers(gl);

canvas.addEventListener("mousedown", (e) => downFunc(e, e) );
canvas.addEventListener("mousemove", (e) => moveFunc(e, e) );
canvas.addEventListener("mouseup",   upFunc );

canvas.addEventListener("touchstart", (e) => downFunc(e, e.touches[0]) );
canvas.addEventListener("touchmove",  (e) => moveFunc(e, e.touches[0]) );
canvas.addEventListener("touchend",   upFunc );
    
var clicked = false;

var cubeRotationX = 0.0;
var cubeRotationY = 0.0;

var cubeAngvelX = 0.01;
var cubeAngvelY = 0.02;

var prevClientX = 0;
var prevClientY = 0;

const programInfo = {
    
    program: shaderProgram,
    
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor:    gl.getAttribLocation(shaderProgram, 'aVertexColor')
    },
    
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix:  gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
    },
};

drawScene(gl, programInfo, buffers);
    
};