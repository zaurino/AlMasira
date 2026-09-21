export const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
export const ramp=(p,a,b)=>ease((p-a)/(b-a));
// Last six percent of a seating stroke takes thirty percent of its duration.
export const seat=x=>{x=clamp(x);return x<.7?.94*ease(x/.7):.94+.06*ease((x-.7)/.3);};
export const modules=[
 {id:'pulper',solo:false,x:-10.6,y:1.8,title:['PULPEUR','PULPER'],part:['ARBRE D’AGITATION','AGITATOR SHAFT']},
 {id:'forming',solo:false,x:-5.88,y:1.24,title:['FORMATION','FORMING'],part:['SYSTÈME DE VIDE','VACUUM SYSTEM']},
 {id:'press',solo:true,start:.15,end:.48,x:-2.6,y:1.08,title:['PRESSE','PRESS SECTION'],part:['ROULEAU DE PRESSE','PRESS ROLLER']},
 {id:'drying',solo:true,start:.48,end:.80,x:1.25,y:2.38,title:['SÉCHAGE','DRYING'],part:['ENTRAÎNEMENT','DRIVE ASSEMBLY']},
 {id:'reeling',solo:false,x:7.25,y:2.13,title:['BOBINEUSE','REELING'],part:['ACCOUPLEMENT','SHAFT COUPLING']}
];
const choreography={
 cover:[0,.16,.965,1],roof:[.07,.25,.94,.988],support:[.17,.34,.90,.964],
 roller:[.24,.44,.85,.93],motor:[.32,.50,.825,.905],
 coupling:[.38,.54,.80,.875],bearing:[.34,.51,.77,.845],shaft:[.28,.46,.745,.815]
};
function layer(q,times){const[a,b,c,d]=times;return ramp(q,a,b)*(1-seat((q-c)/(d-c)));}
export function heroState(p){
 const values={};
 for(const[key,[a,b,c,d]]of Object.entries(choreography)){
  // Reveal major groups from 88%; settle inner parts first during the final 4%.
  values[key]=ramp(p,.88+a*.075,.88+b*.075)*(1-seat((p-(.96+(c-.745)/.255*.04))/((d-c)/.255*.04)));
 }
 return values;
}
export function moduleState(p,m){
 const q=m.solo?clamp((p-m.start)/(m.end-m.start)):0;
 const hero=heroState(p),layers={};
 for(const[key,times]of Object.entries(choreography))layers[key]=Math.max(m.solo?layer(q,times):0,hero[key]);
 const active=!!m.solo&&p>m.start&&p<m.end;
 return{q,layers,opening:layers.cover,exploded:Math.max(layers.motor,layers.shaft),active,
 state:!active?'ASSEMBLED':q<.25?'OPENING':q<.44?'INTERNAL VIEW':q<.745?'EXPLODED':q<.965?'REASSEMBLED':'OPERATING DETAIL'};
}
// A stable 3/4 view: the target pans slightly, while viewing direction stays constant.
const shot=(p,x,scale)=>[p,[x-10*scale,1.3+7*scale,24*scale],[x,1.3,0]];
export const cameraKeys=[shot(0,-1.2,1.18),shot(.15,-1.4,1.10),shot(.30,-2.0,1.00),shot(.48,-1.8,1.00),shot(.63,.15,1.00),shot(.80,.15,1.00),shot(.88,-1.2,1.23),shot(.96,-1.2,1.23),shot(1,-1.2,1.18)];
export function cameraAt(p){
 p=clamp(p);let i=0;while(i<cameraKeys.length-2&&p>cameraKeys[i+1][0])i++;
 const a=cameraKeys[i],b=cameraKeys[i+1],t=ease((p-a[0])/(b[0]-a[0]));
 return{position:a[1].map((v,j)=>v+(b[1][j]-v)*t),target:a[2].map((v,j)=>v+(b[2][j]-v)*t)};
}
