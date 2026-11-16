// One surface footprint for both the paint pass and the cursor pass.
// Size is the brush diameter at the reference depth, before projection.
export const footprintGLSL=`
uniform float u_radius,u_rotation,u_roundness,u_shape,u_sizing,u_relief,u_stamp,u_decalAspect;
uniform vec3 u_masking;
uniform vec2 u_anchor;
float perspectiveScale(float depth){return (.5+1.5*depth)/1.25;}
float footprintSupport(){return u_radius*1.6*(u_stamp>.5?length(vec2(1.,1./u_decalAspect)):1.)+3./u_resolution.y;}
bool inFootprintSupport(vec2 uv,vec2 center){return length((uv-center)*vec2(u_resolution.x/u_resolution.y,1.))<=footprintSupport();}
vec3 brushNormalAt(vec2 uv){vec3 n=normalAt(uv);return normalize(vec3(n.xy*u_relief,n.z));}
vec2 tangentCoordinates(vec2 delta,vec3 n){
 // Clamp the plane, not its determinant: an independent determinant clamp
 // can enlarge the unforeshortened axis at grazing angles.
 n=normalize(vec3(n.xy,max(.06,n.z)));
 vec3 tx=normalize(vec3(n.z,0.,-n.x));
 vec3 ty=normalize(cross(n,tx));
 float det=max(.0001,tx.x*ty.y-tx.y*ty.x);
 return vec2(ty.y*delta.x-ty.x*delta.y,-tx.y*delta.x+tx.x*delta.y)/det;
}
vec2 surfaceCoordinates(vec2 uv,vec2 center){
 vec2 screenDelta=(uv-center)*vec2(u_resolution.x/u_resolution.y,1.);
 float centerDepth=texture(u_surface,center).b;
 float scale=mix(1.,perspectiveScale(centerDepth),u_sizing);
 vec2 delta=screenDelta;
 if(u_shape>.5){
   delta=tangentCoordinates(screenDelta,brushNormalAt(center));
   if(u_shape>1.5){
     // Integrate the local surface metric along the path. The depth term
     // prevents a brush on one surface from projecting onto a distant one.
     vec2 stepUV=(uv-center)/8.,stepXY=screenDelta/8.;
     float travel=0.,previousDepth=centerDepth;
     for(int i=0;i<8;i++){
       vec2 at=center+stepUV*(float(i)+.5);
       vec3 n=brushNormalAt(at);
       float nextDepth=texture(u_surface,center+stepUV*(float(i)+1.)).b;
       float zSlope=-dot(n.xy,stepXY)/max(.06,n.z);
       float zDepth=(nextDepth-previousDepth)*.15*max(u_resolution.x/u_resolution.y,1.)*u_relief;
       float arc=max(length(vec3(stepXY,zSlope)),length(vec3(stepXY,zDepth)));
       float perspective=perspectiveScale(centerDepth)/perspectiveScale((previousDepth+nextDepth)*.5);
       travel+=arc*mix(1.,perspective,u_sizing);
       previousDepth=nextDepth;
     }
     delta=length(delta)>.000001?normalize(delta)*travel:vec2(0.);
   }
 }
 delta/=scale;
 float c=cos(u_rotation),s=sin(u_rotation);
 delta=mat2(c,-s,s,c)*delta;
 delta.y/=max(.1,u_roundness);
 return delta;
}
float footprintDistance(vec2 local){
 if(u_stamp>.5)return max(abs(local.x),abs(local.y)*u_decalAspect)/u_radius;
 return length(local)/u_radius;
}
float surfaceMask(vec2 uv,vec2 anchor){
 vec4 surface=texture(u_surface,uv),seed=texture(u_surface,anchor);
 float mask=surface.a;
 if(u_masking.x>.001){vec3 color=texture(u_photo,uv).rgb,seedColor=texture(u_photo,anchor).rgb;float t=mix(1.74,.025,u_masking.x);mask*=1.-smoothstep(t*.6,t,length(color-seedColor));}
 if(u_masking.y>.001){float t=mix(1.,.015,u_masking.y);mask*=1.-smoothstep(t*.5,t,abs(surface.b-seed.b));}
 if(u_masking.z>.001){float t=mix(-1.,.98,u_masking.z);mask*=smoothstep(t-.2,t,dot(normalAt(uv),normalAt(anchor)));}
 return mask;
}
`;
