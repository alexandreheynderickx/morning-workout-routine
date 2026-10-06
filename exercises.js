// Exercise definitions: poses (keyframes), instructions and progressions.
// Side-view angles in degrees: 0 = right, 90 = down. {t:[x,y], s} = IK target for hand/foot. Floor at y = 160.

// ---------- Base poses ----------
const KNEEL = { hip:[90,146], torso:-90, neckA:-90, face:0, aN:[65,70], aF:[68,66], lN:[25,180], lF:[22,180], hl:['head'] };
const QUAD  = { hip:[70,130], torso:-17.4, neckA:-10, face:20, aN:[90,90], aF:[92,88], lN:[90,180], lF:[88,182] };
const STAND = { hip:[100,100], torso:-90, neckA:-90, face:0, aN:[90,90], aF:[93,90], lN:[90,90], lF:[92,89], ftN:0, ftF:0 };
const TALL  = { hip:[70,146], torso:-90, neckA:-90, face:0, aN:[-80,-80], aF:[-83,-83], lN:[20,180], lF:[18,180], hl:['aN','aF'] };
const LUNGE = { hip:[95,128], torso:-12, neckA:-15, face:20, lN:[4,90], lF:[148,150], aF:[95,92], aN:[97,90], ftN:0, hl:['aN'] };
const DSQ   = { hip:[86,146], torso:-70, neckA:-75, face:0, lN:[-25.7,115.7], lF:[-23,113], aN:[70,-40], aF:[72,-38], ftN:0, ftF:0, hl:['lN','lF'] };
const SEAT  = { view:'front', neck:[100,112], hip:[100,152], eL:[80,132], hL:[76,152], eR:[120,132], hR:[124,152],
                kL:[78,130], fL:[68,160], kR:[122,130], fR:[132,160] };
const BOOK  = { view:'end', bot:[100,158], shA:-90, head:[100,146], face:0, topArm:[22,22], botArm:[0,0] };

// Strength bases
const PLANK = { hip:[95.3,128.6], torso:-22.9, neckA:-22.9, face:30, aN:{t:[130,155],s:-1}, aF:{t:[133,155],s:-1},
                lN:{t:[40,152],s:1}, lF:{t:[42,152],s:1}, ftN:75, ftF:75 };
const PLANK_DOWN = { ...PLANK, hip:[99.1,141.8], torso:-9.8, neckA:-9.8, face:40 };
const UPRIGHT = { hip:[100,99.5], torso:-90, neckA:-90, face:0, lN:{t:[102,159],s:1}, lF:{t:[104,159],s:1}, aN:[88,88], aF:[92,92], ftN:0, ftF:0 };
const SUPINE = { hip:[100,151], torso:180, neckA:180, face:-90 };
const PRONE = { hip:[90,150], torso:0, neckA:0, face:90, lN:[180,180], lF:[181,181], aN:[176,176], aF:[177,177] };
const LYING_SIDE = { view:'front', armsFront:true, rot:-90, pivot:[100,100], tx:0, ty:45, neck:[100,60], hip:[100,100],
                     eL:[86,40], hL:[84,18], eR:[113,80], hR:[113,100], kL:[93,130], fL:[93,160], kR:[107,130], fR:[107,160], hl:['legR'] };
const SIDE_PLANK = { view:'front', armsFront:true, rot:-70, pivot:[100,160], tx:50, ty:0, neck:[100,60], hip:[100,100],
                     eL:[67.3,68.5], hL:[63.5,69.9], eR:[116,80], hR:[110,98], kL:[95,130], fL:[96,160], kR:[105,130], fR:[104,160], hl:['torso'] };
const TOP_HL = { view:'top', hl:['arms'] };
const LEG_UP = { kR:[124.2,124.6], fR:[141.4,149.2] }; // top leg lifted ~35° (front-view frame)

// ---------- Mobility (same every day) ----------
const MOBILITY = [
  { id:'neck', sec:45, cues:[[.33,'Now turn to look over each shoulder'],[.66,'Chin tucks. Glide your head straight back']], name:'Neck nods, turns & chin tucks', vb:'40 64 120 102', time:'45 s', snaps:[[1,'Nod down'],[3,'Look up'],[5,'Turn'],[7,'Chin tuck']],
    keys:[ {p:KNEEL,hold:.5}, {p:{...KNEEL,neckA:-35,face:80},hold:.6}, {p:KNEEL,hold:.2}, {p:{...KNEEL,neckA:-128,face:-65},hold:.6},
           {p:KNEEL,hold:.3}, {p:{...KNEEL,ff:1},hold:.8}, {p:KNEEL,hold:.3}, {p:{...KNEEL,neckA:-112,face:6},hold:.8} ],
    steps:['Kneel or sit tall, shoulders relaxed.','Slowly nod chin to chest, then look up to the ceiling (5×).','Turn to look over each shoulder (5× per side).','Chin tucks: glide your head straight back into a "double chin", hold 2 s (5×).'],
    focus:'neck, upper back, forward-head posture' },

  { id:'catcow', sec:45, name:'Cat-cow', vb:'22 64 120 102', time:'45 s', snaps:[[1,'Cat (exhale)'],[3,'Cow (inhale)']],
    keys:[ {p:{...QUAD,hl:['spine']},hold:.2}, {p:{...QUAD,bend:30,neckA:70,face:100,hl:['spine']},hold:.8},
           {p:{...QUAD,hl:['spine']},hold:.2}, {p:{...QUAD,bend:-22,neckA:-40,face:-30,hl:['spine']},hold:.8} ],
    steps:['Hands under shoulders, knees under hips.','Exhale: round your back to the ceiling, tuck chin and tailbone.','Inhale: let the belly sink, lift chest and gaze forward.','Move one vertebra at a time, slow and smooth.'],
    focus:'whole spine, lower back' },

  { id:'thread', sides:[['left',40],['right',25]], sideText:'{s} arm', name:'Thread-the-needle', vb:'18 56 130 110', time:'Left 40 s · Right 25 s', left:true, snaps:[[1,'Open up'],[2,'Thread under']],
    keys:[ {p:{...QUAD,hl:['aN']},hold:.3}, {p:{...QUAD,aN:[-90,-90],neckA:-45,face:-70,hl:['aN']},hold:.7,move:1.4},
           {p:{...QUAD,torso:12,aF:[70,0],aN:[150,180],neckA:35,face:140,hl:['aN']},hold:1.2,move:1.4} ],
    steps:['On hands and knees, reach your left arm up to the ceiling, eyes follow the hand.','Then slide that arm under your body along the floor, palm up.','Let your left shoulder and temple rest on the mat; breathe into the upper back.','Return and repeat, or hold the end position.'],
    focus:'upper-back rotation, back of the left shoulder' },

  { id:'cars', sides:[['left',40],['right',25]], sideText:'{s} arm', cues:[[.5,'Reverse direction']], name:'Shoulder circles (CARs)', vb:'10 12 180 155', time:'Left 40 s · Right 25 s', left:true, snaps:[[0,'Start'],[2,'Forward'],[4,'Overhead'],[6,'Behind']],
    keys:[90,45,0,-45,-90,-135,-180,-225,-270].map((a,i)=>({p:{...STAND,aN:[a,a],hl:['aN']},hold:i===0?.4:0,move:i===8?0:.55,lin:true})),
    steps:['Stand tall; squeeze glutes and brace your belly so the body stays still.','With a straight arm, draw the biggest, slowest circle you can: forward, up, back, down (~10 s per circle).','Reverse direction halfway. Only the arm moves — no leaning.'],
    focus:'full shoulder range — your key drill for the stiff left shoulder' },

  { id:'child', sides:[['left',40],['right',25]], sideText:'stretch the {s} side', name:'Child’s pose with side reach', vb:'25 50 140 119', time:'Left 40 s · Right 25 s', left:true, snaps:[[0,'Sit tall'],[1,'Reach long']],
    keys:[ {p:TALL,hold:.6,move:1.6}, {p:{...TALL,torso:-4,neckA:35,face:80,aN:[-5,8],aF:[-7,7]},hold:1.6,move:1.4} ],
    steps:['Kneel, sit back on your heels, knees a bit apart.','Fold forward and reach both arms long on the mat, forehead down.','Walk both hands to the right to stretch the left side (40 s), then to the left (25 s).'],
    focus:'lats, overhead shoulder mobility, lower back' },

  { id:'wgs', sides:[['left',30],['right',30]], sideText:'{s} foot forward', name:'World’s greatest stretch', vb:'32 56 130 110', time:'30 s per side', snaps:[[0,'Lunge'],[1,'Elbow to instep'],[3,'Rotate & reach']],
    keys:[ {p:LUNGE,hold:.4}, {p:{...LUNGE,aN:[125,40]},hold:.8}, {p:LUNGE,hold:.2}, {p:{...LUNGE,aN:[-95,-95],neckA:-60,face:-80},hold:1} ],
    steps:['Long lunge: left foot forward, back leg long (or back knee down for comfort).','Both hands on the floor inside the left foot; sink the left elbow toward the instep.','Rotate open: reach the left arm to the ceiling and look at your hand.','3–5 slow reps, then switch legs.'],
    focus:'hip flexors, hamstrings, upper-back rotation' },

  { id:'hip9090', sec:45, name:'90/90 hip switches', vb:'40 70 120 102', time:'45 s', viewLabel:'front view', snaps:[[0,'Knees left'],[1,'Lift'],[2,'Knees right']],
    keys:[ {p:{...SEAT,kL:[64,150],fL:[90,160],kR:[100,154],fR:[128,156]},hold:.9,move:.8}, {p:SEAT,hold:0,move:.8},
           {p:{...SEAT,kL:[100,154],fL:[72,156],kR:[136,150],fR:[110,160]},hold:.9,move:.8}, {p:SEAT,hold:0,move:.8} ],
    steps:['Sit with hands behind you, feet wider than hips, knees bent.','Let both knees drop to one side so each knee makes a ~90° angle.','Lift and swing both knees to the other side, like windshield wipers.','Sit tall; as it gets easier, take the hands off the floor.'],
    focus:'hip rotation, lower-back relief' },

  { id:'openbook', sides:[['left',40],['right',25]], sideText:'{s} arm on top', name:'Open books', vb:'28 70 120 102', time:'Left 40 s · Right 25 s', left:true, viewLabel:'seen from above your head', snaps:[[0,'Arms stacked'],[1,'Sweep up'],[2,'Open & look']],
    keys:[ {p:BOOK,hold:.5,move:1.1}, {p:{...BOOK,shA:-125,head:[96,144],face:-90,topArm:[-95,-95]},hold:0,move:1.1},
           {p:{...BOOK,shA:-160,head:[92,146],face:-150,topArm:[-190,-188]},hold:1.2,move:1.8} ],
    steps:['Lie on your right side, knees bent 90° in front of you, arms straight ahead and stacked.','Sweep the top (left) arm up and over to the other side; your eyes follow the hand.','Let the chest open toward the ceiling while the knees stay together on the floor.','Exhale as you open, pause 2 s, return.'],
    focus:'upper-back rotation, chest, front of the left shoulder' },

  { id:'squathold', sec:45, cues:[[.5,'Reach both arms overhead']], name:'Deep squat hold & overhead reach', vb:'35 56 130 110', time:'45 s', snaps:[[0,'Elbows push knees out'],[1,'Reach overhead']],
    keys:[ {p:DSQ,hold:1,move:1.2}, {p:{...DSQ,aN:[-100,-100],aF:[-98,-98],neckA:-80,face:-15},hold:1.2,move:1.2} ],
    steps:['Feet shoulder-width, toes slightly out; sink into a deep squat with heels down.','Hands together, use the elbows to gently push the knees out; chest tall.','Reach both arms overhead for a few breaths, then return.','Heels lift? Hold a door frame or put a folded towel under the heels.'],
    focus:'ankles, hips, upright posture' },
];

// ---------- Strength exercises ----------
const STRENGTH = {
  pushup: { name:'Push-ups', vb:'30 64 128 108', snaps:[[0,'Up'],[1,'Down']],
    keys:[ {p:{...PLANK,hl:['aN','aF']},hold:.4,move:1.4}, {p:{...PLANK_DOWN,hl:['aN','aF']},hold:.2,move:.9} ],
    steps:['Hands slightly wider than shoulders, body in one straight line from head to heels.','Lower your chest toward the floor, elbows at ~45° from the body.','Push back up without letting the hips sag.'],
    prog:['Normal tempo (or from the knees)','3 s lowering','3 s lowering + 1 s pause at the bottom'],
    focus:'chest, triceps, shoulders, core' },

  ytw: { name:'Prone Y-T-W raises', vb:'5 46 190 128', mat:'top', viewLabel:'seen from above', snaps:[[0,'Y'],[1,'T'],[2,'W']],
    keys:[ {p:{...TOP_HL,armL:{t:[156.4,78],s:-1},armR:{t:[156.4,142],s:1}},hold:1,move:.8},
           {p:{...TOP_HL,armL:{t:[120,57],s:-1},armR:{t:[120,163],s:1}},hold:1,move:.8},
           {p:{...TOP_HL,armL:{t:[121.5,66.9],s:-1},armR:{t:[121.5,153.1],s:1}},hold:1,move:.8} ],
    steps:['Lie face down, forehead on a small towel, chin tucked.','Lift both arms a few cm off the floor, thumbs up: first in a Y, then a T, then a W (elbows bent, shoulder blades squeezed down and together).','Keep the neck long and the lower back relaxed — the lift comes from the upper back.'],
    prog:['2 s hold per shape','3 s hold per shape','5 s hold per shape'],
    focus:'upper back, lower trapezius, shoulder health (great for the left shoulder)' },

  shouldertaps: { name:'Plank shoulder taps', vb:'30 64 128 108', snaps:[[0,'Plank'],[1,'Tap']],
    keys:[ {p:{...PLANK,hl:['spine']},hold:.3,move:.6}, {p:{...PLANK,aN:{t:[124,121],s:1},hl:['spine']},hold:.4,move:.6},
           {p:{...PLANK,hl:['spine']},hold:.2,move:.6}, {p:{...PLANK,aF:{t:[124,121],s:1},hl:['spine']},hold:.4,move:.6} ],
    steps:['High plank: hands under shoulders, feet hip-width.','Tap one hand to the opposite shoulder, then switch.','Keep the hips still — no rocking side to side.'],
    prog:['From the knees','Full plank','Feet together (harder to stay stable)'],
    focus:'core (anti-rotation), shoulder stability' },

  bearhold: { name:'Bear hold', vb:'22 64 120 102', snaps:[[0,'Knees down'],[1,'Hover']],
    keys:[ {p:{...QUAD,aN:{t:[108,159],s:-1},aF:{t:[110,159],s:-1},lN:{t:[42,152],s:1},lF:{t:[44,152],s:1},ftN:40,ftF:40,face:30,hl:['spine']},hold:.6,move:.8},
           {p:{...QUAD,hip:[70,121],torso:-12,aN:{t:[108,155],s:-1},aF:{t:[110,155],s:-1},lN:{t:[42,152],s:1},lF:{t:[44,152],s:1},ftN:40,ftF:40,face:30,hl:['spine']},hold:1.6,move:.8} ],
    steps:['On hands and knees, toes tucked under.','Brace your belly and lift the knees 2–3 cm off the floor.','Hold with a flat back and steady breathing.'],
    prog:['Hold','Hold + lift alternate hands','Lift opposite arm and leg'],
    focus:'core, shoulders, quads' },

  squat: { name:'Squats', vb:'38 34 140 132', snaps:[[0,'Stand'],[1,'Squat']],
    keys:[ {p:{...UPRIGHT,aN:[80,80],aF:[83,83],hl:['lN','lF']},hold:.4,move:1.8},
           {p:{...UPRIGHT,hip:[72,132],torso:-55,neckA:-70,face:10,aN:[-8,-8],aF:[-6,-6],hl:['lN','lF']},hold:.4,move:1.1} ],
    steps:['Feet shoulder-width, toes slightly out.','Sit back and down as if onto a chair, arms reaching forward, chest up.','Knees track over the toes; push the floor away to stand up.'],
    prog:['Normal tempo','3 s down','Pause at the bottom + 3 s down'],
    focus:'quads, glutes, ankles' },

  splitsquat: { name:'Split squats', uni:true, sideText:'{s} leg in front', vb:'35 40 128 126', snaps:[[0,'Up'],[1,'Down']],
    keys:[ {p:{...UPRIGHT,hip:[97,108],torso:-88,neckA:-88,lN:{t:[125,159],s:1},lF:{t:[58,156],s:1},ftF:30,hl:['lN','hips']},hold:.3,move:1.6},
           {p:{...UPRIGHT,hip:[92,124],torso:-88,neckA:-88,lN:{t:[125,159],s:1},lF:{t:[58,156],s:1},ftF:30,hl:['lN','hips']},hold:.3,move:1.0} ],
    steps:['Long staggered stance, back heel lifted, torso tall.','Lower straight down until the back knee almost touches the floor.','Push through the front heel to rise.'],
    prog:['Normal','3 s down','"1½ reps" (down, halfway up, down, up)'],
    focus:'quads, glutes, hip stability' },

  glutebridge: { name:'Glute bridge', uniPhase:3, sideText:'{s} leg', vb:'25 70 135 105', snaps:[[0,'Down'],[1,'Bridge']],
    keys:[ {p:{...SUPINE,lN:{t:[128,155],s:1},lF:{t:[131,155],s:1},aN:[3,0],aF:[5,0],ftN:0,ftF:0,hl:['hips']},hold:.4,move:1.0},
           {p:{...SUPINE,hip:[94.6,130],torso:150,lN:{t:[128,155],s:1},lF:{t:[131,155],s:1},aN:[3,0],aF:[5,0],ftN:0,ftF:0,hl:['hips']},hold:1,move:1.2} ],
    steps:['Lie on your back, knees bent, feet flat and close to your hips.','Squeeze your glutes and lift the hips until knees, hips and shoulders are in line.','Lower slowly; ribs stay down, no arching of the lower back.'],
    prog:['Two legs','Two legs + 2 s hold at the top','Single leg ↔'],
    focus:'glutes, hamstrings, lower-back relief' },

  sidelegraise: { name:'Side-lying leg raise', uni:true, sideText:'{s} leg on top', vb:'5 78 180 92', viewLabel:'front view', snaps:[[0,'Down'],[1,'Lift']],
    keys:[ {p:LYING_SIDE,hold:.4,move:.9}, {p:{...LYING_SIDE,...LEG_UP},hold:.6,move:1.2} ],
    steps:['Lie on your side, head resting on the bottom arm, body in a straight line.','Lift the top leg to ~45°, toes pointing forward (not up).','Lower slowly.'],
    prog:['Normal','2 s hold at the top','Slow 3 s lowering'],
    focus:'outer hip (glute medius), pelvis & lower-back stability' },

  deadbug: { name:'Dead bug', vb:'8 72 165 98', snaps:[[0,'Start'],[1,'Extend'],[3,'Other side']],
    keys:(() => { const b = {...SUPINE,lN:[-90,0],lF:[-88,2],aN:[-90,-90],aF:[-92,-92],ftN:-80,ftF:-80,hl:['spine']};
      return [ {p:b,hold:.3,move:1.0}, {p:{...b,lN:[-8,-8],aF:[-172,-172]},hold:.7,move:1.0}, {p:b,hold:.3,move:1.0}, {p:{...b,lF:[-8,-8],aN:[-172,-172]},hold:.7,move:1.0} ]; })(),
    steps:['Lie on your back, arms up to the ceiling, knees above hips at 90°.','Press your lower back gently into the floor.','Slowly extend the opposite arm and leg, then switch sides — keep the back flat.'],
    prog:['Legs only','Opposite arm + leg','Slow: 3 s per rep'],
    focus:'deep core, lower-back protection' },

  birddog: { name:'Bird dog', vb:'0 60 165 112', snaps:[[1,'Reach'],[3,'Other side']],
    keys:[ {p:{...QUAD,hl:['spine']},hold:.3,move:1.0}, {p:{...QUAD,aN:[-5,-5],lF:[178,178],hl:['spine']},hold:1,move:1.0},
           {p:{...QUAD,hl:['spine']},hold:.3,move:1.0}, {p:{...QUAD,aF:[-5,-5],lN:[178,178],hl:['spine']},hold:1,move:1.0} ],
    steps:['On hands and knees, back flat, neck long.','Reach one arm forward and the opposite leg back until both are in line with your body.','Pause, return with control, switch sides. Don’t let the hips rotate.'],
    prog:['Alternate sides','2 s hold','5 s hold + elbow-to-knee in between'],
    focus:'core, glutes, back stability' },

  sideplank: { name:'Side plank', uni:true, sideText:'on your {s} forearm', vb:'28 56 135 114', viewLabel:'front view', snaps:[[0,'Hold'],[1,'Phase 3: top leg up']],
    keys:[ {p:SIDE_PLANK,hold:1.6,move:.8}, {p:{...SIDE_PLANK,...LEG_UP},hold:1,move:.8} ],
    steps:['Lie on your side with the elbow under the shoulder, legs stacked.','Lift the hips so your body forms a straight line from head to feet.','Hold and breathe; don’t let the hips sag.'],
    prog:['From the knees','Full','Full + top leg lifted'],
    focus:'obliques, lateral core, hip stability' },

  curlup: { name:'Curl-up (McGill)', vb:'10 76 170 96', snaps:[[0,'Down'],[1,'Curl up']],
    keys:(() => { const b = {...SUPINE,lN:[0,0],lF:{t:[128,156],s:1},aN:{t:[92,156],s:-1},aF:{t:[94,156],s:-1},ftN:-80,ftF:0,hl:['spine']};
      return [ {p:b,hold:.5,move:.8}, {p:{...b,torso:190,bend:5,neckA:194,face:-100},hold:1.2,move:.8} ]; })(),
    steps:['Lie on your back, one knee bent, one leg straight; hands under the lower back.','Brace and lift just your head and shoulders a few cm — neck stays in line, no chin to chest.','Hold, lower, repeat. Switch the bent leg halfway.'],
    prog:['5 s holds','8 s holds','10 s holds'],
    focus:'abdominals without stressing the lower back' },

  swimmers: { name:'Prone swimmers', vb:'5 46 190 128', mat:'top', viewLabel:'seen from above', snaps:[[0,'Overhead'],[1,'Out wide'],[2,'Hands to back']],
    keys:(() => { const Y = {...TOP_HL,armL:{t:[161,90.3],s:-1},armR:{t:[161,129.7],s:1}}, T = {...TOP_HL,armL:{t:[120,57],s:-1},armR:{t:[120,163],s:1}};
      return [ {p:Y,hold:.5,move:1.1}, {p:T,hold:0,move:1.1}, {p:{...TOP_HL,armL:{t:[97,103],s:-1},armR:{t:[97,117],s:1}},hold:.6,move:1.1}, {p:T,hold:0,move:1.1} ]; })(),
    steps:['Lie face down, forehead on a small towel, arms overhead.','Lift the arms a few cm and sweep them out to the sides and down to your lower back, bending the elbows at the end.','Reverse the path back overhead, keeping the hands off the floor throughout.'],
    prog:['Slow','Slower, with a pause overhead','Hands lifted higher'],
    focus:'upper back, rotator cuff, overhead shoulder mobility' },

  cobra: { name:'Prone cobra hold', vb:'18 70 150 100', snaps:[[0,'Rest'],[1,'Lift & squeeze']],
    keys:[ {p:{...PRONE,hl:['spine']},hold:.4,move:1.0}, {p:{...PRONE,torso:-14,neckA:-14,face:70,aN:[-172,-172],aF:[-171,-171],hl:['spine']},hold:1.4,move:1.0} ],
    steps:['Lie face down, arms by your sides, palms down.','Lift chest and hands off the floor, turn the thumbs out and squeeze the shoulder blades together and down.','Keep the chin tucked (look at the floor) and the glutes gently squeezed.'],
    prog:['3 s holds','5 s holds','One continuous hold'],
    focus:'upper-back extensors, posture muscles' },

  reversetabletop: { name:'Reverse tabletop', vb:'30 60 130 110', snaps:[[0,'Seated'],[1,'Table']],
    keys:(() => { const b = { hip:[90,150], torso:-115, neckA:-100, face:0, lN:{t:[130,157],s:1}, lF:{t:[133,157],s:1}, aN:{t:[60,155],s:1}, aF:{t:[62,155],s:1}, ftN:0, ftF:0, hl:['hips'] };
      return [ {p:b,hold:.5,move:1.2}, {p:{...b,hip:[100,127],torso:-161.1,neckA:-160,face:-90},hold:1.2,move:1.0} ]; })(),
    steps:['Sit with knees bent, feet flat, hands behind you with fingers pointing to your feet.','Push the hips up until knees, hips and shoulders form a flat "table".','Open the chest, hold, lower with control.'],
    prog:['3 s holds','5 s holds','+ alternate leg lifts'],
    focus:'glutes, hamstrings, upper back, chest & front-shoulder stretch' },

  slrdl: { name:'Single-leg Romanian deadlift', uni:true, sideText:'standing on your {s} leg', vb:'30 30 140 136', snaps:[[0,'Stand'],[1,'Hinge']],
    keys:[ {p:{...UPRIGHT,lF:{t:[96,154],s:1},hl:['hips','lN']},hold:.5,move:1.6},
           {p:{...UPRIGHT,hip:[98,100],torso:-5,neckA:-5,face:40,lF:{t:[38.2,105.2],s:1},aN:[90,90],aF:[92,92],ftF:90,hl:['hips','lN']},hold:.8,move:1.2} ],
    steps:['Stand on one leg with a soft knee.','Hinge at the hips: chest goes forward while the free leg reaches back — one straight line from head to heel.','Return to standing by squeezing the glute.'],
    prog:['Fingertips on a wall','Free-standing','3 s lowering'],
    focus:'hamstrings, glutes, balance, back strength' },

  lungeknee: { name:'Reverse lunge to knee drive', vb:'30 30 140 136', snaps:[[0,'Stand'],[1,'Lunge back'],[2,'Knee drive']],
    keys:[ {p:{...UPRIGHT,lF:{t:[100,159],s:1},hl:['lN','lF']},hold:.3,move:1.0},
           {p:{...UPRIGHT,hip:[72,125],torso:-88,neckA:-88,lN:{t:[102,159],s:1},lF:{t:[44,155],s:1},ftF:30,hl:['lN','lF']},hold:.4,move:1.1},
           {p:{...UPRIGHT,lF:{t:[130,129],s:1},aN:[70,-20],aF:[110,100],hl:['lN','lF']},hold:.8,move:1.0} ],
    steps:['Step one foot back and lower into a lunge, torso tall.','Push through the front foot and drive the back knee up to hip height.','Step straight back into the next lunge. Alternate legs each rep.'],
    prog:['Slow and controlled','3 s down','+ 1 s balance at the top'],
    focus:'legs, glutes, balance, hip flexors' },

  tpushup: { name:'T push-ups', vb:'30 50 130 120', snaps:[[1,'Push-up'],[3,'Rotate & reach']],
    keys:[ {p:{...PLANK,hl:['aN']},hold:.3,move:1.2}, {p:{...PLANK_DOWN,hl:['aN']},hold:.2,move:.9},
           {p:{...PLANK,hl:['aN']},hold:.2,move:1.0}, {p:{...PLANK,aN:{t:[132,71],s:-1},neckA:-40,face:-70,hl:['aN']},hold:1,move:1.0} ],
    steps:['Do one push-up.','At the top, rotate onto one hand and reach the other arm to the ceiling (side plank).','Return to plank and repeat to the other side.'],
    prog:['From the knees','Full','+ 2 s hold in the side plank'],
    focus:'chest, shoulders, rotational core' },

  inchworm: { name:'Inchworm walk-out', vb:'15 30 165 140', snaps:[[0,'Stand'],[1,'Fold'],[3,'Plank']],
    keys:(() => { const st = { hip:[42,99.5], torso:-90, neckA:-90, face:0, lN:{t:[44,159],s:1}, lF:{t:[46,159],s:1}, aN:{t:[44,100],s:-1}, aF:{t:[46,100],s:-1}, ftN:0, ftF:0, hl:['spine'] };
      const fold = {...st, hip:[46,100], torso:80, neckA:75, face:150, aN:{t:[66,155],s:-1}, aF:{t:[68,155],s:-1}};
      const half = {...st, hip:[64,104], torso:35, neckA:35, face:90, aN:{t:[108,155],s:-1}, aF:{t:[110,155],s:-1}, lN:{t:[42,156],s:1}, lF:{t:[44,156],s:1}, ftN:60, ftF:60};
      const plank = {...PLANK, hl:['spine']};
      return [ {p:st,hold:.4,move:1.1}, {p:fold,hold:.4,move:1.0}, {p:half,hold:0,move:1.0}, {p:plank,hold:.8,move:1.0}, {p:half,hold:0,move:1.0}, {p:fold,hold:.3,move:1.1} ]; })(),
    steps:['Stand tall, fold forward and place your hands on the floor (bend the knees if needed).','Walk the hands out until you reach a plank.','Walk the hands back to your feet and roll up to standing.'],
    prog:['Walk out to plank','+ 1 push-up','+ 1 push-up and shoulder taps'],
    focus:'full body, hamstrings, shoulders, core' },

  hollow: { name:'Hollow body hold', vb:'8 72 168 98', snaps:[[0,'Tuck (easier)'],[1,'Full']],
    keys:(() => { const b = {...SUPINE,torso:190,bend:4,neckA:200,face:-110,lN:[-115,0],lF:[-113,2],aN:[-15,-15],aF:[-13,-13],ftN:0,ftF:0,hl:['spine']};
      return [ {p:b,hold:1.2,move:1.2}, {p:{...b,lN:[-15,-15],lF:[-13,-13],aN:[-165,-165],aF:[-163,-163]},hold:1.2,move:1.2} ]; })(),
    steps:['Lie on your back and press the lower back into the floor.','Lift shoulders and legs slightly; reach arms forward or overhead.','Hold — if the lower back lifts, tuck the knees or raise the legs higher.'],
    prog:['Knees tucked','One leg long','Both legs long'],
    focus:'deep core, total body tension' },
};
for (const [id, ex] of Object.entries(STRENGTH)) ex.id = id;

// ---------- Cool-down ----------
const COOLDOWN = (() => {
  const b = { ...SUPINE, lN:{t:[128,155],s:1}, lF:{t:[131,155],s:1}, aN:{t:[98,140],s:-1}, aF:{t:[100,141],s:-1}, ftN:0, ftF:0, hl:['spine'] };
  return { id:'breathing', name:'Breathing reset', sec:60, vb:'25 70 135 105', snaps:[[0,'Breathe out'],[1,'Breathe in']],
    keys:[ {p:b,hold:0,move:4}, {p:{...b,bend:-5},hold:0,move:6} ],
    cues:[[.5,'Keep going. In for 4, out for 6']],
    steps:['Lie on your back, knees bent, hands on your belly.','Breathe in through the nose for 4 s and feel the belly rise.','Breathe out slowly for 6 s; let the shoulders and neck relax.'],
    focus:'calm, posture reset', search:'diaphragmatic breathing lying down physical therapist' };
})();

const SESSIONS = [
  { name:'Push & shoulder stability', ex:['pushup','ytw','shouldertaps','bearhold'] },
  { name:'Legs & glutes',             ex:['squat','splitsquat','glutebridge','sidelegraise'] },
  { name:'Core & lower back',         ex:['deadbug','birddog','sideplank','curlup'] },
  { name:'Back & posture',            ex:['swimmers','cobra','reversetabletop','slrdl'] },
  { name:'Full body',                 ex:['lungeknee','tpushup','inchworm','hollow'] },
];
