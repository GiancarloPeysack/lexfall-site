var z=matchMedia("(prefers-reduced-motion: reduce)").matches,h=()=>matchMedia("(prefers-color-scheme: dark)").matches;function w(e){let i={alpha:!0,premultipliedAlpha:!0,antialias:!1,preserveDrawingBuffer:!1};return e.getContext("webgl",i)||null}function P(e,i){let r="attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}",o=(d,f)=>{let n=e.createShader(d);if(e.shaderSource(n,f),e.compileShader(n),!e.getShaderParameter(n,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(n));return n},t=e.createProgram();if(e.attachShader(t,o(e.VERTEX_SHADER,r)),e.attachShader(t,o(e.FRAGMENT_SHADER,i)),e.linkProgram(t),!e.getProgramParameter(t,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(t));e.useProgram(t);let c=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,c),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW);let u=e.getAttribLocation(t,"a");e.enableVertexAttribArray(u),e.vertexAttribPointer(u,2,e.FLOAT,!1,0,0);let m={};return{p:t,u:d=>m[d]??=e.getUniformLocation(t,d)}}var v=e=>[1,3,5].map(i=>parseInt(e.slice(i,i+2),16)/255),E=`precision mediump float;
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
}`;function _(){let e=document.querySelector(".ed-hero .wordcard.glass"),i=document.querySelector(".ed-hero-art"),r=i&&i.querySelector(".pn-plate img");if(!e||!r)return;let o=document.createElement("canvas");o.className="lg-canvas",o.setAttribute("aria-hidden","true");let t=w(o);if(!t)return;let c;try{c=P(t,E)}catch{return}let u=t.createTexture(),m=()=>{t.bindTexture(t.TEXTURE_2D,u),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1);let n=r,a=r.naturalWidth,s=r.naturalHeight;for(;a>96;){a=Math.max(48,a>>1),s=Math.max(1,Math.round(a*r.naturalHeight/r.naturalWidth));let g=document.createElement("canvas");g.width=a,g.height=s,g.getContext("2d").drawImage(n,0,0,a,s),n=g}t.texImage2D(t.TEXTURE_2D,0,t.RGB,t.RGB,t.UNSIGNED_BYTE,n);for(let[g,l]of[[t.TEXTURE_MIN_FILTER,t.LINEAR],[t.TEXTURE_MAG_FILTER,t.LINEAR],[t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE],[t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE]])t.texParameteri(t.TEXTURE_2D,g,l)},d=()=>{let n=e.getBoundingClientRect(),a=r.getBoundingClientRect();if(!n.width||!a.width)return;let s=Math.min(devicePixelRatio||1,2);o.width=Math.round(n.width*s),o.height=Math.round(n.height*s),t.viewport(0,0,o.width,o.height);let g=getComputedStyle(document.documentElement),l=h();t.uniform2f(c.u("size"),n.width,n.height),t.uniform1f(c.u("radius"),parseFloat(getComputedStyle(e).borderTopLeftRadius)||24),t.uniform4f(c.u("imgRect"),a.left-n.left,a.top-n.top,a.width,a.height),t.uniform1f(c.u("imgRadius"),parseFloat(getComputedStyle(r).borderTopLeftRadius)||0),t.uniform3fv(c.u("bg"),v(g.getPropertyValue("--bg").trim()||(l?"#100E0B":"#F4F0E8"))),t.uniform3fv(c.u("tint"),v(g.getPropertyValue("--surface").trim()||"#FBF8F1")),t.uniform1f(c.u("tintAmt"),l?.62:.58),t.uniform1f(c.u("dim"),l?.86:1),t.uniform1i(c.u("img"),0),t.drawArrays(t.TRIANGLE_STRIP,0,4)},f=()=>{try{m()}catch{return}e.prepend(o),e.classList.add("lg-on"),d();let n=0,a=()=>{cancelAnimationFrame(n),n=requestAnimationFrame(d)};new ResizeObserver(a).observe(e),new ResizeObserver(a).observe(i),matchMedia("(prefers-color-scheme: dark)").addEventListener("change",a)};(r.complete&&r.naturalWidth?Promise.resolve():r.decode()).then(f,()=>{})}var A=`vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
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
  return 2.2*mix(nyz.x,nyz.y,f.x);}`,T=`precision highp float;
varying vec2 uv;
uniform vec2 res; uniform float t; uniform vec3 c1,c2,c3; uniform float grain;
${A}
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
}`;function S(e){let i=document.createElement("canvas");i.className="sg-canvas",i.setAttribute("aria-hidden","true");let r=w(i);if(!r)return;let o;try{o=P(r,T)}catch{return}e.prepend(i),e.classList.add("sg-on");let t=()=>h()?[v("#6E5A2C"),v("#2B3D31"),v("#17130E")]:[v("#E2C98A"),v("#B9C7AE"),v("#F3EBDC")],c=()=>{let s=e.getBoundingClientRect(),g=.5;i.width=Math.max(1,Math.round(s.width*g)),i.height=Math.max(1,Math.round(s.height*g)),r.viewport(0,0,i.width,i.height),r.uniform2f(o.u("res"),i.width,i.height);let[l,R,b]=t();r.uniform3fv(o.u("c1"),l),r.uniform3fv(o.u("c2"),R),r.uniform3fv(o.u("c3"),b),r.uniform1f(o.u("grain"),h()?.035:.045)},u=7.3,m=0,d=0,f=!1,n=s=>{d=0,f&&(s-m>=33&&(u+=m?Math.min(s-m,100)/1e3:0,m=s,r.uniform1f(o.u("t"),u),r.drawArrays(r.TRIANGLE_STRIP,0,4)),d=requestAnimationFrame(n))},a=()=>{r.uniform1f(o.u("t"),u),r.drawArrays(r.TRIANGLE_STRIP,0,4)};c(),a(),new ResizeObserver(()=>{c(),a()}).observe(e),matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{c(),a()}),!z&&(new IntersectionObserver(([s])=>{f=s.isIntersecting,m=0,f&&!d&&(d=requestAnimationFrame(n))}).observe(e),document.addEventListener("visibilitychange",()=>{f=!document.hidden&&e.getBoundingClientRect().top<innerHeight,f&&!d&&(m=0,d=requestAnimationFrame(n))}))}async function F(e){let{ShaderMount:i,liquidMetalFragmentShader:r,getShaderColorFromString:o,ShaderFitOptions:t}=await import("./c-ZYALJJSN.js"),c=new Image;c.src="/brand/mark-liquid.png?v=2",await c.decode();let u=document.createElement("div");u.className="lm-stage",u.setAttribute("aria-hidden","true"),e.append(u),new i(u,r,{u_colorBack:o("#00000000"),u_colorTint:o("#FFFFFF"),u_image:c,u_isImage:!0,u_shape:0,u_repetition:1.5,u_softness:.6,u_shiftRed:.6,u_shiftBlue:.6,u_distortion:.15,u_contour:.9,u_angle:70,u_fit:t.contain,u_scale:.95,u_rotation:0,u_offsetX:0,u_offsetY:0,u_originX:.5,u_originY:.5,u_worldWidth:0,u_worldHeight:0},void 0,z?0:.6,1.2,2,1600*1600),e.classList.add("lm-on")}var I=window.requestIdleCallback||(e=>setTimeout(e,200));I(_);var y=document.querySelector("#download .closer"),p=document.querySelector(".sg-band"),x=document.querySelector(".lm-mark");if(y&&(p||x)){let e=new IntersectionObserver(([i])=>{i.isIntersecting&&(e.disconnect(),p&&S(p),x&&F(x).catch(()=>{}))},{rootMargin:"600px 0px"});e.observe(y)}
