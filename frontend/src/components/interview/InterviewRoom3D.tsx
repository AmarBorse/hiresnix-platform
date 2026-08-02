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
  const mountRef     = useRef<HTMLDivElement>(null);
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef     = useRef<number>(0);
  const clockRef     = useRef(new THREE.Clock());
  const avatarRef    = useRef<THREE.Group | null>(null);
  const mouthRef     = useRef<THREE.Mesh | null>(null);
  const eyelidsRef   = useRef<THREE.Mesh[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth  || 600;
    const H = mountRef.current.clientHeight || 400;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x0d1117);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    scene.fog = new THREE.FogExp2(0x0d1117, 0.08);

    /* ── Camera — close up on avatar face ── */
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 50);
    camera.position.set(0, 1.55, 1.8);
    camera.lookAt(0, 1.4, 0);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0x223355, 2.5));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(1, 3, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4466aa, 1.5);
    fillLight.position.set(-2, 2, 1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x2244ff, 2.0);
    rimLight.position.set(0, 1, -3);
    scene.add(rimLight);

    const faceLight = new THREE.PointLight(0xffeedd, 4.0, 4);
    faceLight.position.set(0, 2.2, 1.5);
    scene.add(faceLight);

    /* ── BACKGROUND WALL ── */
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1f35 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), wallMat);
    wall.position.set(0, 1.5, -2.5);
    scene.add(wall);

    // Wall panel lines
    for (let i = -3; i <= 3; i++) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 4, 0.01),
        new THREE.MeshLambertMaterial({ color: 0x2a3050 })
      );
      line.position.set(i, 1.5, -2.49);
      scene.add(line);
    }

    /* ── FLOOR ── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshLambertMaterial({ color: 0x111520 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    /* ── DESK (simple, clean) ── */
    const deskMat = new THREE.MeshLambertMaterial({ color: 0x2d1f10 });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.06, 1.2), deskMat);
    desk.position.set(0, 0.82, 0.3);
    desk.receiveShadow = true;
    scene.add(desk);

    // Desk glow strip
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.02, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x3366ff, emissive: new THREE.Color(0x1133cc), emissiveIntensity: 3 })
    );
    strip.position.set(0, 0.86, -0.3);
    scene.add(strip);

    /* ── MONITOR (behind avatar) ── */
    const monBase = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x222233 }));
    monBase.position.set(0, 0.83, -0.55);
    scene.add(monBase);

    const monStand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x222233 }));
    monStand.position.set(0, 0.98, -0.58);
    scene.add(monStand);

    const monFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x111122 }));
    monFrame.position.set(0, 1.38, -0.65);
    scene.add(monFrame);

    const screenMat = new THREE.MeshLambertMaterial({
      color: 0x0022aa,
      emissive: new THREE.Color(0x001166),
      emissiveIntensity: 1.5,
    });
    const monScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.55), screenMat);
    monScreen.position.set(0, 1.38, -0.62);
    scene.add(monScreen);

    // "HIRESNIX" text bar on screen
    const hBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.07),
      new THREE.MeshLambertMaterial({ color: 0x3366ff, emissive: new THREE.Color(0x2255ee), emissiveIntensity: 3 })
    );
    hBar.position.set(0, 1.42, -0.61);
    scene.add(hBar);

    /* ── AVATAR GROUP ── */
    const avatar = new THREE.Group();
    avatar.position.set(0, 0.5, -0.1);
    scene.add(avatar);
    avatarRef.current = avatar;

    const skin  = new THREE.MeshLambertMaterial({ color: 0xc8956a });
    const suit  = new THREE.MeshLambertMaterial({ color: 0x1a2040 });
    const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const dark  = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const hair  = new THREE.MeshLambertMaterial({ color: 0x0d0600 });
    const blue  = new THREE.MeshLambertMaterial({ color: 0x2244cc });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.55, 12), suit);
    torso.position.set(0, 0.82, 0);
    torso.castShadow = true;
    avatar.add(torso);

    // Shirt strip
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.21), white);
    shirt.position.set(0, 0.9, 0);
    avatar.add(shirt);

    // Tie
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.015), blue);
    tie.position.set(0, 0.84, 0.21);
    avatar.add(tie);

    // Shoulders
    const sGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.38, 8);
    const ls = new THREE.Mesh(sGeo, suit); ls.rotation.z = Math.PI/2; ls.position.set(-0.32, 1.02, 0); avatar.add(ls);
    const rs = new THREE.Mesh(sGeo, suit); rs.rotation.z = Math.PI/2; rs.position.set( 0.32, 1.02, 0); avatar.add(rs);

    // Arms
    const aGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8);
    const la = new THREE.Mesh(aGeo, suit); la.position.set(-0.35, 0.72, 0.05); la.rotation.z = 0.12; avatar.add(la);
    const ra = new THREE.Mesh(aGeo, suit); ra.position.set( 0.35, 0.72, 0.05); ra.rotation.z = -0.12; avatar.add(ra);

    // Hands (resting on desk)
    const hGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const lh = new THREE.Mesh(hGeo, skin); lh.position.set(-0.38, 0.42, 0.12); avatar.add(lh);
    const rh = new THREE.Mesh(hGeo, skin); rh.position.set( 0.38, 0.42, 0.12); avatar.add(rh);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.09, 0.14, 12), skin);
    neck.position.set(0, 1.17, 0);
    avatar.add(neck);

    // HEAD — bigger, more prominent
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.195, 24, 24), skin);
    head.position.set(0, 1.405, 0);
    head.castShadow = true;
    avatar.add(head);

    // Hair top
    const hairMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hair
    );
    hairMesh.position.set(0, 1.405, 0);
    avatar.add(hairMesh);

    // Hair back/sides
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.198, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), hair);
    hairBack.position.set(0, 1.385, -0.02);
    avatar.add(hairBack);

    // Ears
    const eGeo = new THREE.SphereGeometry(0.038, 8, 8);
    const le = new THREE.Mesh(eGeo, skin); le.position.set(-0.2, 1.40, 0); le.scale.set(0.6, 0.9, 0.5); avatar.add(le);
    const re = new THREE.Mesh(eGeo, skin); re.position.set( 0.2, 1.40, 0); re.scale.set(0.6, 0.9, 0.5); avatar.add(re);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.06, 0.01, 0.015);
    const browMat = new THREE.MeshLambertMaterial({ color: 0x1a0800 });
    const lb = new THREE.Mesh(browGeo, browMat); lb.position.set(-0.068, 1.45, 0.172); avatar.add(lb);
    const rb = new THREE.Mesh(browGeo, browMat); rb.position.set( 0.068, 1.45, 0.172); avatar.add(rb);

    // Eyes (white)
    const ewGeo = new THREE.SphereGeometry(0.03, 10, 10);
    const lew = new THREE.Mesh(ewGeo, white); lew.position.set(-0.068, 1.415, 0.168); avatar.add(lew);
    const rew = new THREE.Mesh(ewGeo, white); rew.position.set( 0.068, 1.415, 0.168); avatar.add(rew);

    // Pupils
    const pGeo = new THREE.SphereGeometry(0.016, 8, 8);
    const lp = new THREE.Mesh(pGeo, dark); lp.position.set(-0.068, 1.415, 0.19); avatar.add(lp);
    const rp = new THREE.Mesh(pGeo, dark); rp.position.set( 0.068, 1.415, 0.19); avatar.add(rp);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.006, 6, 6);
    const shineMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 2 });
    const ls2 = new THREE.Mesh(shineGeo, shineMat); ls2.position.set(-0.062, 1.422, 0.2); avatar.add(ls2);
    const rs2 = new THREE.Mesh(shineGeo, shineMat); rs2.position.set( 0.074, 1.422, 0.2); avatar.add(rs2);

    // Eyelids (for blinking)
    const elidGeo = new THREE.SphereGeometry(0.032, 10, 5, 0, Math.PI*2, 0, Math.PI/2);
    const elidMat = new THREE.MeshLambertMaterial({ color: 0xc8956a });
    const llid = new THREE.Mesh(elidGeo, elidMat); llid.position.set(-0.068,1.415,0.168); llid.rotation.x=Math.PI; llid.scale.y=0; avatar.add(llid);
    const rlid = new THREE.Mesh(elidGeo, elidMat); rlid.position.set( 0.068,1.415,0.168); rlid.rotation.x=Math.PI; rlid.scale.y=0; avatar.add(rlid);
    eyelidsRef.current = [llid, rlid];

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.055, 6), skin);
    nose.rotation.x = -Math.PI/2;
    nose.position.set(0, 1.375, 0.185);
    avatar.add(nose);

    // Mouth
    const mouthMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.018, 0.01),
      new THREE.MeshLambertMaterial({ color: 0x7a2525 })
    );
    mouthMesh.position.set(0, 1.338, 0.18);
    avatar.add(mouthMesh);
    mouthRef.current = mouthMesh;

    // Cheek blush
    const blushGeo = new THREE.CircleGeometry(0.03, 8);
    const blushMat = new THREE.MeshLambertMaterial({ color: 0xd4856a, transparent: true, opacity: 0.4 });
    const lbl = new THREE.Mesh(blushGeo, blushMat); lbl.position.set(-0.135, 1.385, 0.175); lbl.rotation.y = -0.3; avatar.add(lbl);
    const rbl = new THREE.Mesh(blushGeo, blushMat); rbl.position.set( 0.135, 1.385, 0.175); rbl.rotation.y =  0.3; avatar.add(rbl);

    /* ── STATUS ORBS on desk ── */
    const orbMat = new THREE.MeshLambertMaterial({ color: 0x44ff88, emissive: new THREE.Color(0x22cc55), emissiveIntensity: 3 });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), orbMat);
    orb.position.set(0.9, 0.88, 0.0);
    scene.add(orb);

    setLoaded(true);

    /* ── ANIMATION ── */
    let blinkT = 0, blinkPhase = 0, headT = 0;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = clockRef.current.getDelta();
      const t  = clockRef.current.getElapsedTime();

      if (avatarRef.current && mouthRef.current) {
        headT += dt;

        // Head subtle movement
        if (speaking) {
          avatarRef.current.rotation.y = Math.sin(headT * 1.5) * 0.04;
          avatarRef.current.position.y = 0.5 + Math.sin(headT * 3) * 0.005;
        } else if (thinking) {
          avatarRef.current.rotation.z = Math.sin(headT * 1.2) * 0.03;
          avatarRef.current.rotation.y = Math.sin(headT * 0.8) * 0.05;
        } else {
          avatarRef.current.rotation.y = Math.sin(headT * 0.5) * 0.02;
          avatarRef.current.position.y = 0.5 + Math.sin(headT * 0.8) * 0.003;
        }

        // Mouth
        if (speaking) {
          const open = Math.abs(Math.sin(t * 10)) * 0.025;
          mouthRef.current.scale.y = 1 + open * 60;
          mouthRef.current.position.y = 1.338 - open * 0.5;
          (mouthRef.current.material as THREE.MeshLambertMaterial).color.setHex(0x991122);
        } else {
          mouthRef.current.scale.y = 1;
          mouthRef.current.position.y = 1.338;
          (mouthRef.current.material as THREE.MeshLambertMaterial).color.setHex(0x7a2525);
        }

        // Blink
        blinkT += dt;
        if (blinkPhase === 0 && blinkT > 3 + Math.random() * 2) { blinkPhase = 1; blinkT = 0; }
        if (blinkPhase === 1) {
          eyelidsRef.current.forEach(l => { l.scale.y = Math.min(l.scale.y + dt * 10, 1); });
          if (eyelidsRef.current[0]?.scale.y >= 1) blinkPhase = 2;
        }
        if (blinkPhase === 2) {
          eyelidsRef.current.forEach(l => { l.scale.y = Math.max(l.scale.y - dt * 10, 0); });
          if (eyelidsRef.current[0]?.scale.y <= 0) { blinkPhase = 0; blinkT = 0; }
        }
      }

      // Dynamic face light
      faceLight.intensity = speaking ? 4 + Math.sin(t * 8) * 0.5 : thinking ? 3 + Math.sin(t * 2) * 0.3 : 3.5;
      faceLight.color.setHex(speaking ? 0x88aaff : thinking ? 0xffcc77 : 0xffeedd);

      renderer.render(scene, camera);
    };
    animate();

    /* ── RESIZE ── */
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const stateLabel = speaking ? '🔊 Speaking...' : thinking ? '⏳ Thinking...' : listening ? '👂 Listening...' : '💤 Idle';
  const stateColor = speaking ? '#4488ff' : thinking ? '#ffaa33' : '#44cc88';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '360px', borderRadius: '14px', overflow: 'hidden', background: '#0d1117' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: '#4488ff', fontSize: '14px', fontWeight: 700 }}>
          ⚡ Loading 3D Room...
        </div>
      )}

      {/* Status */}
      <div style={{
        position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        border: `1px solid ${stateColor}50`, borderRadius: '20px', padding: '5px 14px',
        display: 'flex', alignItems: 'center', gap: '7px',
      }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: stateColor, boxShadow: `0 0 8px ${stateColor}` }} />
        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>Alex — {stateLabel}</span>
      </div>

      {/* Name tag */}
      <div style={{
        position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10,20,50,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(68,136,255,0.4)', borderRadius: '10px', padding: '5px 16px',
      }}>
        <span style={{ color: '#4488ff', fontSize: '12px', fontWeight: 800 }}>ALEX</span>
        <span style={{ color: '#475569', fontSize: '11px', marginLeft: '6px' }}>AI Interviewer · Hiresnix</span>
      </div>

      {onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px', padding: '5px 10px', color: '#94A3B8', cursor: 'pointer', fontSize: '11px',
        }}>
          ✕ Exit 3D
        </button>
      )}
    </div>
  );
}