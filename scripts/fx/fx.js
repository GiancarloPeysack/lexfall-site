// Homepage effects, after three open-source repos (credits in /fx/NOTICE.txt). Build: node scripts/fx/build.mjs
// 1. Hero word card: liquid glass refraction, ported from dashersw/liquid-glass-js (MIT). The card refracts the
//    hero illustration behind it (the library snapshots the page with html2canvas; here the only thing behind the
//    card is that image, so it samples the image directly, works in Safari too, and renders once per resize).
// 2. Download panel: a moving gradient band, ported from ruucm/shadergradient's plane shader (MIT, no React/three).
// 3. Download panel: the Lexfall leaf in liquid metal, the effect behind paper-design/liquid-logo, rendered with
//    @paper-design/shaders (Apache-2.0), loaded only when the panel nears the screen.
// Every effect is progressive: without WebGL or with reduced motion the page keeps its current look.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dark = () => matchMedia('(prefers-color-scheme: dark)').matches;

function gl2d(canvas) {
  const o = { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false };
  return canvas.getContext('webgl', o) || null;
}

function program(gl, frag) {
  const vs = 'attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p);
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(p, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  return { p, u: (n) => (u[n] ??= gl.getUniformLocation(p, n)) };
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/* ------------------------------------------------------------------ 1. liquid glass word card */
const GLASS_FRAG = `precision mediump float;
varying vec2 uv;
uniform sampler2D img;
uniform vec2 size;      // card px
uniform float radius;   // card corner px
uniform vec4 imgRect;   // image x,y,w,h in card px (y down)
uniform float imgRadius;
uniform vec3 bg, tint;
uniform float tintAmt, dim;
float rr(vec2 p, vec2 c, vec2 h, float r){ vec2 q=abs(p-c)-(h-r); return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
vec3 back(vec2 p){ // what sits behind the card at card pixel p
  vec2 t=(p-imgRect.xy)/imgRect.zw;
  float inside=1.-smoothstep(-1.,1.,rr(p,imgRect.xy+imgRect.zw*.5,imgRect.zw*.5,imgRadius));
  vec3 c=texture2D(img,clamp(t,0.,1.)).rgb*dim;
  return mix(bg,c,inside);
}
void main(){
  vec2 p=vec2(uv.x,1.-uv.y)*size;
  float d=max(-rr(p,size*.5,size*.5,radius),0.);
  vec2 n=normalize(p-size*.5+1e-4);
  // liquid-glass-js: base + edge + rim intensities along the shape normal, corner boost, ripple at the rim
  float base=(1.-exp(-d*.1))*.01, edge=exp(-d*.15)*.01, rim=exp(-d*.8)*.05;
  vec2 cd=min(p,size-p); float corner=exp(-max(cd.x,cd.y)*.3)*.02;
  vec2 refr=n*(base+edge+rim+corner)+vec2(-n.y,n.x)*sin(d/min(size.x,size.y)*25.)*.1*exp(-d*.8);
  vec2 off=-refr*900.;
  // gaussian blur (as the library does), with a slight red/blue split at the rim
  vec3 col=vec3(0.); float tw=0.;
  for(float i=-3.;i<=3.;i+=1.){ for(float j=-3.;j<=3.;j+=1.){
    float r2=i*i+j*j; if(r2>9.5) continue; float w=exp(-r2/4.5);
    vec2 o=vec2(i,j)*5.;
    col+=w*vec3(back(p+off*1.1+o).r,back(p+off+o).g,back(p+off*.9+o).b); tw+=w; } }
  col/=tw;
  col=mix(col,tint,tintAmt);
  col+=vec3(1.)*exp(-d*.35)*.18*smoothstep(.2,1.,1.-uv.y+.3*(1.-uv.x)); // top-left specular rim
  gl_FragColor=vec4(col,1.);
}`;

function liquidCard() {
  const card = document.querySelector('.ed-hero .wordcard.glass');
  const art = document.querySelector('.ed-hero-art');
  const img = art && art.querySelector('.pn-plate img');
  if (!card || !img) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'lg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = gl2d(canvas);
  if (!gl) return;
  let prog;
  try { prog = program(gl, GLASS_FRAG); } catch (e) { return; }
  const tex = gl.createTexture();
  const load = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // a small copy of the art: bilinear sampling of it is already a soft blur, so the kernel stays cheap and smooth
    let src = img, w = img.naturalWidth, h = img.naturalHeight;
    while (w > 96) {
      w = Math.max(48, w >> 1); h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(src, 0, 0, w, h); src = c;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  };
  const draw = () => {
    const c = card.getBoundingClientRect(), i = img.getBoundingClientRect();
    if (!c.width || !i.width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(c.width * dpr); canvas.height = Math.round(c.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const cs = getComputedStyle(document.documentElement);
    const isDark = dark();
    gl.uniform2f(prog.u('size'), c.width, c.height);
    gl.uniform1f(prog.u('radius'), parseFloat(getComputedStyle(card).borderTopLeftRadius) || 24);
    gl.uniform4f(prog.u('imgRect'), i.left - c.left, i.top - c.top, i.width, i.height);
    gl.uniform1f(prog.u('imgRadius'), parseFloat(getComputedStyle(img).borderTopLeftRadius) || 0);
    gl.uniform3fv(prog.u('bg'), hex(cs.getPropertyValue('--bg').trim() || (isDark ? '#100E0B' : '#F4F0E8')));
    gl.uniform3fv(prog.u('tint'), hex(cs.getPropertyValue('--surface').trim() || '#FBF8F1'));
    gl.uniform1f(prog.u('tintAmt'), isDark ? 0.62 : 0.58);
    gl.uniform1f(prog.u('dim'), isDark ? 0.86 : 1);
    gl.uniform1i(prog.u('img'), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const start = () => {
    try { load(); } catch (e) { return; }
    card.prepend(canvas);
    card.classList.add('lg-on');
    draw();
    let raf = 0;
    const again = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
    new ResizeObserver(again).observe(card);
    new ResizeObserver(again).observe(art);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', again);
  };
  (img.complete && img.naturalWidth ? Promise.resolve() : img.decode()).then(start, () => {});
}

/* ------------------------------------------------------------------ 2. shader gradient band */
// cnoise: classic 3D Perlin noise exactly as shadergradient ships it (from hughsk/glsl-noise, MIT)
const CNOISE = `vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
vec3 fade(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}
float cnoise(vec3 P){
  vec3 Pi0=floor(P),Pi1=Pi0+vec3(1.);Pi0=mod289(Pi0);Pi1=mod289(Pi1);
  vec3 Pf0=fract(P),Pf1=Pf0-vec3(1.);
  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x),iy=vec4(Pi0.yy,Pi1.yy),iz0=Pi0.zzzz,iz1=Pi1.zzzz;
  vec4 ixy=permute(permute(ix)+iy),ixy0=permute(ixy+iz0),ixy1=permute(ixy+iz1);
  vec4 gx0=ixy0*(1./7.),gy0=fract(floor(gx0)*(1./7.))-.5;gx0=fract(gx0);
  vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0),sz0=step(gz0,vec4(0.));gx0-=sz0*(step(0.,gx0)-.5);gy0-=sz0*(step(0.,gy0)-.5);
  vec4 gx1=ixy1*(1./7.),gy1=fract(floor(gx1)*(1./7.))-.5;gx1=fract(gx1);
  vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1),sz1=step(gz1,vec4(0.));gx1-=sz1*(step(0.,gx1)-.5);gy1-=sz1*(step(0.,gy1)-.5);
  vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y),g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y),g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
  vec4 n0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));g000*=n0.x;g010*=n0.y;g100*=n0.z;g110*=n0.w;
  vec4 n1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));g001*=n1.x;g011*=n1.y;g101*=n1.z;g111*=n1.w;
  float n000=dot(g000,Pf0),n100=dot(g100,vec3(Pf1.x,Pf0.yz)),n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),n110=dot(g110,vec3(Pf1.xy,Pf0.z));
  float n001=dot(g001,vec3(Pf0.xy,Pf1.z)),n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z)),n011=dot(g011,vec3(Pf0.x,Pf1.yz)),n111=dot(g111,Pf1);
  vec3 f=fade(Pf0);vec4 nz=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),f.z);vec2 nyz=mix(nz.xy,nz.zw,f.y);
  return 2.2*mix(nyz.x,nyz.y,f.x);}`;

// shadergradient "plane": a plane displaced along its normal by cnoise, swayed by sin(uv.y*frequency+t)*amplitude,
// coloured mix(c3, mix(c2, c1, smoothstep(-1,1,y)), distanceToCenter), lit, with grain. Here in 2D per pixel.
const GRADIENT_FRAG = `precision highp float;
varying vec2 uv;
uniform vec2 res; uniform float t; uniform vec3 c1,c2,c3; uniform float grain;
${CNOISE}
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float disp(vec2 p){return .75*cnoise(vec3(.43*p*1.3,t*.4))*1.4;}
void main(){
  vec2 p=(uv-.5)*vec2(res.x/res.y,1.)*2.2;
  p=vec2(p.x*cos(.35)-p.y*sin(.35),p.x*sin(.35)+p.y*cos(.35));
  p.x+=sin(p.y*5.5+t*.4)*.12;                  // uFrequency 5.5, uAmplitude sway
  float d=disp(p);
  vec3 pos=vec3(p,d);
  float dc=clamp(length(pos)*.55,0.,1.);
  vec3 col=mix(c3,mix(c2,c1,smoothstep(-1.,1.,pos.y+d*.6)),dc);
  float e=.02;vec3 nrm=normalize(vec3(disp(p-vec2(e,0.))-disp(p+vec2(e,0.)),disp(p-vec2(0.,e))-disp(p+vec2(0.,e)),e*6.));
  float lit=dot(nrm,normalize(vec3(-.4,.6,.7)));
  col*=.86+.22*lit;
  col+=(h(uv*res+t)-.5)*grain;
  gl_FragColor=vec4(col,1.);
}`;

function gradientBand(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'sg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = gl2d(canvas);
  if (!gl) return;
  let prog;
  try { prog = program(gl, GRADIENT_FRAG); } catch (e) { return; }
  host.prepend(canvas);
  host.classList.add('sg-on');
  const palette = () => dark()
    ? [hex('#6E5A2C'), hex('#2B3D31'), hex('#17130E')]   // gold, forest, night
    : [hex('#E2C98A'), hex('#B9C7AE'), hex('#F3EBDC')];  // wheat, sage, paper
  const size = () => {
    const r = host.getBoundingClientRect(), s = 0.5; // half resolution: the gradient is soft, the GPU stays cool
    canvas.width = Math.max(1, Math.round(r.width * s)); canvas.height = Math.max(1, Math.round(r.height * s));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(prog.u('res'), canvas.width, canvas.height);
    const [a, b, c] = palette();
    gl.uniform3fv(prog.u('c1'), a); gl.uniform3fv(prog.u('c2'), b); gl.uniform3fv(prog.u('c3'), c);
    gl.uniform1f(prog.u('grain'), dark() ? 0.035 : 0.045);
  };
  let t = 7.3, last = 0, raf = 0, visible = false;
  const frame = (now) => {
    raf = 0;
    if (!visible) return;
    if (now - last >= 33) { t += last ? Math.min(now - last, 100) / 1000 : 0; last = now; gl.uniform1f(prog.u('t'), t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    raf = requestAnimationFrame(frame);
  };
  const still = () => { gl.uniform1f(prog.u('t'), t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  size(); still();
  new ResizeObserver(() => { size(); still(); }).observe(host);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { size(); still(); });
  if (reduce) return;
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting; last = 0;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(host);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden && host.getBoundingClientRect().top < innerHeight; if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); } });
}

/* ------------------------------------------------------------------ 3. liquid metal mark */
async function liquidMark(host) {
  const { ShaderMount, liquidMetalFragmentShader, getShaderColorFromString, ShaderFitOptions } = await import('./lm.js');
  const image = new Image();
  image.src = '/brand/mark-liquid.png?v=2'; // pre-processed with toProcessedLiquidMetal (R = edge gradient, G = opacity)
  await image.decode();
  const stage = document.createElement('div');
  stage.className = 'lm-stage';
  stage.setAttribute('aria-hidden', 'true');
  host.append(stage);
  // liquid-logo's look, tinted to the Lexfall gold
  new ShaderMount(stage, liquidMetalFragmentShader, {
    u_colorBack: getShaderColorFromString('#00000000'),
    u_colorTint: getShaderColorFromString(dark() ? '#D9C38C' : '#E6CC8A'),
    u_image: image, u_isImage: true, u_shape: 0,
    u_repetition: 3, u_softness: 0.35, u_shiftRed: 0.3, u_shiftBlue: 0.3,
    u_distortion: 0.1, u_contour: 0.6, u_angle: 70,
    u_fit: ShaderFitOptions.contain, u_scale: 0.95, u_rotation: 0, u_offsetX: 0, u_offsetY: 0,
    u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0,
  }, undefined, reduce ? 0 : 0.6, 1.2, 2, 1600 * 1600);
  host.classList.add('lm-on');
}

/* ------------------------------------------------------------------ boot */
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
idle(liquidCard);
// each gradient band and the liquid leaf start only when they near the screen
const near = (el, fn) => {
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: '600px 0px' });
  io.observe(el);
};
document.querySelectorAll('.sg-band').forEach((band) => near(band, () => gradientBand(band)));
const mark = document.querySelector('.lm-mark');
if (mark) near(mark, () => liquidMark(mark).catch(() => {}));
