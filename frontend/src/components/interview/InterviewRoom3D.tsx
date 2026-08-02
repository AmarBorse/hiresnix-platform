// src/components/interview/InterviewRoom3D.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
  speaking: boolean;   // AI is speaking
  thinking: boolean;   // AI is thinking
  listening: boolean;  // AI is listening to student
  onClose?: () => void;
}

export function InterviewRoom3D({ speaking, thinking, listening, onClose }: Props) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const sceneRef   = useRef<THREE.Scene | null>(null);
  const cameraRef  = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef   = useRef<number>(0);
  const avatarRef  = useRef<THREE.Group | null>(null);
  const avatarHeadRef = useRef<THREE.Mesh | null>(null);
  const mouthRef   = useRef<THREE.Mesh | null>(null);
  const eyeBlinkRef = useRef<THREE.Mesh[]>([]);
  const clockRef   = useRef(new THREE.Clock());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 12, 25);
    sceneRef.current = scene;

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 1.55, 2.8);
    camera.lookAt(0, 1.35, -1.5);
    cameraRef.current = camera;

    /* ── Lights ── */
    // Ambient
    const ambient = new THREE.AmbientLight(0x334466, 1.5);
    scene.add(ambient);

    // Main ceiling light
    const ceiling = new THREE.DirectionalLight(0xffffff, 2.0);
    ceiling.position.set(0, 5, 2);
    ceiling.castShadow = true;
    ceiling.shadow.mapSize.width = 2048;
    ceiling.shadow.mapSize.height = 2048;
    ceiling.shadow.camera.near = 0.5;
    ceiling.shadow.camera.far = 20;
    ceiling.shadow.camera.left = -6;
    ceiling.shadow.camera.right = 6;
    ceiling.shadow.camera.top = 6;
    ceiling.shadow.camera.bottom = -6;
    scene.add(ceiling);

    // Face light - directly on avatar
    const faceLight = new THREE.PointLight(0xffeedd, 3.0, 5);
    faceLight.position.set(0, 2.5, 0.5);
    scene.add(faceLight);

    // Desk lamp - warm glow
    const deskLight = new THREE.PointLight(0x6699ff, 2.5, 5);
    deskLight.position.set(0, 2.2, -0.5);
    scene.add(deskLight);

    // Rim light (behind avatar - blue accent)
    const rimLight = new THREE.PointLight(0x2244ff, 2.0, 6);
    rimLight.position.set(0, 2.5, -3);
    scene.add(rimLight);

    // Screen glow (front - blue-ish)
    const screenGlow = new THREE.PointLight(0x3366ff, 1.2, 4);
    screenGlow.position.set(0, 1.8, 1.5);
    scene.add(screenGlow);

    /* ── Materials ── */
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x111128 });
    const woodMat  = new THREE.MeshLambertMaterial({ color: 0x3d2b1f });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x88aaff, transparent: true, opacity: 0.15 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    const screenMat = new THREE.MeshLambertMaterial({ color: 0x0033aa, emissive: new THREE.Color(0x001155), emissiveIntensity: 1 });
    const chairMat = new THREE.MeshLambertMaterial({ color: 0x222244 });

    /* ── ROOM ── */
    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMat);
    backWall.position.set(0, 3, -4);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), wallMat);
    leftWall.position.set(-5, 3, -1);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), wallMat);
    rightWall.position.set(5, 3, -1);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Ceiling
    const ceiling2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshLambertMaterial({ color: 0x0f0f1e }));
    ceiling2.rotation.x = Math.PI / 2;
    ceiling2.position.set(0, 6, -1);
    scene.add(ceiling2);

    // Ceiling light panel
    const lightPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.05, 1),
      new THREE.MeshLambertMaterial({ color: 0x8899ff, emissive: new THREE.Color(0x334488), emissiveIntensity: 2 })
    );
    lightPanel.position.set(0, 5.95, 0);
    scene.add(lightPanel);

    /* ── DESK ── */
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 1.4), woodMat);
    desk.position.set(0, 0.78, -0.5);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);

    // Desk legs
    [[-1.6, -0.6], [1.6, -0.6], [-1.6, 0.15], [1.6, 0.15]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), metalMat);
      leg.position.set(x, 0.38, z);
      scene.add(leg);
    });

    // Desk surface glass
    const deskGlass = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.02, 1.3), glassMat);
    deskGlass.position.set(0, 0.82, -0.5);
    scene.add(deskGlass);

    /* ── MONITOR ── */
    const monitorStand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), metalMat);
    monitorStand.position.set(0, 1.02, -1.0);
    scene.add(monitorStand);

    const monitorBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.2), metalMat);
    monitorBase.position.set(0, 0.82, -1.0);
    scene.add(monitorBase);

    const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.06), metalMat);
    monitor.position.set(0, 1.45, -1.05);
    monitor.castShadow = true;
    scene.add(monitor);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.62), screenMat);
    screen.position.set(0, 1.45, -1.02);
    scene.add(screen);

    // Hiresnix logo on screen
    const logoGeo = new THREE.PlaneGeometry(0.4, 0.1);
    const logoMat = new THREE.MeshLambertMaterial({ color: 0x4488ff, emissive: new THREE.Color(0x2255cc), emissiveIntensity: 2 });
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.position.set(0, 1.52, -1.015);
    scene.add(logo);

    /* ── KEYBOARD ── */
    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.2), metalMat);
    keyboard.position.set(0.3, 0.83, -0.65);
    scene.add(keyboard);

    /* ── NOTEBOOK ── */
    const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 0.28),
      new THREE.MeshLambertMaterial({ color: 0x1a3a5c }));
    notebook.position.set(-1.0, 0.83, -0.6);
    notebook.rotation.y = 0.3;
    scene.add(notebook);

    /* ── COFFEE CUP ── */
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 12),
      new THREE.MeshLambertMaterial({ color: 0xdddddd }));
    cup.position.set(1.2, 0.88, -0.7);
    scene.add(cup);

    /* ── INTERVIEWER CHAIR ── */
    const chairBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), chairMat);
    chairBase.position.set(0, 0.46, -2.0);
    scene.add(chairBase);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.06), chairMat);
    chairBack.position.set(0, 1.0, -2.4);
    scene.add(chairBack);

    const chairArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.5), chairMat);
    chairArm1.position.set(-0.37, 0.72, -2.1);
    scene.add(chairArm1);

    const chairArm2 = chairArm1.clone();
    chairArm2.position.set(0.37, 0.72, -2.1);
    scene.add(chairArm2);

    // Chair wheels
    [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3], [0, 0]].forEach(([x, z]) => {
      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), metalMat);
      wheel.position.set(x, 0.05, -2.0 + z);
      scene.add(wheel);
    });

    /* ── STUDENT CHAIR (front - partial view) ── */
    const studentChair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), chairMat);
    studentChair.position.set(0, 0.46, 2.2);
    scene.add(studentChair);

    /* ── AI AVATAR ── */
    const avatar = new THREE.Group();
    avatar.position.set(0, 0.5, -1.2);
    scene.add(avatar);
    avatarRef.current = avatar;

    // Body (suit)
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.6, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a3e });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.78, 0);
    body.castShadow = true;
    avatar.add(body);

    // Shirt collar
    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.25, 0.22),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    collar.position.set(0, 0.92, 0.12);
    avatar.add(collar);

    // Tie
    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.22, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x3344cc })
    );
    tie.position.set(0, 0.85, 0.22);
    avatar.add(tie);

    // Shoulders
    const shoulderGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    const shoulder1 = new THREE.Mesh(shoulderGeo, bodyMat);
    shoulder1.rotation.z = Math.PI / 2;
    shoulder1.position.set(-0.35, 1.02, 0);
    avatar.add(shoulder1);
    const shoulder2 = shoulder1.clone();
    shoulder2.position.set(0.35, 1.02, 0);
    avatar.add(shoulder2);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.5, 8);
    const arm1 = new THREE.Mesh(armGeo, bodyMat);
    arm1.position.set(-0.38, 0.72, 0.05);
    arm1.rotation.z = 0.15;
    avatar.add(arm1);
    const arm2 = arm1.clone();
    arm2.position.set(0.38, 0.72, 0.05);
    arm2.rotation.z = -0.15;
    avatar.add(arm2);

    // Hands on desk
    const handGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd4956a });
    const hand1 = new THREE.Mesh(handGeo, skinMat);
    hand1.position.set(-0.42, 0.46, 0.1);
    avatar.add(hand1);
    const hand2 = hand1.clone();
    hand2.position.set(0.42, 0.46, 0.1);
    avatar.add(hand2);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.15, 12),
      skinMat
    );
    neck.position.set(0, 1.16, 0);
    avatar.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.38, 0);
    head.castShadow = true;
    avatar.add(head);
    avatarHeadRef.current = head;

    // Hair
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.185, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x1a0a00 })
    );
    hair.position.set(0, 1.38, 0);
    avatar.add(hair);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const eyeWhite = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const eyeBlack = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const leftEyeWhite = new THREE.Mesh(eyeGeo, eyeWhite);
    leftEyeWhite.position.set(-0.065, 1.40, 0.155);
    avatar.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(eyeGeo, eyeWhite);
    rightEyeWhite.position.set(0.065, 1.40, 0.155);
    avatar.add(rightEyeWhite);

    const pupilGeo = new THREE.SphereGeometry(0.015, 8, 8);
    const leftPupil = new THREE.Mesh(pupilGeo, eyeBlack);
    leftPupil.position.set(-0.065, 1.40, 0.175);
    avatar.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, eyeBlack);
    rightPupil.position.set(0.065, 1.40, 0.175);
    avatar.add(rightPupil);

    // Eyelids (for blinking)
    const eyelidGeo = new THREE.SphereGeometry(0.03, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    const eyelidMat = new THREE.MeshLambertMaterial({ color: 0xd4956a });

    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftEyelid.position.set(-0.065, 1.40, 0.155);
    leftEyelid.rotation.x = Math.PI;
    leftEyelid.scale.y = 0; // start open
    avatar.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightEyelid.position.set(0.065, 1.40, 0.155);
    rightEyelid.rotation.x = Math.PI;
    rightEyelid.scale.y = 0;
    avatar.add(rightEyelid);
    eyeBlinkRef.current = [leftEyelid, rightEyelid];

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.055, 0.008, 0.012);
    const browMat = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.065, 1.435, 0.165);
    avatar.add(leftBrow);
    const rightBrow = leftBrow.clone();
    rightBrow.position.set(0.065, 1.435, 0.165);
    avatar.add(rightBrow);

    // Nose
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.022, 0.06, 6),
      skinMat
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 1.36, 0.175);
    avatar.add(nose);

    // Mouth
    const mouthGeo = new THREE.BoxGeometry(0.08, 0.015, 0.01);
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0x8b3a3a });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 1.32, 0.172);
    avatar.add(mouth);
    mouthRef.current = mouth;

    // Ears
    const earGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.185, 1.38, 0);
    leftEar.scale.set(0.6, 0.8, 0.5);
    avatar.add(leftEar);
    const rightEar = leftEar.clone();
    rightEar.position.set(0.185, 1.38, 0);
    avatar.add(rightEar);

    /* ── BOOKSHELF (background) ── */
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.3), woodMat);
    shelf.position.set(-3.5, 1.2, -3.5);
    scene.add(shelf);

    // Books
    const bookColors = [0x334488, 0x883344, 0x448833, 0x884433, 0x558866];
    bookColors.forEach((color, i) => {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.4, 0.22),
        new THREE.MeshLambertMaterial({ color })
      );
      book.position.set(-3.8 + i * 0.15, 1.5, -3.5);
      scene.add(book);
    });

    /* ── PLANT ── */
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.08, 0.2, 8),
      new THREE.MeshLambertMaterial({ color: 0x884422 })
    );
    pot.position.set(3.5, 0.12, -3.0);
    scene.add(pot);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x224422 })
    );
    leaves.position.set(3.5, 0.55, -3.0);
    scene.add(leaves);

    /* ── STATUS INDICATOR (glowing orb on desk) ── */
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshLambertMaterial({ color: 0x44ff88, emissive: new THREE.Color(0x22cc66), emissiveIntensity: 2 })
    );
    orb.position.set(0.8, 0.85, -0.8);
    scene.add(orb);

    setLoaded(true);

    /* ── ANIMATION LOOP ── */
    let blinkTimer = 0;
    let blinkState = 0; // 0=open, 1=closing, 2=opening
    let headBobT = 0;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      if (avatarRef.current && avatarHeadRef.current && mouthRef.current) {
        // ── HEAD BOB ──
        headBobT += delta;
        if (speaking) {
          avatarRef.current.position.y = Math.sin(headBobT * 4) * 0.008;
          avatarHeadRef.current.rotation.z = Math.sin(headBobT * 2) * 0.02;
        } else if (thinking) {
          avatarRef.current.position.y = Math.sin(headBobT * 1.5) * 0.005;
          avatarHeadRef.current.rotation.x = 0.05; // slight downward tilt
        } else {
          avatarRef.current.position.y = Math.sin(headBobT * 0.8) * 0.003;
          avatarHeadRef.current.rotation.x = 0;
          avatarHeadRef.current.rotation.z = 0;
        }

        // ── MOUTH ANIMATION ──
        if (speaking) {
          mouthRef.current.scale.y = 1 + Math.abs(Math.sin(elapsed * 12)) * 3;
          mouthRef.current.position.y = 1.32 - Math.abs(Math.sin(elapsed * 12)) * 0.008;
          // Change mouth material color
          (mouthRef.current.material as THREE.MeshLambertMaterial).emissive.setHex(0x330000);
          (mouthRef.current.material as THREE.MeshLambertMaterial).emissiveIntensity = Math.abs(Math.sin(elapsed * 8)) * 0.5;
        } else {
          mouthRef.current.scale.y = 1;
          mouthRef.current.position.y = 1.32;
          (mouthRef.current.material as THREE.MeshLambertMaterial).emissiveIntensity = 0;
        }

        // ── BLINK ──
        blinkTimer += delta;
        if (blinkState === 0 && blinkTimer > 3 + Math.random() * 2) {
          blinkState = 1;
          blinkTimer = 0;
        }
        if (blinkState === 1) {
          eyeBlinkRef.current.forEach(lid => {
            lid.scale.y = Math.min(lid.scale.y + delta * 8, 1);
          });
          if (eyeBlinkRef.current[0]?.scale.y >= 1) blinkState = 2;
        }
        if (blinkState === 2) {
          eyeBlinkRef.current.forEach(lid => {
            lid.scale.y = Math.max(lid.scale.y - delta * 8, 0);
          });
          if (eyeBlinkRef.current[0]?.scale.y <= 0) { blinkState = 0; blinkTimer = 0; }
        }

        // ── THINKING: head tilt side to side ──
        if (thinking) {
          avatarHeadRef.current.rotation.z = Math.sin(elapsed * 1.5) * 0.06;
        }
      }

      // ── DESK LIGHT COLOR based on state ──
      if (speaking) {
        deskLight.color.setHex(0x4499ff);
        deskLight.intensity = 2 + Math.sin(elapsed * 8) * 0.5;
      } else if (thinking) {
        deskLight.color.setHex(0xffaa22);
        deskLight.intensity = 1.5 + Math.sin(elapsed * 3) * 0.3;
      } else {
        deskLight.color.setHex(0x4488ff);
        deskLight.intensity = 1.8;
      }

      // ── MONITOR SCREEN PULSE ──
      (screen.material as THREE.MeshLambertMaterial).emissiveIntensity = 0.8 + Math.sin(elapsed * 2) * 0.2;

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
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // State label
  const stateLabel = speaking ? '🔊 Speaking...' : thinking ? '⏳ Thinking...' : '👂 Listening';
  const stateColor = speaking ? '#4488ff' : thinking ? '#ffaa22' : '#44cc88';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', borderRadius: '16px', overflow: 'hidden', background: '#0a0a1a' }}>
      {/* 3D Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading overlay */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: '#4488ff', fontSize: '14px', fontWeight: 700 }}>
          ⚡ Loading 3D Interview Room...
        </div>
      )}

      {/* Status badge */}
      <div style={{
        position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        border: `1px solid ${stateColor}40`,
        borderRadius: '20px', padding: '6px 16px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stateColor, boxShadow: `0 0 6px ${stateColor}` }} />
        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>Alex — {stateLabel}</span>
      </div>

      {/* Corner label */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '12px',
        background: 'rgba(0,0,0,0.6)', borderRadius: '8px', padding: '4px 10px',
      }}>
        <span style={{ color: '#4488ff', fontSize: '11px', fontWeight: 700 }}>HIRESNIX AI</span>
        <span style={{ color: '#475569', fontSize: '10px', marginLeft: '6px' }}>3D Interview Room</span>
      </div>

      {/* Close button */}
      {onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', padding: '6px 12px', color: '#94A3B8', cursor: 'pointer', fontSize: '12px',
        }}>
          ✕ Exit 3D
        </button>
      )}
    </div>
  );
}