/* ===== coaster path generator + physics (pure JS) ===== */
var COASTER_CFG={XW:-52,XE:56,SP:10,R:5,Z0:-13,SX:-35,STOPZ:12,CHAIN:14.0,VH:40};
function buildCoasterTrack(CR,cfg){
  cfg=cfg||COASTER_CFG;
  var XW=cfg.XW,XE=cfg.XE,SP=cfg.SP,R=cfg.R,Z0=cfg.Z0,SX=cfg.SX,G=9.8;
  var X=[],Z=[],Y=[],SEG=[];
  function sm5(u){u=u<0?0:u>1?1:u;return u*u*u*(u*(u*6-15)+10);}
  function put(x,z,y,seg){X.push(x);Z.push(z);Y.push(y);SEG.push(seg);}
  var DS=0.5;
  function line(x0,z0,x1,z1,yf,seg){
    var L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(L/DS)),i;
    for(i=0;i<n;i++){var u=i/n;put(x0+(x1-x0)*u,z0+(z1-z0)*u,yf(u),seg);}
  }
  function arc(fn,yf,seg){ /* fn(t) t in [0,PI/2 or PI] handled by caller via tmax */
    var n=Math.max(2,Math.round(fn.len/DS)),i;
    for(i=0;i<n;i++){var u=i/n,p=fn(u*fn.tmax);put(p[0],p[1],yf(u),seg);}
  }
  function mkArc(f,tmax){var g=function(t){return f(t);};g.tmax=tmax;g.len=R*tmax;return g;}
  /* station line: north along SX from z=32 to z=-8 */
  line(SX,32,SX,Z0+R,function(){return 0.95;},'st');
  /* A0: right turn north->east, centre (SX+R, Z0+R) */
  arc(mkArc(function(t){return [SX+R-R*Math.cos(t),Z0+R-R*Math.sin(t)];},Math.PI/2),function(u){return 0.95+0.65*sm5(u);},'a0');
  /* lane 0: lift */
  line(SX+R,Z0,XE,Z0,function(u){return 1.6+(CR[0]-1.6)*sm5(u);},'l0');
  var k;
  for(k=0;k<5;k++){
    var zA=Z0+SP*k,east=(k%2===0);
    var cx=east?XE:XW,sgn=east?1:-1;
    /* turn k */
    arc(mkArc(function(t){return [cx+sgn*R*Math.sin(t),zA+R-R*Math.cos(t)];},Math.PI),function(){return CR[k];},'t'+k);
    /* lane k+1 */
    var xa=east?XE:XW,xb=east?XW:XE,yS=CR[k],zB=zA+SP;
    if(k<4){
      (function(yS,yE,k){
        line(xa,zB,xb,zB,function(u){
          var L=yS+(yE-yS)*u,s2=Math.sin(Math.PI*u);
          var w=(u>0.25&&u<0.75)?Math.pow(Math.sin(Math.PI*(u-0.25)/0.5),2):0,hump=(k>=1&&k<=3)?1.3*w*Math.sin(2*Math.PI*(u-0.25)/0.5):0;
          var f=s2*s2,dp=Math.max(3.0,(yS+yE)/2-cfg.VH)-0;return L-(L-dp)*f+hump;
        },'l'+(k+1));
      })(yS,CR[k+1],k);
    }else{
      /* brake lane: descend from crest to low, then level, east->west */
      line(xa,zB,SX+R,zB,function(u){
        var d=sm5(u/0.45);
        var base=yS+(6.0-yS)*d;
        var e=sm5((u-0.8)/0.2);
        return base+(1.4-base)*e;
      },'l5');
    }
  }
  /* A5: left... heading west -> north (right turn), centre (SX+R, 32) */
  arc(mkArc(function(t){return [SX+R-R*Math.sin(t),Z0+SP*5-R+R*Math.cos(t)];},Math.PI/2),function(u){return 1.4+(0.95-1.4)*sm5(u);},'a5');
  var n0=X.length,i,j;
  /* smooth Y (closed), window +-8 samples (4 m) */
  var Ys=new Array(n0);
  for(i=0;i<n0;i++){var a=0,c=0;for(j=-8;j<=8;j++){a+=Y[(i+j+n0)%n0];c++;}Ys[i]=a/c;}
  /* keep station level exactly */
  for(i=0;i<n0;i++)if(SEG[i]==='st'&&Math.abs(Z[i]-12)<30)Ys[i]=Math.max(0.95,Math.min(Ys[i],1.0));
  /* 3D arc length + resample at 1 m */
  var S=[0];for(i=1;i<=n0;i++){var p=i%n0,q=i-1;S.push(S[q]+Math.hypot(X[p]-X[q],Ys[p]-Ys[q],Z[p]-Z[q]));}
  var total=S[n0],N=Math.round(total),ds=total/N;
  var PX=new Float32Array(N),PY=new Float32Array(N),PZ=new Float32Array(N),SG=new Array(N);
  var idx=0;
  for(i=0;i<N;i++){
    var s=i*ds;while(idx<n0-1&&S[idx+1]<s)idx++;
    var f=(s-S[idx])/Math.max(1e-6,S[idx+1]-S[idx]),b=(idx+1)%n0;
    PX[i]=X[idx]+(X[b]-X[idx])*f;PY[i]=Ys[idx]+(Ys[b]-Ys[idx])*f;PZ[i]=Z[idx]+(Z[b]-Z[idx])*f;SG[i]=SEG[idx];
  }
  /* index landmarks */
  var iStop=0,iA0=0,iTop=0,iBrake=0,minD=1e9;
  for(i=0;i<N;i++){
    if(SG[i]==='st'&&Math.abs(PZ[i]-cfg.STOPZ)<minD){minD=Math.abs(PZ[i]-cfg.STOPZ);iStop=i;}
  }
  for(i=0;i<N;i++){if(SG[i]==='a0'){iA0=i;break;}}
  for(i=N-1;i>=0;i--){if(SG[i]==='t0'){iTop=i;break;}}
  for(i=0;i<N;i++){if(SG[i]==='l5'){iBrake=i;break;}}
  /* speed profile */
  var V=new Float32Array(N),V2=new Float32Array(N);
  var CF=0.010,CD=0.00035,BR=3.2,CH=cfg.CHAIN;
  function nxt(i){return (i+1)%N;}
  /* launch+lift from iStop to iTop */
  var v2=0.3;i=iStop;
  while(true){
    var d=(i-iStop+N)%N;
    var vv=Math.sqrt(Math.max(v2,0.09));
    V[i]=Math.min(vv,CH);
    if(i===iTop)break;
    v2=Math.min(v2+2*2.2*ds,CH*CH);
    i=nxt(i);
  }
  /* physics iTop -> iStop */
  v2=CH*CH;i=iTop;
  var vminCrit=1e9;
  while(i!==iStop){
    V[i]=Math.sqrt(v2);
    var jn=nxt(i),dy=PY[jn]-PY[i];
    v2=v2-2*G*dy-ds*(2*CF*G+2*CD*v2);
    if(v2<4)v2=4;
    i=jn;
  }
  V[iStop]=0.3;
  /* brake limit: slow to 6.5 m/s before the final turn, then stop at the station */
  var iA5=0;for(i=0;i<N;i++){if(SG[i]==='a5'){iA5=i;break;}}
  var BR2=4.0;
  for(i=0;i<N;i++){
    var dist=((iStop-i)%N+N)%N*ds;
    if(dist<260&&((i>=iBrake)||i<iStop)){
      var lim=Math.sqrt(2*BR*Math.max(dist-0.5,0))+0.9;
      if(i<=iA5&&i>=iBrake)lim=Math.min(lim,Math.sqrt(6.5*6.5+2*BR2*(iA5-i)*ds));
      else if(i>iA5||i<iStop)lim=Math.min(lim,6.5);
      if(V[i]>lim)V[i]=lim;
    }
  }
  /* frames */
  var TX=new Float32Array(N),TY=new Float32Array(N),TZ=new Float32Array(N);
  for(i=0;i<N;i++){
    var a1=(i+N-1)%N,b1=(i+1)%N,tx=PX[b1]-PX[a1],ty=PY[b1]-PY[a1],tz=PZ[b1]-PZ[a1],tl=Math.hypot(tx,ty,tz);
    TX[i]=tx/tl;TY[i]=ty/tl;TZ[i]=tz/tl;
  }
  var BANK=new Float32Array(N),LAT=new Float32Array(N),tmp=new Float32Array(N);
  for(i=0;i<N;i++){
    var a2=(i+N-3)%N,b2=(i+3)%N;
    var dtx=(TX[b2]-TX[a2])/(6*ds),dtz=(TZ[b2]-TZ[a2])/(6*ds);
    var hl=Math.hypot(TX[i],TZ[i])||1,shx=-TZ[i]/hl,shz=TX[i]/hl;
    var kap=dtx*shx+dtz*shz,vv2=V[i]*V[i];
    var ac=vv2*kap;LAT[i]=ac;
    tmp[i]=Math.max(-1.2,Math.min(1.2,Math.atan2(ac,G)));
  }
  for(i=0;i<N;i++){var q2=0;for(j=-12;j<=12;j++)q2+=tmp[(i+j+N)%N];BANK[i]=q2/25;}
  return {N:N,ds:ds,total:total,PX:PX,PY:PY,PZ:PZ,TX:TX,TY:TY,TZ:TZ,V:V,BANK:BANK,LAT:LAT,SG:SG,iStop:iStop,iA0:iA0,iTop:iTop,iBrake:iBrake,CR:CR};
}
if(typeof module!=='undefined')module.exports={buildCoasterTrack:buildCoasterTrack,COASTER_CFG:COASTER_CFG};
