// Genera crime_incidents_lima_1900.csv  (38 distritos × 10 tipos × 5 rep.)
// Ejecutar: node scripts/generate-csv.js

const DAYS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']

const DISTRICTS = [
  { name:'SAN JUAN DE LURIGANCHO', lat:-11.988,lng:-77.006,base_freq:320,risk_base:75 },
  { name:'COMAS',                  lat:-11.938,lng:-77.052,base_freq:230,risk_base:65 },
  { name:'LOS OLIVOS',             lat:-11.977,lng:-77.068,base_freq:200,risk_base:60 },
  { name:'INDEPENDENCIA',          lat:-11.994,lng:-77.057,base_freq:220,risk_base:62 },
  { name:'SAN MARTIN DE PORRES',   lat:-12.002,lng:-77.092,base_freq:280,risk_base:70 },
  { name:'CARABAYLLO',             lat:-11.884,lng:-77.040,base_freq:175,risk_base:58 },
  { name:'PUENTE PIEDRA',          lat:-11.864,lng:-77.076,base_freq:165,risk_base:56 },
  { name:'ANCÓN',                  lat:-11.777,lng:-77.164,base_freq: 95,risk_base:38 },
  { name:'SANTA ROSA',             lat:-11.815,lng:-77.164,base_freq: 80,risk_base:33 },
  { name:'LIMA CERCADO',           lat:-12.046,lng:-77.043,base_freq:250,risk_base:72 },
  { name:'RIMAC',                  lat:-12.028,lng:-77.028,base_freq:240,risk_base:73 },
  { name:'BREÑA',                  lat:-12.061,lng:-77.049,base_freq:175,risk_base:62 },
  { name:'LA VICTORIA',            lat:-12.071,lng:-77.020,base_freq:270,risk_base:78 },
  { name:'EL AGUSTINO',            lat:-12.045,lng:-77.002,base_freq:235,risk_base:74 },
  { name:'LINCE',                  lat:-12.088,lng:-77.036,base_freq:150,risk_base:50 },
  { name:'JESÚS MARÍA',            lat:-12.071,lng:-77.049,base_freq:120,risk_base:42 },
  { name:'MAGDALENA DEL MAR',      lat:-12.093,lng:-77.073,base_freq:105,risk_base:38 },
  { name:'PUEBLO LIBRE',           lat:-12.077,lng:-77.067,base_freq:110,risk_base:40 },
  { name:'SAN MIGUEL',             lat:-12.077,lng:-77.084,base_freq:130,risk_base:44 },
  { name:'ATE',                    lat:-12.028,lng:-76.906,base_freq:260,risk_base:68 },
  { name:'SANTA ANITA',            lat:-12.044,lng:-76.972,base_freq:185,risk_base:60 },
  { name:'SAN LUIS',               lat:-12.074,lng:-76.999,base_freq:145,risk_base:53 },
  { name:'LURIGANCHO',             lat:-11.954,lng:-76.876,base_freq:195,risk_base:62 },
  { name:'CHACLACAYO',             lat:-11.976,lng:-76.769,base_freq: 90,risk_base:36 },
  { name:'CIENEGUILLA',            lat:-12.061,lng:-76.812,base_freq: 75,risk_base:30 },
  { name:'SURQUILLO',              lat:-12.112,lng:-77.016,base_freq:160,risk_base:52 },
  { name:'MIRAFLORES',             lat:-12.122,lng:-77.030,base_freq:140,risk_base:38 },
  { name:'SAN ISIDRO',             lat:-12.103,lng:-77.036,base_freq: 90,risk_base:30 },
  { name:'SAN BORJA',              lat:-12.105,lng:-77.000,base_freq: 85,risk_base:28 },
  { name:'LA MOLINA',              lat:-12.076,lng:-76.945,base_freq: 75,risk_base:26 },
  { name:'SANTIAGO DE SURCO',      lat:-12.146,lng:-76.989,base_freq:110,risk_base:36 },
  { name:'BARRANCO',               lat:-12.150,lng:-77.021,base_freq:100,risk_base:35 },
  { name:'CHORRILLOS',             lat:-12.163,lng:-77.019,base_freq:190,risk_base:58 },
  { name:'VILLA MARIA DEL TRIUNFO',lat:-12.162,lng:-76.960,base_freq:200,risk_base:61 },
  { name:'VILLA EL SALVADOR',      lat:-12.207,lng:-76.941,base_freq:210,risk_base:63 },
  { name:'LURÍN',                  lat:-12.275,lng:-76.873,base_freq:120,risk_base:42 },
  { name:'PACHACÁMAC',             lat:-12.228,lng:-76.870,base_freq:100,risk_base:40 },
  { name:'CALLAO',                 lat:-12.053,lng:-77.122,base_freq:260,risk_base:71 },
]

const CRIME_TYPES = [
  { type:'robo agravado',                   risk:'alto',  peak_hours:[20,21,22,23,0]  },
  { type:'robo a mano armada',              risk:'alto',  peak_hours:[21,22,23,0,1]   },
  { type:'robo de vehiculo',                risk:'alto',  peak_hours:[2,3,4,20,21]    },
  { type:'microcomercializacion de drogas', risk:'alto',  peak_hours:[22,23,0,1,2]    },
  { type:'lesiones',                        risk:'medio', peak_hours:[20,21,22,23,0]  },
  { type:'violencia familiar',              risk:'medio', peak_hours:[19,20,21,22,23] },
  { type:'hurto agravado',                  risk:'medio', peak_hours:[8,12,17,18,19]  },
  { type:'hurto',                           risk:'bajo',  peak_hours:[8,9,12,13,18]   },
  { type:'estafa',                          risk:'bajo',  peak_hours:[9,10,11,14,15]  },
  { type:'acoso',                           risk:'bajo',  peak_hours:[7,8,17,18,19]   },
]

const REPS = 5   // 38 × 10 × 5 = 1900

let seed = 42
function rand() { seed=(seed*1664525+1013904223)&0xffffffff; return(seed>>>0)/4294967296 }
function jitter(b,r){ return +((b+(rand()*2-1)*r).toFixed(5)) }
function pick(a){ return a[Math.floor(rand()*a.length)] }

const rows=[]
for(const d of DISTRICTS){
  for(const c of CRIME_TYPES){
    for(let r=0;r<REPS;r++){
      const usePeak=rand()<0.6
      const hour=usePeak?pick(c.peak_hours):Math.floor(rand()*24)
      const day=pick(DAYS)
      const fm=c.risk==='alto'?1.4:c.risk==='medio'?1.0:0.6
      const freq=Math.max(1,Math.round(d.base_freq*fm*(0.75+rand()*0.5)))
      const isNight=hour>=22||hour<=3
      const isEve=hour>=18&&hour<22
      let risk=c.risk
      if(c.risk==='medio'&&isNight&&d.risk_base>=65) risk='alto'
      if(c.risk==='alto'&&!isNight&&!isEve&&d.risk_base<40) risk='medio'
      if(c.risk==='bajo'&&isEve&&d.risk_base>=70) risk='medio'
      rows.push({crime_type:c.type,hour,day_of_week:day,district:d.name,
        latitude:jitter(d.lat,0.015),longitude:jitter(d.lng,0.015),
        historical_frequency:freq,risk_level:risk})
    }
  }
}

const header='crime_type,hour,day_of_week,district,latitude,longitude,historical_frequency,risk_level'
const csv=[header,...rows.map(r=>
  `${r.crime_type},${r.hour},${r.day_of_week},${r.district},${r.latitude},${r.longitude},${r.historical_frequency},${r.risk_level}`
)].join('\n')

const fs=await import('fs')
const path=await import('path')
const out=path.resolve('crime_incidents_lima_1900.csv')
fs.writeFileSync(out,'\ufeff'+csv,'utf8')
console.log(`✓ ${rows.length} filas → ${out}`)
