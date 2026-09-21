// Pure timeline: every animated value is a function of scroll, never elapsed time.
export const clamp01=x=>Math.max(0,Math.min(1,x));
export const ramp=(p,a,b)=>{const x=clamp01((p-a)/(b-a));return x*x*(3-2*x);};
export const stages=[
 ['EXTERIOR',0],['ACCESS',.07],['ENTRY',.13],['WASTE PAPER',.19],['PULPING',.25],['CELLULOSE',.32],['ONE FIBER',.38],['SCREENING',.44],['DE-INKING',.50],['FLOW',.56],['FORMATION',.63],['WET WEB',.70],['PRESSING',.75],['DRYING',.81],['WINDING',.87],['EXIT',.93],['ONE CYCLE',1]
];
export function sample(p){
 p=clamp01(p);
 return {p,open:ramp(p,.065,.14)*(1-ramp(p,.93,.985)),wet:ramp(p,.22,.27),tear:ramp(p,.26,.325),micro:ramp(p,.30,.35)*(1-ramp(p,.66,.715)),clean:ramp(p,.44,.49),deink:ramp(p,.50,.55),network:ramp(p,.63,.69),press:ramp(p,.75,.80),dry:ramp(p,.81,.86),wind:ramp(p,.87,.93),rotation:p*95,stage:Math.max(0,stages.findLastIndex(s=>p>=s[1]-.018))};
}
// Positions all belong to the same machine coordinate system, including the microscopic path.
export const cameraKeys=[
 [0,[-13,10,25],[-1,1,0]], [.06,[-12,6,14],[-7,1.6,0]],
 [.12,[-11.6,3.2,4],[-10.5,1.8,0]], [.18,[-10.8,2.9,1.2],[-10.6,2,0]],
 [.24,[-10.8,2.5,.48],[-10.6,2.04,0]], [.29,[-10.65,2.16,.14],[-10.6,2.05,0]],
 [.34,[-10.6,2.087,.045],[-10.58,2.07,0]], [.39,[-10.31,2.08,.027],[-10.26,2.075,0]],
 [.45,[-9.85,2.08,.025],[-9.8,2.075,0]], [.51,[-9.35,2.08,.025],[-9.3,2.075,0]],
 [.57,[-8.85,2.08,.045],[-8.8,2.07,0]], [.62,[-8.05,1.75,.18],[-7.7,1.50,0]],
 [.67,[-7.1,1.515,.045],[-7.04,1.495,0]], [.71,[-5.2,1.82,.7],[-4.2,1.5,0]],
 [.75,[-3.15,1.60,.3],[-2.55,1.585,.1]], [.785,[-1.9,1.60,.20],[-1.4,1.585,.1]],
 [.81,[-.6,2.12,1.8],[.2,1.85,0]], [.845,[2,3.35,1.6],[3,2,0]],
 [.885,[5.9,2.7,2],[7.2,2.3,0]], [.93,[8.6,4,5],[6,2,0]],
 [.97,[9,7,15],[0,1.4,0]], [1,[12,10,25],[-1,1.3,0]]
];
// Cubic Hermite interpolation preserves velocity across keyframe boundaries.
export function cameraAt(p){
 let i=0;while(i<cameraKeys.length-2&&p>cameraKeys[i+1][0])i++;
 const a=cameraKeys[i],b=cameraKeys[i+1],prev=cameraKeys[Math.max(0,i-1)],next=cameraKeys[Math.min(cameraKeys.length-1,i+2)];
 const dt=b[0]-a[0],t=clamp01((p-a[0])/dt),t2=t*t,t3=t2*t;
 const interpolate=k=>a[k].map((v,j)=>{
  const m0=(b[k][j]-prev[k][j])/(b[0]-prev[0])*dt;
  const m1=(next[k][j]-a[k][j])/(next[0]-a[0])*dt;
  return (2*t3-3*t2+1)*v+(t3-2*t2+t)*m0+(-2*t3+3*t2)*b[k][j]+(t3-t2)*m1;
 });
 return {position:interpolate(1),target:interpolate(2)};
}
