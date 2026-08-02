// src/components/interview/InterviewRoom3D.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  speaking: boolean;
  thinking: boolean;
  listening: boolean;
  onClose?: () => void;
}

export function InterviewRoom3D({ speaking, thinking, listening, onClose }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const rendRef   = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef  = useRef<number>(0);
  const clockRef  = useRef(new THREE.Clock());
  const stateRef  = useRef({ speaking, thinking, listening });
  const [loaded, setLoaded] = useState(false);

  // Keep state ref updated
  useEffect(() => { stateRef.current = { speaking, thinking, listening }; }, [speaking, thinking, listening]);

  useEffect(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth  || 700;
    const H = mountRef.current.clientHeight || 450;

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x060a14);
    mountRef.current.appendChild(renderer.domElement);
    rendRef.current = renderer;

    /* ── SCENE ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);
    scene.fog = new THREE.Fog(0x060a14, 8, 18);

    /* ── CAMERA — eye level, slight angle ── */
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 30);
    camera.position.set(0, 1.62, 2.2);
    camera.lookAt(0, 1.45, -0.5);

    /* ════════════════════════════════════════
       LIGHTS
    ════════════════════════════════════════ */
    // Soft ambient
    scene.add(new THREE.AmbientLight(0x1a2a4a, 2.0));

    // Key light (front-top)
    const key = new THREE.SpotLight(0xfff5ee, 4.0, 8, Math.PI/4, 0.4);
    key.position.set(0.5, 4, 2.5);
    key.target.position.set(0, 1.4, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024,1024);
    scene.add(key); scene.add(key.target);

    // Fill light (left)
    const fill = new THREE.DirectionalLight(0x4466aa, 1.8);
    fill.position.set(-3, 2, 1);
    scene.add(fill);

    // Rim light (behind avatar — blue)
    const rim = new THREE.SpotLight(0x2255ff, 3.0, 6, Math.PI/3, 0.5);
    rim.position.set(0, 2.5, -2.5);
    rim.target.position.set(0, 1.4, 0);
    scene.add(rim); scene.add(rim.target);

    // Dynamic face light
    const faceLight = new THREE.PointLight(0xffeedd, 3.5, 3.5);
    faceLight.position.set(0, 2.0, 1.2);
    scene.add(faceLight);

    // Monitor screen glow
    const screenGlow = new THREE.PointLight(0x2244ff, 2.0, 3);
    screenGlow.position.set(0, 1.5, -0.8);
    scene.add(screenGlow);

    // Desk LED strip glow
    const deskGlow = new THREE.PointLight(0x3366ff, 1.5, 2);
    deskGlow.position.set(0, 0.95, 0.2);
    scene.add(deskGlow);

    /* ════════════════════════════════════════
       MATERIALS
    ════════════════════════════════════════ */
    const M = (color: number, emissive = 0x000000, ei = 0) =>
      new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(emissive), emissiveIntensity: ei, roughness: 0.7, metalness: 0.1 });

    const mSkin   = M(0xc89060);
    const mSuit   = M(0x0d1530);
    const mShirt  = M(0xf0f4ff);
    const mTie    = M(0x1133cc);
    const mHair   = M(0x0a0500);
    const mDark   = M(0x080808);
    const mEyeW   = M(0xffffff);
    const mLip    = M(0x883333);
    const mWall   = M(0x0f1428);
    const mWallAc = M(0x161e38);
    const mFloor  = M(0x090d18);
    const mDesk   = M(0x1a0e06);
    const mMetal  = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.2, metalness: 0.9 });
    const mScreen = M(0x001888, 0x001166, 2.0);
    const mGlass  = new THREE.MeshStandardMaterial({ color: 0x88aaff, transparent: true, opacity: 0.12, roughness: 0, metalness: 0.5 });
    const mLed    = M(0x3366ff, 0x2255ff, 4.0);
    const mGlowG  = M(0x44ff88, 0x22cc55, 3.0);

    /* ════════════════════════════════════════
       ROOM
    ════════════════════════════════════════ */
    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), mWall);
    backWall.position.set(0, 2.5, -3.5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Wall panels (vertical strips for depth)
    for (let i = -3; i <= 3; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.04), i%2===0 ? mWall : mWallAc);
      panel.position.set(i * 1.2, 2.2, -3.46);
      scene.add(panel);
    }

    // Wall top border glow
    const wallGlow = new THREE.Mesh(new THREE.BoxGeometry(8, 0.04, 0.04), mLed);
    wallGlow.position.set(0, 4.3, -3.44);
    scene.add(wallGlow);

    // Side walls
    const lWall = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), mWall);
    lWall.rotation.y = Math.PI/2; lWall.position.set(-4, 2.5, -0.5);
    scene.add(lWall);
    const rWall = lWall.clone();
    rWall.rotation.y = -Math.PI/2; rWall.position.set(4, 2.5, -0.5);
    scene.add(rWall);

    // Floor with slight reflection
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8),
      new THREE.MeshStandardMaterial({ color: 0x0a0d18, roughness: 0.1, metalness: 0.3 }));
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), mWall);
    ceiling.rotation.x = Math.PI/2; ceiling.position.set(0, 5, -0.5);
    scene.add(ceiling);

    // Ceiling light panel
    const cPanel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x8899ff, emissive: new THREE.Color(0x4455cc), emissiveIntensity: 3 }));
    cPanel.position.set(0, 4.98, 0.5);
    scene.add(cPanel);

    // Ceiling light glow
    const cGlow = new THREE.PointLight(0x8899ff, 2.0, 5);
    cGlow.position.set(0, 4.9, 0.5);
    scene.add(cGlow);

    /* ════════════════════════════════════════
       DESK
    ════════════════════════════════════════ */
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.07, 1.3), mDesk);
    desk.position.set(0, 0.85, 0.1);
    desk.castShadow = true; desk.receiveShadow = true;
    scene.add(desk);

    // Glass top
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.18, 0.02, 1.28), mGlass);
    deskTop.position.set(0, 0.89, 0.1);
    scene.add(deskTop);

    // LED strip under desk edge
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.015, 0.015), mLed);
    ledStrip.position.set(0, 0.82, 0.74);
    scene.add(ledStrip);

    // Desk legs (metal)
    [[-1.45,-0.5],[1.45,-0.5],[-1.45,0.65],[1.45,0.65]].forEach(([x,z])=>{
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.88,0.05), mMetal);
      leg.position.set(x, 0.43, z); scene.add(leg);
    });

    /* ── MONITOR ── */
    const monBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.15,0.03,12), mMetal);
    monBase.position.set(0, 0.87, -0.45); scene.add(monBase);
    const monStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.32,8), mMetal);
    monStem.position.set(0, 1.04, -0.48); scene.add(monStem);
    const monFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 0.055), mMetal);
    monFrame.position.set(0, 1.42, -0.6); scene.add(monFrame);
    const monScr = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.68), mScreen);
    monScr.position.set(0, 1.42, -0.57); scene.add(monScr);

    // Hiresnix UI on screen
    [-0.35,-0.1,0.15,0.38].forEach((x,i) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04+i*0.03, 0.005),
        new THREE.MeshStandardMaterial({ color: 0x2255ff, emissive: new THREE.Color(0x1133cc), emissiveIntensity: 2 }));
      bar.position.set(x, 1.35, -0.54); scene.add(bar);
    });
    const hTag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.005),
      new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: new THREE.Color(0x2266dd), emissiveIntensity: 3 }));
    hTag.position.set(0, 1.52, -0.54); scene.add(hTag);

    /* ── KEYBOARD ── */
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.018, 0.18), mMetal);
    kb.position.set(0.5, 0.89, 0.18); scene.add(kb);
    for(let r=0;r<3;r++) for(let c=0;c<8;c++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.012,0.04),
        new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.3 }));
      key.position.set(0.5+c*0.065-0.22, 0.905, 0.18+r*0.055-0.06); scene.add(key);
    }

    /* ── COFFEE MUG ── */
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.038,0.032,0.09,14),
      new THREE.MeshStandardMaterial({ color: 0xddddee, roughness: 0.3 }));
    mug.position.set(-1.1, 0.935, 0.05); scene.add(mug);
    const mugHdl = new THREE.Mesh(new THREE.TorusGeometry(0.025,0.008,6,10,Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xddddee }));
    mugHdl.rotation.y = Math.PI/2; mugHdl.position.set(-1.14,0.935,0.05); scene.add(mugHdl);

    /* ── NOTEBOOK ── */
    const nb = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.01,0.22),
      new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.8 }));
    nb.position.set(-0.75, 0.895, 0.12); nb.rotation.y = 0.25; scene.add(nb);

    /* ── STATUS ORB ── */
    const orbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.022,12,12), mGlowG);
    orbMesh.position.set(1.0, 0.91, 0.0); scene.add(orbMesh);

    /* ── BOOKSHELF (left bg) ── */
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.8, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x1a0e06, roughness: 0.9 }));
    shelf.position.set(-3.7, 1.3, -2.0); scene.add(shelf);
    [[0x334488,1.1],[0x883322,0.95],[0x228855,1.05],[0x885522,0.9],[0x443388,1.0]].forEach(([c,h],i)=>{
      const bk = new THREE.Mesh(new THREE.BoxGeometry(0.06,h as number,0.18),
        new THREE.MeshStandardMaterial({ color: c as number, roughness: 0.9 }));
      bk.position.set(-3.58, 0.82+(h as number)/2, -1.72+i*0.2); scene.add(bk);
    });

    /* ── PLANT (right bg) ── */
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.08,0.22,10),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }));
    pot.position.set(3.2, 0.22, -2.8); scene.add(pot);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.28,10,10),
      new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.9 }));
    plant.position.set(3.2, 0.65, -2.8); plant.scale.y = 1.3; scene.add(plant);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.35,6),
      new THREE.MeshStandardMaterial({ color: 0x2d5a1a }));
    stem.position.set(3.2, 0.43, -2.8); scene.add(stem);

    /* ════════════════════════════════════════
       AVATAR — ALEX
    ════════════════════════════════════════ */
    const alex = new THREE.Group();
    alex.position.set(0, 0.46, -0.08);
    scene.add(alex);

    // === BODY ===
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.23,0.58,14), mSuit);
    torso.position.set(0,0.88,0); torso.castShadow=true; alex.add(torso);

    // Chest shirt
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.28,0.2), mShirt);
    chest.position.set(0,0.96,0.1); alex.add(chest);

    // Tie
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.038,0.24,0.012), mTie);
    tie.position.set(0,0.9,0.2); alex.add(tie);
    const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.048,0.04,0.018),mTie);
    tieKnot.position.set(0,1.02,0.2); alex.add(tieKnot);

    // Suit lapels
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.2,0.015), mSuit);
    lapelL.position.set(-0.07,0.98,0.195); lapelL.rotation.z=0.3; alex.add(lapelL);
    const lapelR = lapelL.clone(); lapelR.position.set(0.07,0.98,0.195); lapelR.rotation.z=-0.3; alex.add(lapelR);

    // Shoulders
    const shGeo = new THREE.CylinderGeometry(0.075,0.075,0.38,10);
    const lsh = new THREE.Mesh(shGeo,mSuit); lsh.rotation.z=Math.PI/2; lsh.position.set(-0.3,1.06,0); lsh.castShadow=true; alex.add(lsh);
    const rsh = lsh.clone(); rsh.position.set(0.3,1.06,0); alex.add(rsh);

    // Upper arms
    const uaGeo = new THREE.CylinderGeometry(0.055,0.05,0.38,10);
    const lua = new THREE.Mesh(uaGeo,mSuit); lua.position.set(-0.36,0.78,0.03); lua.rotation.z=0.1; lua.castShadow=true; alex.add(lua);
    const rua = lua.clone(); rua.position.set(0.36,0.78,0.03); rua.rotation.z=-0.1; alex.add(rua);

    // Forearms (on desk)
    const faGeo = new THREE.CylinderGeometry(0.045,0.045,0.28,10);
    const lfa = new THREE.Mesh(faGeo,mSuit); lfa.position.set(-0.38,0.54,0.1); lfa.rotation.x=0.4; alex.add(lfa);
    const rfa = lfa.clone(); rfa.position.set(0.38,0.54,0.1); alex.add(rfa);

    // Hands
    const hGeo = new THREE.SphereGeometry(0.062,10,10);
    const lh = new THREE.Mesh(hGeo,mSkin); lh.position.set(-0.38,0.41,0.18); lh.scale.set(1.1,0.85,1.2); alex.add(lh);
    const rh = lh.clone(); rh.position.set(0.38,0.41,0.18); alex.add(rh);

    // === NECK ===
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.095,0.15,14), mSkin);
    neck.position.set(0,1.22,0); alex.add(neck);

    // === HEAD ===
    const headG = new THREE.Group();
    headG.position.set(0,0,0);
    alex.add(headG);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.205,24,24), mSkin);
    head.position.set(0,1.45,0); head.castShadow=true;
    head.scale.set(1,1.08,0.96);
    headG.add(head);

    // Jaw
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.175,16,12), mSkin);
    jaw.position.set(0,1.31,0.02); jaw.scale.set(0.9,0.65,0.88);
    headG.add(jaw);

    // Hair
    const hairTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.21,16,8,0,Math.PI*2,0,Math.PI*0.5), mHair);
    hairTop.position.set(0,1.45,0); headG.add(hairTop);
    const hairSide = new THREE.Mesh(
      new THREE.SphereGeometry(0.208,12,8,0,Math.PI*2,0,Math.PI*0.62), mHair);
    hairSide.position.set(0,1.43,-0.01); headG.add(hairSide);

    // Sideburns
    [[-1,1],[1,-1]].forEach(([sx]) => {
      const sb = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.12,0.04), mHair);
      sb.position.set(sx*0.195,1.36,0.02); headG.add(sb);
    });

    // Ears
    const earG = new THREE.SphereGeometry(0.04,8,8);
    const le = new THREE.Mesh(earG,mSkin); le.position.set(-0.21,1.44,0.02); le.scale.set(0.6,0.85,0.45); headG.add(le);
    const re = le.clone(); re.position.set(0.21,1.44,0.02); headG.add(re);

    // Eyebrows
    const browG = new THREE.BoxGeometry(0.075,0.013,0.018);
    const browM = new THREE.MeshStandardMaterial({ color: 0x1a0800, roughness: 1 });
    const lbr = new THREE.Mesh(browG,browM); lbr.position.set(-0.072,1.495,0.18); lbr.rotation.z=0.08; headG.add(lbr);
    const rbr = lbr.clone(); rbr.position.set(0.072,1.495,0.18); rbr.rotation.z=-0.08; headG.add(rbr);

    // Eye sockets (dark shadow)
    const sockG = new THREE.SphereGeometry(0.038,8,8);
    const sockM = new THREE.MeshStandardMaterial({ color: 0xaa7755, roughness: 1 });
    const lsk = new THREE.Mesh(sockG,sockM); lsk.position.set(-0.072,1.46,0.177); lsk.scale.set(1.1,0.9,0.5); headG.add(lsk);
    const rsk = lsk.clone(); rsk.position.set(0.072,1.46,0.177); headG.add(rsk);

    // Eyes white
    const ewG = new THREE.SphereGeometry(0.033,12,12);
    const lew = new THREE.Mesh(ewG,mEyeW); lew.position.set(-0.072,1.462,0.182); headG.add(lew);
    const rew = lew.clone(); rew.position.set(0.072,1.462,0.182); headG.add(rew);

    // Iris
    const irisG = new THREE.SphereGeometry(0.022,10,10);
    const irisM = new THREE.MeshStandardMaterial({ color: 0x3d1f00, roughness: 0.3 });
    const li = new THREE.Mesh(irisG,irisM); li.position.set(-0.072,1.462,0.2); headG.add(li);
    const ri = li.clone(); ri.position.set(0.072,1.462,0.2); headG.add(ri);

    // Pupil
    const pupG = new THREE.SphereGeometry(0.013,8,8);
    const lpu = new THREE.Mesh(pupG,mDark); lpu.position.set(-0.072,1.462,0.208); headG.add(lpu);
    const rpu = lpu.clone(); rpu.position.set(0.072,1.462,0.208); headG.add(rpu);

    // Eye shine
    const shG = new THREE.SphereGeometry(0.006,6,6);
    const shM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 3 });
    const lsh2 = new THREE.Mesh(shG,shM); lsh2.position.set(-0.062,1.47,0.212); headG.add(lsh2);
    const rsh2 = lsh2.clone(); rsh2.position.set(0.082,1.47,0.212); headG.add(rsh2);

    // Eyelids
    const elidG = new THREE.SphereGeometry(0.036,12,6,0,Math.PI*2,0,Math.PI/2);
    const elidM = new THREE.MeshStandardMaterial({ color: 0xb87048, roughness: 0.8 });
    const llid = new THREE.Mesh(elidG,elidM); llid.position.set(-0.072,1.462,0.182); llid.rotation.x=Math.PI; llid.scale.y=0.0; headG.add(llid);
    const rlid = llid.clone(); rlid.position.set(0.072,1.462,0.182); rlid.scale.y=0.0; headG.add(rlid);

    // Nose bridge
    const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.06,0.02),mSkin);
    noseBridge.position.set(0,1.445,0.192); headG.add(noseBridge);
    // Nose tip
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.03,8,8),mSkin);
    noseTip.position.set(0,1.415,0.2); noseTip.scale.set(1.1,0.85,1); headG.add(noseTip);
    // Nostrils
    const nostG = new THREE.SphereGeometry(0.012,6,6);
    const nostM = new THREE.MeshStandardMaterial({ color: 0xaa7755, roughness: 1 });
    const lno = new THREE.Mesh(nostG,nostM); lno.position.set(-0.022,1.41,0.205); lno.scale.set(0.7,0.5,0.7); headG.add(lno);
    const rno = lno.clone(); rno.position.set(0.022,1.41,0.205); headG.add(rno);

    // Upper lip
    const ulip = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.022,0.015),
      new THREE.MeshStandardMaterial({ color: 0xaa7055, roughness: 0.8 }));
    ulip.position.set(0,1.383,0.196); headG.add(ulip);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.088,0.02,0.012),mLip);
    mouth.position.set(0,1.365,0.196);
    headG.add(mouth);
    mouthRef.current = mouth; // tracked for animation

    // Lower lip
    const llip = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.025,0.018),
      new THREE.MeshStandardMaterial({ color: 0xbb7755, roughness: 0.8 }));
    llip.position.set(0,1.348,0.194); headG.add(llip);

    // Cheeks blush
    const blushG = new THREE.CircleGeometry(0.038,10);
    const blushM = new THREE.MeshStandardMaterial({ color: 0xdd8866, transparent:true, opacity:0.35, roughness:1 });
    const lbl = new THREE.Mesh(blushG,blushM); lbl.position.set(-0.145,1.43,0.185); lbl.rotation.y=-0.2; headG.add(lbl);
    const rbl = lbl.clone(); rbl.position.set(0.145,1.43,0.185); rbl.rotation.y=0.2; headG.add(rbl);

    // Chin
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.065,8,8), mSkin);
    chin.position.set(0,1.3,0.1); chin.scale.set(0.9,0.55,0.85); headG.add(chin);

    // Store refs for animation
    const mouthMeshRef = mouth;
    const eyelidRefs = [llid, rlid];
    const headGroupRef = headG;

    /* ════════════════════════════════════════
       ANIMATION LOOP
    ════════════════════════════════════════ */
    let blinkT=0, blinkPhase=0, headT=0;
    let breathT=0;
    const alexBaseY = alex.position.y;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = clockRef.current.getDelta();
      const t  = clockRef.current.getElapsedTime();
      const { speaking: sp, thinking: th } = stateRef.current;

      headT += dt;
      breathT += dt;

      // === BREATHING ===
      alex.position.y = alexBaseY + Math.sin(breathT * 1.2) * 0.004;
      torso.scale.x = 1 + Math.sin(breathT * 1.2) * 0.008;

      // === HEAD MOVEMENT ===
      if (sp) {
        headGroupRef.rotation.y = Math.sin(headT * 1.8) * 0.055;
        headGroupRef.rotation.z = Math.sin(headT * 2.2) * 0.025;
        headGroupRef.position.y = Math.sin(headT * 3.5) * 0.004;
      } else if (th) {
        headGroupRef.rotation.y = Math.sin(headT * 0.9) * 0.08;
        headGroupRef.rotation.x = 0.04 + Math.sin(headT * 1.1) * 0.02;
        headGroupRef.rotation.z = Math.sin(headT * 1.3) * 0.04;
      } else {
        headGroupRef.rotation.y = Math.sin(headT * 0.4) * 0.025;
        headGroupRef.rotation.x = Math.sin(headT * 0.3) * 0.01;
        headGroupRef.rotation.z *= 0.95;
      }

      // === MOUTH ANIMATION ===
      if (sp) {
        const open = Math.abs(Math.sin(t * 9 + Math.sin(t*5)*0.5)) * 0.032;
        mouthMeshRef.scale.y = 1 + open * 55;
        mouthMeshRef.position.y = 1.365 - open * 0.4;
        (mouthMeshRef.material as THREE.MeshStandardMaterial).color.setHex(0x661111);
        (mouthMeshRef.material as THREE.MeshStandardMaterial).emissive.setHex(0x220000);
        (mouthMeshRef.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      } else {
        mouthMeshRef.scale.y = 1;
        mouthMeshRef.position.y = 1.365;
        (mouthMeshRef.material as THREE.MeshStandardMaterial).color.setHex(0x883333);
        (mouthMeshRef.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      }

      // === BLINK ===
      blinkT += dt;
      if (blinkPhase===0 && blinkT > 2.5+Math.random()*3.5) { blinkPhase=1; blinkT=0; }
      if (blinkPhase===1) {
        eyelidRefs.forEach(l => { l.scale.y = Math.min(l.scale.y+dt*12,1); });
        if (eyelidRefs[0].scale.y>=1) blinkPhase=2;
      }
      if (blinkPhase===2) {
        eyelidRefs.forEach(l => { l.scale.y = Math.max(l.scale.y-dt*12,0); });
        if (eyelidRefs[0].scale.y<=0) { blinkPhase=0; blinkT=0; }
      }

      // === DYNAMIC LIGHTS ===
      faceLight.intensity = sp ? 3.5+Math.sin(t*8)*0.4 : th ? 2.8+Math.sin(t*2)*0.3 : 3.2+Math.sin(t*0.5)*0.2;
      faceLight.color.setHex(sp ? 0xaabbff : th ? 0xffcc77 : 0xffeedd);
      key.intensity = sp ? 4.5 : th ? 3.0 : 3.8;
      screenGlow.intensity = 1.5+Math.sin(t*1.5)*0.3;

      renderer.render(scene, camera);
    };
    animate();

    /* ── RESIZE ── */
    const onResize = () => {
      if (!mountRef.current) return;
      const w=mountRef.current.clientWidth, h=mountRef.current.clientHeight;
      camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
    };
    window.addEventListener('resize', onResize);
    setLoaded(true);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement))
        mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const sp=speaking, th=thinking;
  const stateLabel = sp ? '🔊 Speaking...' : th ? '⏳ Thinking...' : listening ? '👂 Listening...' : '💤 Ready';
  const stateColor = sp ? '#4488ff' : th ? '#ffaa33' : '#44cc88';

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', minHeight:'380px', borderRadius:'16px', overflow:'hidden', background:'#060a14' }}>
      <div ref={mountRef} style={{ width:'100%', height:'100%' }} />

      {!loaded && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#060a14', gap:'12px' }}>
          <div style={{ width:'40px', height:'40px', border:'3px solid #4488ff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <span style={{ color:'#4488ff', fontSize:'13px', fontWeight:700 }}>Loading 3D Interview Room...</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Top status bar */}
      <div style={{
        position:'absolute', top:'10px', left:'50%', transform:'translateX(-50%)',
        background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)',
        border:`1px solid ${stateColor}40`, borderRadius:'20px', padding:'5px 16px',
        display:'flex', alignItems:'center', gap:'8px', whiteSpace:'nowrap',
      }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:stateColor, boxShadow:`0 0 8px ${stateColor}`, animation: sp ? 'pulse 0.5s ease infinite alternate' : 'none' }} />
        <span style={{ color:'#fff', fontSize:'12px', fontWeight:700 }}>Alex — {stateLabel}</span>
        <style>{`@keyframes pulse{to{opacity:0.4}}`}</style>
      </div>

      {/* Name plate */}
      <div style={{
        position:'absolute', bottom:'12px', left:'50%', transform:'translateX(-50%)',
        background:'rgba(6,15,35,0.9)', backdropFilter:'blur(10px)',
        border:'1px solid rgba(68,136,255,0.4)', borderRadius:'10px', padding:'6px 18px',
        display:'flex', alignItems:'center', gap:'8px',
      }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#44cc88', boxShadow:'0 0 6px #44cc88' }} />
        <span style={{ color:'#4488ff', fontSize:'13px', fontWeight:900, letterSpacing:1 }}>ALEX</span>
        <span style={{ color:'#475569', fontSize:'11px' }}>AI Interviewer · Hiresnix</span>
      </div>

      {onClose && (
        <button onClick={onClose} style={{
          position:'absolute', top:'10px', right:'10px',
          background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)',
          borderRadius:'8px', padding:'5px 12px', color:'#94A3B8', cursor:'pointer', fontSize:'11px', fontWeight:600,
        }}>✕ 2D View</button>