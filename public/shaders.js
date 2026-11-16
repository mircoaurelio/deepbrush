import {footprintGLSL} from './footprint.js';
export const vertex=`#version 300 es
in vec2 a_position;out vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0,1);}`;
const common=`precision highp float;
in vec2 v_uv;out vec4 fragColor;
uniform sampler2D u_photo,u_surface;
uniform vec2 u_resolution;
vec3 normalAt(vec2 uv){vec2 f=texture(u_surface,uv).rg*2.-1.;return normalize(vec3(f.x,f.y,max(.001,1.-abs(f.x)-abs(f.y))));}
${footprintGLSL}
`;
export const brush=`#version 300 es
${common}
uniform sampler2D u_previous,u_decal;
uniform vec2 u_center;
uniform vec4 u_pointer;
uniform vec3 u_color;
uniform float u_hardness,u_opacity,u_erase,u_foreground;
void main(){
 vec4 old=texture(u_previous,v_uv),surface=texture(u_surface,v_uv);
 if(!inFootprintSupport(v_uv,u_center)){fragColor=old;return;}
 vec2 delta=surfaceCoordinates(v_uv,u_center);
 float d=footprintDistance(delta);
 float coverage=1.-smoothstep(min(.999,u_hardness),1.,d);
 vec4 ink=vec4(u_color,1.);
 if(u_stamp>.5){vec2 duv=delta/vec2(u_radius*2.,u_radius*2./u_decalAspect)+.5;ink=texture(u_decal,duv);ink.rgb/=max(ink.a,.00001);coverage=float(all(greaterThanEqual(duv,vec2(0.)))&&all(lessThanEqual(duv,vec2(1.))))*ink.a;ink.rgb=mix(ink.rgb,u_color,u_foreground);}
 float alpha=clamp(coverage*u_opacity*surfaceMask(v_uv,u_anchor)*u_pointer.z,0.,1.);
 fragColor=u_erase>.5?old*(1.-alpha):vec4(ink.rgb*alpha+old.rgb*(1.-alpha),alpha+old.a*(1.-alpha));
}`;
export const composite=`#version 300 es
${common}
uniform sampler2D u_paint,u_light;
uniform vec4 u_pointer;
uniform vec3 u_lightDirection,u_lightColor;
uniform float u_view,u_before,u_shading,u_paintVisible,u_lightVisible,u_strength,u_specularity,u_outline,u_liveLight;
void main(){
 vec4 source=texture(u_photo,v_uv),surface=texture(u_surface,v_uv),paint=texture(u_paint,v_uv),light=texture(u_light,v_uv);
 vec3 n=normalAt(v_uv);float shade=clamp(dot(source.rgb,vec3(.2126,.7152,.0722))*1.55+.16,.16,1.45);
 vec3 rgb=source.rgb*(1.-paint.a*u_paintVisible)+paint.rgb*mix(1.,shade,u_shading)*u_paintVisible;
 vec3 ld=normalize(u_lightDirection);float lambert=max(0.,dot(n,ld));float spec=pow(max(0.,dot(n,normalize(ld+vec3(0.,0.,1.)))),32.)*u_specularity;
 float lightMask=light.a;
 if(u_liveLight>.5&&u_pointer.w>.5){float d=footprintDistance(surfaceCoordinates(v_uv,u_pointer.xy));lightMask=max(lightMask,exp(-d*d)*surfaceMask(v_uv,u_anchor)*.7);}
 rgb+=u_lightVisible*lightMask*u_strength*(source.rgb*lambert+vec3(spec))*u_lightColor;
 rgb=mix(rgb,source.rgb,u_before);
 if(u_view>.5&&u_view<1.5)rgb=vec3(surface.b);
 if(u_view>1.5&&u_view<2.5)rgb=n*.5+.5;
 if(u_view>2.5&&u_view<3.5)rgb=surface.rgb;
 if(u_view>3.5)rgb=vec3(light.a);
 float alpha=source.a;
 // Pointer uniforms visibly drive the brush cursor even before a stroke.
 if(u_outline>.5&&u_pointer.w>.5&&u_before<.5&&u_view<.5&&inFootprintSupport(v_uv,u_pointer.xy)){
   float d=footprintDistance(surfaceCoordinates(v_uv,u_pointer.xy));
   float edgeWidth=max(fwidth(d),.0001);
   float ring=1.-smoothstep(edgeWidth*.35,edgeWidth*1.5,abs(d-1.));
   float mask=surfaceMask(v_uv,u_anchor);
   rgb=mix(rgb,vec3(1.)-rgb*.6,ring*.9*smoothstep(.01,.1,mask));
 }
 fragColor=vec4(clamp(rgb,0.,1.),alpha);
}`;
