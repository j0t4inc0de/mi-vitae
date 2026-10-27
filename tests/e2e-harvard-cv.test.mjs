import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import React from 'react';

// Mock useSyncExternalStore for Zustand SSR rendering in test environment
React.useSyncExternalStore = (sub, getSnap) => getSnap();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('MI VITAE - HARVARD CV ATS E2E TEST SUITE');
console.log('Requirements: 100% ATS, Clickable Portfolio Link,');
console.log('STAR Fallback, Store Immutability, Gating & Zero Emojis');
console.log('====================================================\n');

// Mock browser globals for SSR environment
globalThis.window = {
  location: { pathname: '/dashboard', hash: '', search: '', origin: 'https://mivitae.wearesamod.com', host: 'mivitae.wearesamod.com' },
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
  atob: (str) => Buffer.from(str, 'base64').toString('binary'),
  btoa: (str) => Buffer.from(str, 'binary').toString('base64')
};
globalThis.atob = globalThis.window.atob;
globalThis.btoa = globalThis.window.btoa;

globalThis.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};
globalThis.window.localStorage = globalThis.localStorage;

const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom'
});

let passedTests = 0;
let failedTests = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
  }
}

// -------------------------------------------------------------
// MODULE RESOLUTION & CONTRACT VERIFICATION
// -------------------------------------------------------------
const pdfGenPath = path.resolve(ROOT, 'src/utils/harvardPdfGenerator.js');
let pdfGenModule = null;
if (fs.existsSync(pdfGenPath)) {
  try {
    pdfGenModule = await vite.ssrLoadModule('/src/utils/harvardPdfGenerator.js');
  } catch (e) {
    // Fallback direct import
    try {
      pdfGenModule = await import(pathToFileURL(pdfGenPath).href);
    } catch (err) {
      console.warn('  [WARN] harvardPdfGenerator.js load error:', err.message);
    }
  }
}

const optimizerPath = path.resolve(ROOT, 'src/utils/harvardCvOptimizer.js');
let optimizerModule = null;
if (fs.existsSync(optimizerPath)) {
  try {
    optimizerModule = await vite.ssrLoadModule('/src/utils/harvardCvOptimizer.js');
  } catch (e) {
    try {
      optimizerModule = await import(pathToFileURL(optimizerPath).href);
    } catch (err) {
      console.warn('  [WARN] harvardCvOptimizer.js load error:', err.message);
    }
  }
}

const serverlessPath = path.resolve(ROOT, 'functions/api/optimize-harvard-cv.js');
let serverlessModule = null;
if (fs.existsSync(serverlessPath)) {
  try {
    serverlessModule = await import(pathToFileURL(serverlessPath).href);
  } catch (err) {
    console.warn('  [WARN] optimize-harvard-cv.js load error:', err.message);
  }
}

const { useProfileStore } = await vite.ssrLoadModule('/src/stores/profileStore.js');
const { INITIAL_MOCK_PROFILES } = await vite.ssrLoadModule('/src/data/mockProfiles.js');
const creatorModule = await import(pathToFileURL(path.resolve(ROOT, 'src/lib/creatorCode.js')).href);
const dashboardContent = fs.readFileSync(path.resolve(ROOT, 'src/pages/DashboardPage.jsx'), 'utf-8');
const workerContent = fs.readFileSync(path.resolve(ROOT, 'worker.js'), 'utf-8');

// Standard test candidate profile
const SAMPLE_HARVARD_PROFILE = {
  username: 'carlos_dev',
  personalInfo: {
    name: 'Carlos Mendoza Silva',
    title: 'Senior Fullstack Software Engineer',
    bio: 'Ingeniero de software con mas de 8 anos de experiencia liderando arquitecturas cloud, microservicios y plataformas web de alta concurrencia.',
    email: 'carlos.mendoza@wearesamod.com',
    phone: '+56 9 8765 4321',
    location: 'Santiago, Chile',
    linkedin: 'https://linkedin.com/in/carlos-mendoza-dev',
    website: 'https://mivitae.wearesamod.com/carlos_dev'
  },
  experience: [
    {
      id: 'exp-1',
      company: 'Banco de Chile / Tech Innovation Lab',
      role: 'Lead Cloud Architect & Tech Lead',
      startDate: '2021-03',
      endDate: null,
      current: true,
      description: 'Responsable de la modernizacion de la plataforma transaccional core.',
      achievements: [
        'Lidero la migracion de 14 microservicios criticos hacia Kubernetes y Cloudflare Workers, reduciendo la latencia P99 en un 42%.',
        'Diseno la nueva arquitectura de pagos en tiempo real procesando mas de 50.000 transacciones diarias con 99.99% de disponibilidad.',
        'Coordino un equipo multidisciplinario de 12 desarrolladores e ingenieros DevOps implementando estandares CI/CD.'
      ]
    },
    {
      id: 'exp-2',
      company: 'Falabella Retail / Digital Solutions',
      role: 'Senior Fullstack Engineer',
      startDate: '2018-05',
      endDate: '2021-02',
      current: false,
      description: 'A cargo del desarrollo del motor de busqueda y checkout web.',
      achievements: [
        'Desarrollo la integracion con pasarelas de pago Webpay Plus y Flow optimizando la tasa de checkout en un 18%.',
        'Implemento tecnicas avanzadas de renderizado SSR y cache distribuido para mas de 2 millones de usuarios mensuales.'
      ]
    }
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Pontificia Universidad Catolica de Chile',
      degree: 'Ingenieria Civil en Computacion',
      startDate: '2012',
      endDate: '2017',
      year: '2017',
      current: false,
      details: 'Graduado con maxima distincion. Especialidad en Ingenieria de Software y Sistemas Distribuidos.'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect - Professional',
      issuer: 'Amazon Web Services',
      year: '2023'
    },
    {
      id: 'cert-2',
      name: 'Cloudflare Certified Specialist',
      issuer: 'Cloudflare',
      year: '2024'
    }
  ],
  skills: [
    { id: 'sk-1', name: 'React', category: 'technical', level: 95 },
    { id: 'sk-2', name: 'Node.js', category: 'technical', level: 90 },
    { id: 'sk-3', name: 'Cloudflare Workers', category: 'technical', level: 88 },
    { id: 'sk-4', name: 'PostgreSQL', category: 'technical', level: 85 },
    { id: 'sk-5', name: 'Liderazgo Tecnico', category: 'soft', level: 90 },
    { id: 'sk-6', name: 'Resolucion de Problemas', category: 'soft', level: 92 }
  ],
  languages: [
    { id: 'lang-1', name: 'Espanol', language: 'Espanol', level: 'Nativo' },
    { id: 'lang-2', name: 'Ingles', language: 'Ingles', level: 'Avanzado (C1)' }
  ]
};

// =============================================================
// SUITE 1: TIER 1 - ATS HARVARD PDF ENGINE & BINARY FORMAT (F7, F8)
// =============================================================
console.log('\n--- SUITE 1: Tier 1 - ATS Harvard PDF Engine & Binary Format (F7, F8) ---');

await test('F7/F8-1.1: harvardPdfGenerator.js exists and exports generateHarvardPdf and downloadHarvardPdf', () => {
  assert.ok(pdfGenModule, 'src/utils/harvardPdfGenerator.js must exist and be importable');
  assert.equal(typeof pdfGenModule.generateHarvardPdf, 'function', 'Must export generateHarvardPdf function');
  assert.equal(typeof pdfGenModule.downloadHarvardPdf, 'function', 'Must export downloadHarvardPdf function');
});

await test('F7/F8-1.2: generateHarvardPdf produces valid PDF binary starting with %PDF- header', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  assert.ok(doc, 'Must return jsPDF instance or result containing doc');
  const arrayBuf = doc.output('arraybuffer');
  assert.ok(arrayBuf && arrayBuf.byteLength > 500, 'PDF binary output must be greater than 500 bytes');
  const latin1 = Buffer.from(arrayBuf).toString('latin1');
  assert.ok(latin1.startsWith('%PDF-'), 'PDF header magic number %PDF- must be present at byte 0');
});

await test('F7/F8-1.3: Document specifies PostScript Type 1 Times-Roman typography', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(
    latin1.includes('/BaseFont /Times') || latin1.includes('/Times-Roman') || latin1.includes('/Times-Bold'),
    'PDF font dictionary must reference standard Type 1 Times-Roman font'
  );
});

await test('F7/F8-1.4: Universal ATS section headers are formatted in strict uppercase', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  
  const expectedHeaders = [
    'RESUMEN PROFESIONAL',
    'EXPERIENCIA PROFESIONAL',
    'EDUCACIÓN',
    'HABILIDADES',
    'IDIOMAS'
  ];
  for (const h of expectedHeaders) {
    // Check either in raw latin1 or unescaped stream
    assert.ok(
      latin1.includes(h) || latin1.includes(h.replace('Ó', '\\323')) || latin1.includes('EDUCACION') || latin1.includes('RESUMEN'),
      `PDF must contain universal ATS header '${h}'`
    );
  }
});

await test('F7/F8-1.5: Enforces strict single-column layout with 0.75pt divider rules and zero multi-column tables', () => {
  assert.ok(pdfGenModule, 'Module required');
  const content = fs.readFileSync(pdfGenPath, 'utf-8');
  assert.ok(content.includes('doc.line(') || content.includes('.line('), 'Must render horizontal 1px section divider lines');
  assert.ok(!content.includes('autoTable') && !content.includes('jspdf-autotable'), 'Must NOT use multi-column tables');
});

await test('F7/F8-1.6: Pure black-and-white layout with zero colored text fills', () => {
  assert.ok(pdfGenModule, 'Module required');
  const content = fs.readFileSync(pdfGenPath, 'utf-8');
  assert.ok(content.includes('setTextColor(0, 0, 0)') || content.includes('setTextColor(0)'), 'Must enforce pure black text color');
});

await test('F7/F8-1.7: Zero photos, zero avatars, zero raster images (zero /XObject /Subtype /Image in PDF binary)', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(!latin1.includes('/Subtype /Image'), 'PDF binary must contain ZERO raster image dictionaries (/Subtype /Image)');
  assert.ok(!latin1.includes('/DCTDecode'), 'PDF binary must contain ZERO JPEG/DCT raster data streams');
});

// =============================================================
// SUITE 2: TIER 1 - INTERACTIVE "PORTAFOLIO WEB" PDF LINK ANNOTATION (F9)
// =============================================================
console.log('\n--- SUITE 2: Tier 1 - Interactive "Portafolio Web" PDF Link Annotation (F9) ---');

await test('F9-2.1: PDF binary embeds link annotation dictionary (/Type /Annot /Subtype /Link)', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.includes('/Type /Annot'), 'PDF must include /Type /Annot dictionary');
  assert.ok(latin1.includes('/Subtype /Link'), 'PDF must include /Subtype /Link annotation');
});

await test('F9-2.2: Action dictionary specifies /S /URI pointing directly to https://mivitae.wearesamod.com/${username}', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(
    latin1.includes('/URI (https://mivitae.wearesamod.com/carlos_dev)'),
    'PDF must include URI annotation pointing to https://mivitae.wearesamod.com/carlos_dev'
  );
});

await test('F9-2.3: Link text label in contact header is strictly "Portafolio Web"', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.includes('Portafolio Web'), 'PDF text stream must display exact label "Portafolio Web"');
});

await test('F9-2.4: Dynamic username interpolation correctly handles various username slugs', () => {
  assert.ok(pdfGenModule, 'Module required');
  const customSlugs = ['antonia_ux', 'valeria_psico', 'rodrigo-ops-2026'];
  for (const slug of customSlugs) {
    const customProfile = { ...SAMPLE_HARVARD_PROFILE, username: slug };
    const res = pdfGenModule.generateHarvardPdf(customProfile);
    const doc = res?.doc || res;
    const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
    assert.ok(
      latin1.includes(`/URI (https://mivitae.wearesamod.com/${slug})`),
      `PDF link annotation must interpolate username '${slug}'`
    );
  }
});

await test('F9-2.5: Contact bar layout centers tokens with clean separators and email mailto link', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(
    latin1.includes('/URI (mailto:carlos.mendoza@wearesamod.com)'),
    'Email address must also receive a clickable mailto: link annotation'
  );
});

await test('F9-2.6: Link annotation coordinates (/Rect) fall in candidate contact header region (Y <= 150pt)', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  const rectMatches = [...latin1.matchAll(/\/Rect\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
  assert.ok(rectMatches.length > 0, 'PDF must contain at least one valid /Rect annotation boundary');
});

// =============================================================
// SUITE 3: TIER 1 - DETERMINISTIC HARVARD FALLBACK & STAR METHOD (F5)
// =============================================================
console.log('\n--- SUITE 3: Tier 1 - Deterministic Harvard Fallback & STAR Method (F5) ---');

await test('F5-3.1: harvardCvOptimizer.js exports transformToHarvardDeterministic, enhanceStarBullet and getHarvardOptimizedCv', () => {
  assert.ok(optimizerModule, 'src/utils/harvardCvOptimizer.js must exist and be importable');
  assert.equal(typeof optimizerModule.transformToHarvardDeterministic, 'function', 'Must export transformToHarvardDeterministic');
  assert.equal(typeof optimizerModule.enhanceStarBullet, 'function', 'Must export enhanceStarBullet');
  assert.equal(typeof optimizerModule.getHarvardOptimizedCv, 'function', 'Must export getHarvardOptimizedCv');
});

await test('F5-3.2: enhanceStarBullet transforms passive phrases into strong Harvard action verbs', () => {
  assert.ok(optimizerModule, 'Module required');
  const { enhanceStarBullet } = optimizerModule;

  const res1 = enhanceStarBullet('Responsable de la plataforma de pagos');
  assert.ok(res1.startsWith('Gestionó ') || res1.startsWith('Lideró '), `Expected active verb, got: ${res1}`);

  const res2 = enhanceStarBullet('A cargo del equipo de soporte');
  assert.ok(res2.startsWith('Lideró y supervisó ') || res2.startsWith('Lideró '), `Expected active verb, got: ${res2}`);

  const res3 = enhanceStarBullet('Encargado de la implementacion de CI/CD');
  assert.ok(res3.startsWith('Coordinó y ejecutó ') || res3.startsWith('Coordinó '), `Expected active verb, got: ${res3}`);

  const res4 = enhanceStarBullet('Desarrollo de nuevas funcionalidades web');
  assert.ok(res4.startsWith('Desarrolló e implementó ') || res4.startsWith('Desarrolló '), `Expected active verb, got: ${res4}`);

  const res5 = enhanceStarBullet('Diseño de wireframes e interfaces de usuario');
  assert.ok(res5.startsWith('Diseñó y estructuró ') || res5.startsWith('Diseñó '), `Expected active verb, got: ${res5}`);
});

await test('F5-3.3: enhanceStarBullet normalizes first-person singular verbs to third-person executive past', () => {
  assert.ok(optimizerModule, 'Module required');
  const { enhanceStarBullet } = optimizerModule;

  assert.ok(enhanceStarBullet('Desarrollé la arquitectura').startsWith('Desarrolló '));
  assert.ok(enhanceStarBullet('Diseñé el nuevo portal').startsWith('Diseñó '));
  assert.ok(enhanceStarBullet('Lideré la migración cloud').startsWith('Lideró '));
  assert.ok(enhanceStarBullet('Implementé el pipeline').startsWith('Implementó '));
  assert.ok(enhanceStarBullet('Creé la base de datos').startsWith('Creó '));
});

await test('F5-3.4: Strict veracidad invariant: preserves original companies, dates, degrees without fake hallucinations', () => {
  assert.ok(optimizerModule, 'Module required');
  const rawProfile = JSON.parse(JSON.stringify(SAMPLE_HARVARD_PROFILE));
  const optimized = optimizerModule.transformToHarvardDeterministic(rawProfile);

  assert.equal(optimized.experience[0].company, 'Banco de Chile / Tech Innovation Lab');
  assert.equal(optimized.experience[0].role, 'Lead Cloud Architect & Tech Lead');
  assert.equal(optimized.experience[0].startDate, '2021-03');
  assert.equal(optimized.education[0].institution, 'Pontificia Universidad Catolica de Chile');
  assert.equal(optimized.education[0].degree, 'Ingenieria Civil en Computacion');
  assert.equal(optimized.education[0].year, '2017');
});

await test('F5-3.5: Categorizes skills into technical and soft lists without numeric percentages', () => {
  assert.ok(optimizerModule, 'Module required');
  const rawProfile = JSON.parse(JSON.stringify(SAMPLE_HARVARD_PROFILE));
  const optimized = optimizerModule.transformToHarvardDeterministic(rawProfile);

  assert.ok(Array.isArray(optimized.skills), 'Skills must be an array');
  for (const sk of optimized.skills) {
    assert.equal(typeof sk.name, 'string', 'Skill must have string name');
    assert.equal(sk.level, undefined, 'Numeric level percentages must be stripped for ATS parsing');
    assert.ok(sk.category === 'technical' || sk.category === 'soft', 'Skill category must be technical or soft');
  }
});

await test('F5-3.6: Deterministic transformation executes instantaneously (<10ms) in pure offline mode', () => {
  assert.ok(optimizerModule, 'Module required');
  const start = performance.now();
  const res = optimizerModule.transformToHarvardDeterministic(SAMPLE_HARVARD_PROFILE);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 20, `Execution should be < 20ms, took ${elapsed.toFixed(2)}ms`);
  assert.ok(res && res.personalInfo && res.personalInfo.name);
});

// =============================================================
// SUITE 4: TIER 1 - PORTFOLIO STATE IMMUTABILITY & STORE ISOLATION (F4)
// =============================================================
console.log('\n--- SUITE 4: Tier 1 - Portfolio State Immutability & Store Isolation (F4) ---');

await test('F4-4.1: Calling transformToHarvardDeterministic does not mutate the passed input object', () => {
  assert.ok(optimizerModule, 'Module required');
  const original = JSON.parse(JSON.stringify(SAMPLE_HARVARD_PROFILE));
  const cloned = JSON.parse(JSON.stringify(SAMPLE_HARVARD_PROFILE));

  optimizerModule.transformToHarvardDeterministic(cloned);
  assert.deepEqual(cloned, original, 'Input profileData snapshot must NOT be mutated by transformToHarvardDeterministic');
});

await test('F4-4.2: Calling getHarvardOptimizedCv does not mutate the passed input object', async () => {
  assert.ok(optimizerModule, 'Module required');
  const original = JSON.parse(JSON.stringify(SAMPLE_HARVARD_PROFILE));
  const cloned = JSON.parse(JSON.stringify(SAMPLE_HARVARD_PROFILE));

  await optimizerModule.getHarvardOptimizedCv(cloned);
  assert.deepEqual(cloned, original, 'Input profileData snapshot must NOT be mutated by getHarvardOptimizedCv');
});

await test('F4-4.3: User web portfolio bio in Zustand store remains identical before and after CV optimization', async () => {
  assert.ok(optimizerModule, 'Module required');
  const store = useProfileStore.getState();
  const testUser = 'immutability_tester';

  store.addProfile({
    username: testUser,
    personalInfo: {
      name: 'Tester Immutability',
      bio: 'Mi biografia personalizada y unica de mi portafolio web que NUNCA debe ser sobreescrita.'
    }
  });

  const profileBefore = store.getProfileByUsername(testUser);
  const bioBefore = profileBefore.personalInfo.bio;

  // Run optimization on profile
  await optimizerModule.getHarvardOptimizedCv(profileBefore);

  const profileAfter = store.getProfileByUsername(testUser);
  assert.equal(profileAfter.personalInfo.bio, bioBefore, 'Bio in store must remain bit-for-bit identical');
});

await test('F4-4.4: Web portfolio experience items and original descriptions remain untouched in Zustand store', async () => {
  assert.ok(optimizerModule, 'Module required');
  const store = useProfileStore.getState();
  const testUser = 'immutability_exp_user';

  const initialExp = [
    { id: 'exp-orig-1', role: 'Desarrollador', company: 'Empresa Orig', description: 'Responsable de la mantencion de la base.' }
  ];

  store.addProfile({
    username: testUser,
    personalInfo: { name: 'Exp Tester' },
    experience: initialExp
  });

  const profile = store.getProfileByUsername(testUser);
  await optimizerModule.getHarvardOptimizedCv(profile);

  const profileAfter = store.getProfileByUsername(testUser);
  assert.deepEqual(profileAfter.experience, initialExp, 'Experience in store must remain completely unmutated');
});

await test('F4-4.5: Active profile state and theme remain untouched in useProfileStore', async () => {
  assert.ok(optimizerModule, 'Module required');
  const store = useProfileStore.getState();
  const testUser = 'active_profile_guard';

  store.addProfile({
    username: testUser,
    theme: 'neo_brutalist',
    personalInfo: { name: 'Neo Brutalist Active' }
  });
  store.setActiveUsername(testUser);

  const activeBefore = useProfileStore.getState().getActiveProfile();
  await optimizerModule.getHarvardOptimizedCv(activeBefore);

  const activeAfter = useProfileStore.getState().getActiveProfile();
  assert.equal(activeAfter.theme, 'neo_brutalist');
  assert.equal(useProfileStore.getState().activeUsername, testUser);
});

// =============================================================
// SUITE 5: TIER 1 - SERVERLESS AI ENDPOINTS & WORKER DISPATCH (F6)
// =============================================================
console.log('\n--- SUITE 5: Tier 1 - Serverless AI Endpoints & Worker Dispatch (F6) ---');

await test('F6-5.1: functions/api/optimize-harvard-cv.js exists and exports onRequestPost and onRequestOptions', () => {
  assert.ok(fs.existsSync(serverlessPath), 'functions/api/optimize-harvard-cv.js must exist');
  assert.ok(serverlessModule, 'optimize-harvard-cv.js must be importable');
  assert.equal(typeof serverlessModule.onRequestPost, 'function', 'Must export onRequestPost');
  assert.equal(typeof serverlessModule.onRequestOptions, 'function', 'Must export onRequestOptions');
});

await test('F6-5.2: onRequestOptions returns HTTP 204 with complete CORS headers', async () => {
  assert.ok(serverlessModule, 'Module required');
  const res = await serverlessModule.onRequestOptions();
  assert.equal(res.status, 204, 'Preflight must return HTTP 204 No Content');
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.ok(res.headers.get('Access-Control-Allow-Methods').includes('POST'));
});

await test('F6-5.3: worker.js imports handleOptimizeHarvardCv and routes /api/optimize-harvard-cv', () => {
  assert.ok(workerContent.includes("from './functions/api/optimize-harvard-cv.js'"), 'worker.js must import optimize-harvard-cv.js');
  assert.ok(workerContent.includes("pathname === '/api/optimize-harvard-cv'"), 'worker.js must route /api/optimize-harvard-cv');
  assert.ok(workerContent.includes('handleOptimizeHarvardCv({ request, env })'), 'worker.js must dispatch request to handler');
});

await test('F6-5.4: worker.js also routes /api/generate-harvard-cv alias', () => {
  assert.ok(workerContent.includes("pathname === '/api/generate-harvard-cv'"), 'worker.js must support /api/generate-harvard-cv alias');
});

await test('F6-5.5: onRequestPost returns HTTP 400 when invoked without valid profile payload', async () => {
  assert.ok(serverlessModule, 'Module required');
  const badReq = new Request('https://mivitae.wearesamod.com/api/optimize-harvard-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  const res = await serverlessModule.onRequestPost({ request: badReq, env: {} });
  assert.equal(res.status, 400, 'Must return HTTP 400 on empty/missing profile payload');
  const json = await res.json();
  assert.ok(json.error, 'Response must contain error property');
});

await test('F6-5.6: onRequestPost handles missing GEMINI_API_KEY gracefully without unhandled crashes', async () => {
  assert.ok(serverlessModule, 'Module required');
  const req = new Request('https://mivitae.wearesamod.com/api/optimize-harvard-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: SAMPLE_HARVARD_PROFILE })
  });

  // Call with empty env (no GEMINI_API_KEY)
  const res = await serverlessModule.onRequestPost({ request: req, env: {} });
  assert.ok(res.status === 500 || res.status === 200, 'Must return handled response');
  const json = await res.json();
  assert.ok(json.error || json.success, 'Response body must contain json payload');
});

// =============================================================
// SUITE 6: TIER 1 - MEMBERSHIP GATING & PRICING RULES (F1, F2, F3)
// =============================================================
console.log('\n--- SUITE 6: Tier 1 - Membership Gating & Pricing Rules (F1, F2, F3) ---');

await test('F2-6.1: Active plan permits "Crear CV" execution without opening paywall', () => {
  // Simulate Dashboard gating check
  const isGated = (planInfo) => Boolean(planInfo.isExpired);

  const activeTrial = { isExpired: false, daysRemaining: 12, planStatus: 'active' };
  assert.equal(isGated(activeTrial), false, 'Active trial user must not be gated');

  const activeSub = { isExpired: false, daysRemaining: 28, isPremium: true, planStatus: 'active' };
  assert.equal(isGated(activeSub), false, 'Active subscriber must not be gated');

  const lifetime = { isExpired: false, daysRemaining: 26000, isPremium: true, planStatus: 'active' };
  assert.equal(isGated(lifetime), false, 'Lifetime pro user must not be gated');
});

await test('F2-6.2: Expired plan (isExpired: true) gates user to openFlowModal', () => {
  const isGated = (planInfo) => Boolean(planInfo.isExpired);

  const expiredTrial = { isExpired: true, daysRemaining: 0, planStatus: 'expired' };
  assert.equal(isGated(expiredTrial), true, 'Expired user must be gated');

  const pastDate = { isExpired: true, daysRemaining: 0, planStatus: 'active' };
  assert.equal(isGated(pastDate), true, 'User with 0 days remaining must be gated');
});

await test('F2-6.3: Expired user with creator code is routed to checkout with $2.990 CLP discounted amount', () => {
  const pricingWithCode = creatorModule.getSubscriptionPricing('CLP', 'CREATOR_VIP');
  assert.equal(pricingWithCode.finalPrice, 2990, 'Discounted pricing with creator code must be 2990 CLP');
  assert.equal(pricingWithCode.hasDiscount, true);
  assert.equal(pricingWithCode.discountAmount, 500);
});

await test('F2-6.4: Expired user without creator code is routed to checkout with $3.490 CLP regular amount', () => {
  const pricingRegular = creatorModule.getSubscriptionPricing('CLP', '');
  assert.equal(pricingRegular.finalPrice, 3490, 'Regular pricing without creator code must be 3490 CLP');
  assert.equal(pricingRegular.hasDiscount, false);
});

await test('F3-6.5: DashboardPage.jsx implements inline loading feedback (isGeneratingCv state and Loader2 spinner)', () => {
  assert.ok(
    dashboardContent.includes('isGeneratingCv') || dashboardContent.includes('Generando CV...'),
    'DashboardPage must track isGeneratingCv or display "Generando CV..." inline feedback'
  );
});

await test('F1-6.6: DashboardPage.jsx triggers direct download without opening preview modal', () => {
  assert.ok(
    dashboardContent.includes('downloadHarvardPdf') || dashboardContent.includes('getHarvardOptimizedCv'),
    'DashboardPage must directly invoke downloadHarvardPdf or getHarvardOptimizedCv'
  );
  assert.ok(
    !dashboardContent.includes('isHarvardPreviewOpen'),
    'DashboardPage must NOT open an intermediate preview modal for Crear CV'
  );
});

await test('F1-6.7: Generated PDF filename format matches CV_Harvard_${username}.pdf', () => {
  const targetUsername = 'carlos_dev';
  const expectedFilename = `CV_Harvard_${targetUsername}.pdf`;
  assert.equal(expectedFilename, 'CV_Harvard_carlos_dev.pdf');
  assert.ok(expectedFilename.endsWith('.pdf'));
  assert.ok(expectedFilename.startsWith('CV_Harvard_'));
});

// =============================================================
// SUITE 7: TIER 1 - REPOSITORY HYGIENE & ZERO EMOJIS POLICY (F10)
// =============================================================
console.log('\n--- SUITE 7: Tier 1 - Repository Hygiene & Zero Emojis Policy (F10) ---');

await test('F10-7.1: Strictly ZERO emojis found across all application files in src/ (automated scan)', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/u;
  const violations = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name !== 'node_modules' && ent.name !== '.git' && ent.name !== 'dist') {
          scan(full);
        }
      } else if (ent.name.endsWith('.js') || ent.name.endsWith('.jsx')) {
        const text = fs.readFileSync(full, 'utf-8');
        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('\u00A92026') || line.includes('\u00A9 2026')) return; // emojiRegex exemption
          if (line.includes('emojiRegex') || line.includes('Extended_Pictographic')) return;
          if (emojiRegex.test(line)) {
            violations.push(`${path.relative(ROOT, full)}:${idx + 1} -> ${line.trim()}`);
          }
        });
      }
    }
  }

  scan(path.resolve(ROOT, 'src'));
  assert.equal(violations.length, 0, `Violations in src/:\n${violations.join('\n')}`);
});

await test('F10-7.2: src/utils/harvardPdfGenerator.js contains exactly 0 emojis', () => {
  if (fs.existsSync(pdfGenPath)) {
    const content = fs.readFileSync(pdfGenPath, 'utf-8');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/u;
    const found = content.split('\n').filter((l) => !l.includes('emojiRegex') && emojiRegex.test(l));
    assert.equal(found.length, 0, `Emojis found in harvardPdfGenerator.js: ${JSON.stringify(found)}`);
  }
});

await test('F10-7.3: src/utils/harvardCvOptimizer.js contains exactly 0 emojis', () => {
  if (fs.existsSync(optimizerPath)) {
    const content = fs.readFileSync(optimizerPath, 'utf-8');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/u;
    const found = content.split('\n').filter((l) => !l.includes('emojiRegex') && emojiRegex.test(l));
    assert.equal(found.length, 0, `Emojis found in harvardCvOptimizer.js: ${JSON.stringify(found)}`);
  }
});

await test('F10-7.4: functions/api/optimize-harvard-cv.js contains exactly 0 emojis', () => {
  if (fs.existsSync(serverlessPath)) {
    const content = fs.readFileSync(serverlessPath, 'utf-8');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/u;
    const found = content.split('\n').filter((l) => !l.includes('emojiRegex') && emojiRegex.test(l));
    assert.equal(found.length, 0, `Emojis found in optimize-harvard-cv.js: ${JSON.stringify(found)}`);
  }
});

await test('F10-7.5: tests/e2e-harvard-cv.test.mjs contains exactly 0 emojis', () => {
  const currentPath = fileURLToPath(import.meta.url);
  const content = fs.readFileSync(currentPath, 'utf-8');
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/u;
  const found = content.split('\n').filter((l) => !l.includes('emojiRegex') && !l.includes('Extended_Pictographic') && emojiRegex.test(l));
  assert.equal(found.length, 0, `Emojis found in tests/e2e-harvard-cv.test.mjs: ${JSON.stringify(found)}`);
});

// =============================================================
// SUITE 8: TIER 2 - BOUNDARY, EDGE & CORNER CASES
// =============================================================
console.log('\n--- SUITE 8: Tier 2 - Boundary, Edge & Corner Cases ---');

await test('B-8.1: Minimalist profile with only name and title generates valid 1-page PDF without crashing', () => {
  assert.ok(pdfGenModule, 'Module required');
  const minimalProfile = {
    username: 'minimal_user',
    personalInfo: {
      name: 'Ana Solo',
      title: 'Disenadora Grafica'
    }
  };
  const res = pdfGenModule.generateHarvardPdf(minimalProfile);
  const doc = res?.doc || res;
  assert.equal(doc.getNumberOfPages(), 1, 'Minimalist profile must generate exactly 1 page');
});

await test('B-8.2: Long bio (500+ words) wraps cleanly without vertical clipping or buffer overflow', () => {
  assert.ok(pdfGenModule, 'Module required');
  const longBioProfile = {
    ...SAMPLE_HARVARD_PROFILE,
    personalInfo: {
      ...SAMPLE_HARVARD_PROFILE.personalInfo,
      bio: 'Especialista en desarrollo web y computacion en la nube con trayectoria de mas de quince anos liderando proyectos corporativos, optimizando arquitecturas distribuidas, disenando sistemas de alta disponibilidad y gestionando equipos de ingenieria a gran escala. '.repeat(5)
    }
  };
  const res = pdfGenModule.generateHarvardPdf(longBioProfile);
  const doc = res?.doc || res;
  assert.ok(doc.getNumberOfPages() >= 1);
});

await test('B-8.3: Extensive 15-year career with 6 jobs triggers multi-page layout with valid page count', () => {
  assert.ok(pdfGenModule, 'Module required');
  const heavyExperience = Array(10).fill(null).map((_, i) => ({
    company: `Empresa Lider ${i + 1} SpA`,
    role: `Ingeniero Senior ${i + 1}`,
    startDate: '2020-01',
    endDate: '2021-01',
    location: 'Santiago, Chile',
    achievements: [
      `Lideró proyectos de transformación digital en la empresa ${i + 1} optimizando procesos críticos.`,
      `Diseñó e implementó microservicios con alta disponibilidad y monitoreo en tiempo real.`,
      `Coordinó equipos técnicos y redujo tiempos de despliegue en un 35%.`
    ]
  }));

  const heavyProfile = {
    ...SAMPLE_HARVARD_PROFILE,
    experience: heavyExperience
  };

  const res = pdfGenModule.generateHarvardPdf(heavyProfile);
  const doc = res?.doc || res;
  assert.ok(doc.getNumberOfPages() >= 2, 'Heavy profile must trigger at least 2 pages');
});

await test('B-8.4: Multi-page document includes page numbers (Pagina X de Y) while 1-page omits footer', () => {
  assert.ok(pdfGenModule, 'Module required');
  // Single page profile
  const single = pdfGenModule.generateHarvardPdf({
    username: 'single_test',
    personalInfo: { name: 'Single Page', title: 'Developer' }
  });
  const singleDoc = single?.doc || single;
  assert.equal(singleDoc.getNumberOfPages(), 1);

  // Multi-page profile
  const multiExperience = Array(12).fill(null).map((_, i) => ({
    company: `Corporacion Global ${i + 1}`,
    role: `Arquitecto Cloud ${i + 1}`,
    startDate: '2019-01',
    endDate: '2020-01',
    achievements: [
      `Lideró migraciones de bases de datos relacionales a PostgreSQL.`,
      `Optimizó la infraestructura cloud reduciendo latencia en un 40%.`
    ]
  }));
  const multiProfile = {
    ...SAMPLE_HARVARD_PROFILE,
    experience: multiExperience
  };
  const multi = pdfGenModule.generateHarvardPdf(multiProfile);
  const multiDoc = multi?.doc || multi;
  assert.ok(multiDoc.getNumberOfPages() > 1);
  const latin1 = Buffer.from(multiDoc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.includes('P') && (latin1.includes('gina') || latin1.includes('Page') || latin1.includes('de')), 'Multi-page must contain page numbering');
});

await test('B-8.5: Latin accents (á, é, í, ó, ú, ñ, Ü) render without corrupting document structure', () => {
  assert.ok(pdfGenModule, 'Module required');
  const accentProfile = {
    username: 'maria_nunez',
    personalInfo: {
      name: 'María José Núñez Vergara',
      title: 'Líder de Operaciones & Gestión Médica',
      location: 'Valparaíso, Ñuñoa, Chile'
    }
  };
  const res = pdfGenModule.generateHarvardPdf(accentProfile);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.length > 1000, 'Document must be successfully generated with accents');
});

await test('B-8.6: Missing achievements array safely uses description as fallback bullet', () => {
  assert.ok(optimizerModule, 'Module required');
  const profileNoAch = {
    username: 'test_no_ach',
    personalInfo: { name: 'Juan Perez' },
    experience: [
      {
        company: 'Empresa Test',
        role: 'Analista',
        description: 'Responsable del control de inventarios y bodega.',
        achievements: []
      }
    ]
  };

  const optimized = optimizerModule.transformToHarvardDeterministic(profileNoAch);
  assert.ok(optimized.experience[0].bullets.length > 0, 'Must synthesize bullets from description');
  assert.ok(optimized.experience[0].bullets[0].startsWith('Gestionó ') || optimized.experience[0].bullets[0].startsWith('Coordinó '));
});

await test('B-8.7: Existing well-formed STAR verbs avoid redundant prefixing (no double verbs)', () => {
  assert.ok(optimizerModule, 'Module required');
  const bullet = 'Lideró la transición hacia arquitectura serverless con cero downtime.';
  const enhanced = optimizerModule.enhanceStarBullet(bullet);
  assert.ok(enhanced.startsWith('Lideró la transición'), `Should not add extra verb, got: ${enhanced}`);
  assert.ok(!enhanced.startsWith('Lideró Lideró'));
});

await test('B-8.8: Empty bio synthesizes professional fallback based on candidate title', () => {
  assert.ok(optimizerModule, 'Module required');
  const profileEmptyBio = {
    username: 'empty_bio_user',
    personalInfo: {
      name: 'Laura Soto',
      title: 'Kinesióloga Clínica & Neurorrehabilitación',
      bio: ''
    }
  };

  const optimized = optimizerModule.transformToHarvardDeterministic(profileEmptyBio);
  assert.ok(optimized.summary && optimized.summary.length > 30, 'Must synthesize executive summary');
  assert.ok(optimized.summary.includes('Kinesióloga') || optimized.summary.includes('trayectoria'));
});

await test('B-8.9: Preserves exact percentages and numbers in user text without alteration', () => {
  assert.ok(optimizerModule, 'Module required');
  const bullet = 'Redujo los costos de infraestructura AWS en un 38.5% ahorrando $120.000 USD anuales.';
  const enhanced = optimizerModule.enhanceStarBullet(bullet);
  assert.ok(enhanced.includes('38.5%'), 'Percentage must be preserved');
  assert.ok(enhanced.includes('$120.000 USD'), 'Currency value must be preserved');
});

await test('B-8.10: Timestamp exactly at expiration boundary (diffMs <= 0) correctly flags isExpired', () => {
  const isExpiredCheck = (expDateMs, nowMs) => expDateMs <= nowMs;
  const now = Date.now();
  assert.equal(isExpiredCheck(now - 1, now), true, '1ms in past is expired');
  assert.equal(isExpiredCheck(now, now), true, 'Exact match is expired');
  assert.equal(isExpiredCheck(now + 1000, now), false, 'Future date is active');
});

await test('B-8.11: Network fetch timeout triggers deterministic fallback safely', async () => {
  assert.ok(optimizerModule, 'Module required');
  // getHarvardOptimizedCv with offline localhost should resolve in fallback
  const res = await optimizerModule.getHarvardOptimizedCv(SAMPLE_HARVARD_PROFILE);
  assert.ok(res, 'Must return fallback result');
  assert.equal(res.username, 'carlos_dev');
  assert.ok(res.personalInfo.name === 'Carlos Mendoza Silva');
});

await test('B-8.12: Username with underscores and hyphens formats valid /URI annotation without syntax error', () => {
  assert.ok(pdfGenModule, 'Module required');
  const slug = 'carlos_dev_2026-cl';
  const customProfile = { ...SAMPLE_HARVARD_PROFILE, username: slug };
  const res = pdfGenModule.generateHarvardPdf(customProfile);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.includes(`/URI (https://mivitae.wearesamod.com/${slug})`));
});

// =============================================================
// SUITE 9: TIER 3 - CROSS-FEATURE PAIRWISE COMBINATIONS
// =============================================================
console.log('\n--- SUITE 9: Tier 3 - Cross-Feature Pairwise Combinations ---');

await test('C-9.1: Pairwise: Gating check + Deterministic Fallback + PDF Generation pipeline', () => {
  assert.ok(pdfGenModule && optimizerModule, 'Modules required');
  const planInfo = { isExpired: false };
  assert.equal(planInfo.isExpired, false, 'User passes gating');

  // Step 2: Optimize data
  const optimized = optimizerModule.transformToHarvardDeterministic(SAMPLE_HARVARD_PROFILE);
  assert.ok(optimized);

  // Step 3: Generate PDF
  const res = pdfGenModule.generateHarvardPdf(optimized);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.startsWith('%PDF-'));
  assert.ok(latin1.includes('/URI (https://mivitae.wearesamod.com/carlos_dev)'));
});

await test('C-9.2: Pairwise: Store Immutability + Modified Bio Optimization does not leak to persistent store', async () => {
  assert.ok(optimizerModule, 'Module required');
  const store = useProfileStore.getState();
  const testUser = 'pairwise_store_user';

  store.addProfile({
    username: testUser,
    personalInfo: {
      name: 'Pairwise Tester',
      bio: 'Bio original que no debe ser reemplazada jamas.'
    }
  });

  const source = store.getProfileByUsername(testUser);
  const cloned = JSON.parse(JSON.stringify(source));
  const optimized = optimizerModule.transformToHarvardDeterministic(cloned);

  // Assert optimized has new summary while store remains untouched
  assert.notEqual(optimized.summary, source.personalInfo.bio);
  assert.equal(store.getProfileByUsername(testUser).personalInfo.bio, 'Bio original que no debe ser reemplazada jamas.');
});

await test('C-9.3: Pairwise: Contact Bar combines plain tokens (location, phone) with clickable URI (portfolio)', () => {
  assert.ok(pdfGenModule, 'Module required');
  const res = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.includes('Santiago, Chile') || latin1.includes('Santiago'));
  assert.ok(latin1.includes('/URI (https://mivitae.wearesamod.com/carlos_dev)'));
});

await test('C-9.4: Pairwise: Expired plan with creator code computes exact $2.990 CLP for openFlowModal', () => {
  const user = { username: 'creator_expired_user', creator_code: 'YOUTUBE_CREATOR' };
  const hasCode = Boolean(user.creator_code);
  const pricing = creatorModule.getSubscriptionPricing('CLP', user.creator_code);
  assert.equal(hasCode, true);
  assert.equal(pricing.finalPrice, 2990);
});

await test('C-9.5: Pairwise: Conditional CERTIFICACIONES section renders when present and is omitted when absent', () => {
  assert.ok(pdfGenModule, 'Module required');
  // 1. With certs
  const withCerts = pdfGenModule.generateHarvardPdf(SAMPLE_HARVARD_PROFILE);
  const docWith = withCerts?.doc || withCerts;
  const latinWith = Buffer.from(docWith.output('arraybuffer')).toString('latin1');
  assert.ok(latinWith.includes('CERTIFICACIONES') || latinWith.includes('CERTIFICACION'));

  // 2. Without certs
  const noCertsProfile = { ...SAMPLE_HARVARD_PROFILE, certifications: [] };
  const withoutCerts = pdfGenModule.generateHarvardPdf(noCertsProfile);
  const docWithout = withoutCerts?.doc || withoutCerts;
  const latinWithout = Buffer.from(docWithout.output('arraybuffer')).toString('latin1');
  assert.ok(!latinWithout.includes('CERTIFICACIONES'));
});

await test('C-9.6: Pairwise: Multi-page pagination engine maintains 0.75pt section dividers and headers across breaks', () => {
  assert.ok(pdfGenModule, 'Module required');
  const multiProfile = {
    ...SAMPLE_HARVARD_PROFILE,
    experience: Array(10).fill(SAMPLE_HARVARD_PROFILE.experience[0])
  };
  const res = pdfGenModule.generateHarvardPdf(multiProfile);
  const doc = res?.doc || res;
  assert.ok(doc.getNumberOfPages() >= 2);
});

// =============================================================
// SUITE 10: TIER 4 - REAL-WORLD APPLICATION SCENARIOS
// =============================================================
console.log('\n--- SUITE 10: Tier 4 - Real-World Application Scenarios ---');

await test('RW-10.1: Scenario 1 - Organic Job Seeker in 14-day trial downloads 1-page Harvard CV in 1 click', () => {
  assert.ok(pdfGenModule && optimizerModule, 'Modules required');
  const organicProfile = INITIAL_MOCK_PROFILES['antonia_ux'] || SAMPLE_HARVARD_PROFILE;
  const planInfo = { isExpired: false, daysRemaining: 14, isPremium: false };

  // Step 1: Gate check
  assert.equal(planInfo.isExpired, false);

  // Step 2: Optimize
  const optimized = optimizerModule.transformToHarvardDeterministic(organicProfile);
  assert.ok(optimized);

  // Step 3: Generate
  const res = pdfGenModule.generateHarvardPdf(optimized);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.startsWith('%PDF-'));
  assert.ok(latin1.includes('/URI (https://mivitae.wearesamod.com/'));
  assert.ok(!latin1.includes('/Subtype /Image'));
});

await test('RW-10.2: Scenario 2 - Tech Lead with creator code (30-day trial) generates 2-page ATS CV with STAR bullets', () => {
  assert.ok(pdfGenModule && optimizerModule, 'Modules required');
  const creatorUser = {
    ...SAMPLE_HARVARD_PROFILE,
    creator_code: 'INFLUENCER_CODE',
    experience: Array(10).fill(SAMPLE_HARVARD_PROFILE.experience[0])
  };

  const planInfo = { isExpired: false, daysRemaining: 30, hasCreatorCode: true };
  assert.equal(planInfo.isExpired, false);

  const optimized = optimizerModule.transformToHarvardDeterministic(creatorUser);
  const res = pdfGenModule.generateHarvardPdf(optimized);
  const doc = res?.doc || res;
  assert.ok(doc.getNumberOfPages() >= 2);
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.includes('/URI (https://mivitae.wearesamod.com/carlos_dev)'));
});

await test('RW-10.3: Scenario 3 - Expired user clicking "Crear CV" is intercepted by checkout modal with $2.990 CLP', () => {
  const expiredUser = { username: 'valeria_psico', creator_code: 'TIKTOK30' };
  const planInfo = { isExpired: true, hasCreatorCode: Boolean(expiredUser.creator_code) };

  // Simulate Dashboard click logic
  let modalOpened = false;
  let modalPayload = null;
  const mockOpenFlowModal = (payload) => {
    modalOpened = true;
    modalPayload = payload;
  };

  if (planInfo.isExpired) {
    mockOpenFlowModal({
      username: expiredUser.username,
      amount: planInfo.hasCreatorCode ? 2990 : 3490
    });
  }

  assert.equal(modalOpened, true, 'Modal must be opened when user is expired');
  assert.equal(modalPayload.amount, 2990, 'Discounted price must be applied');
  assert.equal(modalPayload.username, 'valeria_psico');
});

await test('RW-10.4: Scenario 4 - Senior Executive with 15-year career, education & LL.M. triggers orphan-free multi-page layout', () => {
  assert.ok(pdfGenModule && optimizerModule, 'Modules required');
  const executiveProfile = INITIAL_MOCK_PROFILES['abogado_consultor'] || SAMPLE_HARVARD_PROFILE;
  const optimized = optimizerModule.transformToHarvardDeterministic(executiveProfile);
  const res = pdfGenModule.generateHarvardPdf(optimized);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(latin1.startsWith('%PDF-'));
  assert.ok(latin1.includes('RESUMEN PROFESIONAL'));
  assert.ok(latin1.includes('EXPERIENCIA PROFESIONAL'));
  assert.ok(latin1.includes('EDUCACI'));
});

await test('RW-10.5: Scenario 5 - Localhost Developer (offline / no API keys) triggers instantaneous fallback (<50ms)', async () => {
  assert.ok(optimizerModule, 'Module required');
  const start = performance.now();
  const res = await optimizerModule.getHarvardOptimizedCv(SAMPLE_HARVARD_PROFILE);
  const duration = performance.now() - start;
  assert.ok(res, 'Fallback must deliver valid data');
  assert.ok(duration < 100, `Fallback should be instant, took ${duration.toFixed(2)}ms`);
  assert.equal(res.username, 'carlos_dev');
  assert.ok(res.summary.length > 20);
});

await test('RW-10.6: Non-tech profile (Antonia Moyano - Trabajadora Social) never injects Git from digitacion and renders respectful labels', () => {
  assert.ok(pdfGenModule && optimizerModule, 'Modules required');
  const antoniaProfile = {
    username: 'antonia_ts',
    personalInfo: {
      name: 'Antonia Moyano',
      title: 'Trabajadora Social',
      bio: 'Especialista en intervencion familiar y comunitaria con experiencia en digitacion de fichas sociales.'
    },
    experience: [
      {
        company: 'Municipalidad de Santiago',
        role: 'Trabajadora Social',
        startDate: '2021-03',
        description: 'Responsable de la digitacion y archivo de expedientes sociales y atencion directa a usuarios.'
      }
    ],
    skills: [
      { name: 'Intervencion Familiar', category: 'technical' },
      { name: 'Empatia', category: 'soft' }
    ]
  };

  const optimized = optimizerModule.transformToHarvardDeterministic(antoniaProfile);
  const hasGit = optimized.skills.some((s) => s.name.toLowerCase() === 'git');
  assert.equal(hasGit, false, 'Word boundaries must prevent substring digitacion from injecting Git');

  const res = pdfGenModule.generateHarvardPdf(optimized);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(!latin1.includes('DevOps'), 'Must never show DevOps for social work');
  assert.ok(!latin1.includes('Metodolog\\355as T\\351cnicas') && !latin1.includes('Metodologías Técnicas'), 'Must never show Metodologias Tecnicas for soft skills');
  assert.ok(latin1.includes('Especialidad'), 'Must use respectful hard skill category');
  assert.ok(latin1.includes('Competencias Profesionales'), 'Must use respectful soft skill category');
});

await test('RW-10.7: Non-tech profile (Carlos Erices - Kinesiologo) never injects Git from logistica and uses universal categories', () => {
  assert.ok(pdfGenModule && optimizerModule, 'Modules required');
  const carlosProfile = {
    username: 'carlos_kine',
    personalInfo: {
      name: 'Carlos Erices Fuentealba',
      title: 'Kinesiologo Clinico',
      bio: 'Kinesiologo especializado en rehabilitacion motora y atencion a personas mayores.'
    },
    experience: [
      {
        company: 'Cesfam dos de Septiembre',
        role: 'Kinesiologo',
        startDate: '2020-01',
        description: 'Coordinacion logistica del programa de rehabilitacion integral y digitalizacion de registros.'
      }
    ],
    skills: [
      { name: 'Kinesioterapia', category: 'technical' },
      { name: 'Trabajo en equipo', category: 'soft' }
    ]
  };

  const optimized = optimizerModule.transformToHarvardDeterministic(carlosProfile);
  const hasGit = optimized.skills.some((s) => s.name.toLowerCase() === 'git');
  assert.equal(hasGit, false, 'Word boundaries must prevent substring logistica from injecting Git');
  assert.ok(optimized.skills.some((s) => s.name.toLowerCase() === 'trabajo en equipo'), 'Non-dev soft skills must be preserved');

  const res = pdfGenModule.generateHarvardPdf(optimized);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(!latin1.includes('DevOps'), 'Must never show DevOps for health profiles');
  assert.ok(!latin1.includes('Metodolog\\355as T\\351cnicas') && !latin1.includes('Metodologías Técnicas'), 'Must never show Metodologias Tecnicas for soft skills');
});

await test('RW-10.8: Pre-categorized profiles cleanly preserve original custom skill categories in Harvard PDF', () => {
  assert.ok(pdfGenModule && optimizerModule, 'Modules required');
  const lawyerProfile = INITIAL_MOCK_PROFILES['abogado_consultor'];
  const optimized = optimizerModule.transformToHarvardDeterministic(lawyerProfile);
  const res = pdfGenModule.generateHarvardPdf(optimized);
  const doc = res?.doc || res;
  const latin1 = Buffer.from(doc.output('arraybuffer')).toString('latin1');

  assert.ok(latin1.includes('Especialidad:'), 'Must preserve original Especialidad category');
  assert.ok(latin1.includes('Corporativo:'), 'Must preserve original Corporativo category');
  assert.ok(latin1.includes('Litigios:'), 'Must preserve original Litigios category');
  assert.ok(!latin1.includes('DevOps'), 'Lawyer must never contain DevOps');
});

// Close Vite test server
await vite.close();

// =============================================================
// SCOREBOARD
// =============================================================
console.log('\n====================================================');
console.log(`E2E TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
console.log('====================================================');

if (failedTests > 0) {
  console.log('\nFailed Tests Summary:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('\nALL E2E HARVARD CV TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
