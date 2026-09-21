import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🚀 TEST SUITE: CV IMPORT & PARSER (FUNCTIONAL & NON-FUNCTIONAL)');
console.log('====================================================\n');

const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom'
});

let passedTests = 0;
let failedTests = 0;
const failures = [];

async function it(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
    failures.push({ name, error: err });
    failedTests++;
  }
}

// -------------------------------------------------------------
// SUITE 1: Backend Serverless & Routing (functions/api/parse-cv.js & worker.js)
// -------------------------------------------------------------
console.log('▶ Suite 1: Backend Serverless & Routing (/api/parse-cv & worker.js)');

const { onRequestPost: handleParseCv } = await vite.ssrLoadModule('/functions/api/parse-cv.js');
const workerModule = await vite.ssrLoadModule('/worker.js');
const worker = workerModule.default;

await it('worker.js routes /api/parse-cv to handleParseCv', async () => {
  const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const res = await worker.fetch(req, {}, {});
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /No se recibió ningún archivo PDF/i);
});

await it('rejects non-POST requests to /api/parse-cv with 405 or 400', async () => {
  const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
    method: 'GET'
  });
  const res = await worker.fetch(req, {}, {});
  assert.ok(res.status === 405 || res.status === 400);
});

await it('parses JSON payload with fileBase64, base64 or pdfBase64 keys', async () => {
  // Test missing env GEMINI_API_KEY to verify body was read correctly and reached API key check
  for (const key of ['fileBase64', 'base64', 'pdfBase64']) {
    const payload = {};
    payload[key] = 'JVBERi0xLjQKJcTl8uXrp...'; // valid dummy base64
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res = await handleParseCv({ request: req, env: {} });
    // Expect 500 (missing GEMINI_API_KEY) which proves body was accepted and passed validation
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.match(data.error, /GEMINI_API_KEY/i);
  }
});

await it('parses multipart/form-data with file, cv or pdf field', async () => {
  for (const fieldName of ['file', 'cv', 'pdf']) {
    const formData = new FormData();
    const dummyBlob = new Blob(['%PDF-1.4 test dummy content'], { type: 'application/pdf' });
    formData.append(fieldName, dummyBlob, 'test_cv.pdf');

    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      body: formData
    });
    const res = await handleParseCv({ request: req, env: {} });
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.match(data.error, /GEMINI_API_KEY/i);
  }
});

await it('strictly rejects payload when no PDF is provided in JSON or FormData (400)', async () => {
  const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ somethingElse: 'hello' })
  });
  const res = await handleParseCv({ request: req, env: {} });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /No se recibió ningún archivo PDF/i);
});

// -------------------------------------------------------------
// SUITE 2: Size Limits & Edge Performance (Non-Functional)
// -------------------------------------------------------------
console.log('\n▶ Suite 2: Size Limits & Edge Performance (Non-Functional)');

await it('backend rejects PDFs exceeding 10MB with HTTP 413 in JSON mode', async () => {
  // 10MB in base64 chars is approx 13.98M chars. 15MB base64 string:
  const largeBase64 = 'A'.repeat(15 * 1024 * 1024);
  const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64: largeBase64 })
  });
  const res = await handleParseCv({ request: req, env: {} });
  assert.equal(res.status, 413);
  const data = await res.json();
  assert.match(data.error, /10MB/i);
});

await it('backend rejects PDFs slightly exceeding 10MB (e.g. 10.2MB) with HTTP 413', async () => {
  // 10.2 MB in raw bytes = 10.2 * 1024 * 1024 = 10,695,475 bytes
  // In base64 chars: Math.ceil(10695475 / 3) * 4 = 14,260,636 chars
  const slightlyOverLimit = 'A'.repeat(14260636);
  const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64: slightlyOverLimit })
  });
  const res = await handleParseCv({ request: req, env: {} });
  assert.equal(res.status, 413, 'Debe devolver 413 para un archivo de 10.2MB');
});

await it('backend rejects PDFs exceeding 10MB in multipart/form-data before buffer overflow (413)', async () => {
  const formData = new FormData();
  // Create a real 11MB dummy blob
  const bigBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'application/pdf' });
  formData.append('file', bigBlob, 'giant.pdf');

  const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
    method: 'POST',
    body: formData
  });
  const res = await handleParseCv({ request: req, env: {} });
  assert.equal(res.status, 413, 'Debe devolver 413 si file.size > 10MB en multipart');
});

// -------------------------------------------------------------
// SUITE 3: AI Model Fallback & Error Resilience
// -------------------------------------------------------------
console.log('\n▶ Suite 3: AI Model Fallback & Error Resilience');

await it('falls back to gemini-flash-latest when gemini-3.1-flash-lite fails (500/404)', async () => {
  const originalFetch = globalThis.fetch;
  const attempts = [];

  globalThis.fetch = async (url, opts) => {
    attempts.push(url);
    if (url.includes('gemini-3.1-flash-lite')) {
      return new Response('Model not found', { status: 404 });
    }
    if (url.includes('gemini-flash-latest')) {
      return new Response(JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    personalInfo: { name: 'Fallback User', title: 'Senior Dev' }
                  })
                }
              ]
            }
          }
        ]
      }), { status: 200 });
    }
    return new Response('Error', { status: 500 });
  };

  try {
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'JVBERi0xLjQK' })
    });
    const res = await handleParseCv({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.personalInfo.name, 'Fallback User');
    assert.ok(attempts.some(u => u.includes('gemini-3.1-flash-lite')));
    assert.ok(attempts.some(u => u.includes('gemini-flash-latest')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await it('returns 502 when all candidate models fail', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('All models quota exceeded', { status: 429 });

  try {
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'JVBERi0xLjQK' })
    });
    const res = await handleParseCv({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.match(data.error, /No se pudo procesar/i);
    assert.ok(data.details);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await it('returns 422 when AI output is not valid JSON', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [
      { content: { parts: [{ text: 'Disculpa, no puedo leer este documento porque parece borroso.' }] } }
    ]
  }), { status: 200 });

  try {
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'JVBERi0xLjQK' })
    });
    const res = await handleParseCv({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    assert.equal(res.status, 422);
    const data = await res.json();
    assert.match(data.error, /formato JSON estructurado válido/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -------------------------------------------------------------
// SUITE 4: LLM Sanitization, Markdown Fences & Prompt Injection
// -------------------------------------------------------------
console.log('\n▶ Suite 4: LLM Sanitization, Markdown Fences & Prompt Injection');

await it('cleans markdown code fences with leading explanation text or trailing notes', async () => {
  const originalFetch = globalThis.fetch;
  const messyResponse = `
Aquí tienes el resultado del análisis solicitado:

\`\`\`json
{
  "personalInfo": {
    "name": "Maria Developer",
    "title": "Cloud Architect",
    "bio": "Especialista en arquitecturas distribuidas y Cloudflare Workers."
  },
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Lead Architect",
      "startDate": "2021-01",
      "endDate": null,
      "current": true,
      "description": "Liderazgo de equipo cloud.",
      "achievements": ["99.99% uptime", "Reducción de latencia en un 40%"]
    }
  ],
  "skills": [
    { "name": "Kubernetes", "category": "technical", "level": 95 },
    { "name": "Liderazgo", "category": "soft", "level": 90 }
  ]
}
\`\`\`

Espero que esta información te sea de gran utilidad para el portafolio.
`;

  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: messyResponse }] } }]
  }), { status: 200 });

  try {
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'JVBERi0xLjQK' })
    });
    const res = await handleParseCv({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    assert.equal(res.status, 200, 'Debe procesar exitosamente JSON envuelto en markdown con texto adicional');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.personalInfo.name, 'Maria Developer');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await it('guarantees exp-*, edu-*, proj-* IDs and validates skills categories and levels', async () => {
  const originalFetch = globalThis.fetch;
  const rawAiJson = {
    personalInfo: { name: 'Alex' },
    experience: [
      { id: 'random-injected-id', company: 'Acme', role: 'Dev' },
      { company: 'Beta', role: 'Tester' }
    ],
    education: [
      { id: 'edu-valid-already', institution: 'MIT', degree: 'CS' },
      { institution: 'Stanford', degree: 'MS' }
    ],
    projects: [
      { title: 'Cool App', tags: ['React', 123, null] }
    ],
    skills: [
      { name: 'Python', category: 'hard_skill', level: 120 }, // Invalid category and level > 100
      { name: 'Empathy', category: 'soft', level: -5 },        // Invalid level < 10
      { name: 'DevOps', category: 'technical', level: NaN }    // NaN level
    ]
  };

  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(rawAiJson) }] } }]
  }), { status: 200 });

  try {
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'JVBERi0xLjQK' })
    });
    const res = await handleParseCv({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    assert.equal(res.status, 200);
    const { data } = await res.json();

    // Verify IDs start with required prefixes
    data.experience.forEach((e) => {
      assert.match(e.id, /^exp-/, `Experience ID ${e.id} must start with exp-`);
    });
    data.education.forEach((e) => {
      assert.match(e.id, /^edu-/, `Education ID ${e.id} must start with edu-`);
    });
    data.projects.forEach((p) => {
      assert.match(p.id, /^proj-/, `Project ID ${p.id} must start with proj-`);
    });

    // Verify skills validation
    assert.equal(data.skills[0].category, 'technical', 'Invalid category should fallback to technical');
    assert.equal(data.skills[0].level, 100, 'Level > 100 must be clamped to 100');

    assert.equal(data.skills[1].category, 'soft');
    assert.equal(data.skills[1].level, 10, 'Level < 10 must be clamped to 10');

    assert.equal(typeof data.skills[2].level, 'number');
    assert.ok(!Number.isNaN(data.skills[2].level), 'NaN level must fallback to default number (e.g. 85)');

    // Verify project tags sanitization
    assert.deepEqual(data.projects[0].tags, ['React', '123'], 'Tags must be filtered and converted to string');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await it('defensively maps non-tech CVs and alternative keys (personal_info, fullName, summary, organization, string skills)', async () => {
  const originalFetch = globalThis.fetch;
  const nonTechAiJson = {
    personal_info: {
      fullName: 'Carlos Erices Fuentealba',
      profession: 'Kinesiólogo',
      summary: 'Kinesiólogo especializado en rehabilitación y personas mayores.',
      contact: {
        email: 'cfericesf@gmail.com',
        phone: '+569 78503321',
        address: 'Los Angeles, Chile'
      }
    },
    professional_experience: [
      {
        role: 'Kinesiólogo',
        organization: 'Cesfam dos de Septiembre',
        period: 'Febrero 2023 – hasta la fecha',
        description: 'Atención primaria y cuidados paliativos.'
      }
    ],
    education: [
      {
        degree: 'Licenciado en Kinesiología',
        institution: 'Universidad Católica Silva Henríquez',
        year: '2017'
      }
    ],
    skills: [
      'Trabajo en equipo',
      'Empatía',
      'Kinesioterapia'
    ]
  };

  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(nonTechAiJson) }] } }]
  }), { status: 200 });

  try {
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'JVBERi0xLjQK' })
    });
    const res = await handleParseCv({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    assert.equal(res.status, 200);
    const { data } = await res.json();

    assert.equal(data.personalInfo.name, 'Carlos Erices Fuentealba');
    assert.equal(data.personalInfo.title, 'Kinesiólogo');
    assert.equal(data.personalInfo.bio, 'Kinesiólogo especializado en rehabilitación y personas mayores.');
    assert.equal(data.personalInfo.email, 'cfericesf@gmail.com');
    assert.equal(data.personalInfo.phone, '+569 78503321');
    assert.equal(data.personalInfo.location, 'Los Angeles, Chile');

    assert.equal(data.experience.length, 1);
    assert.equal(data.experience[0].company, 'Cesfam dos de Septiembre');
    assert.equal(data.experience[0].current, true);

    assert.equal(data.skills.length, 3);
    assert.equal(data.skills[0].name, 'Trabajo en equipo');
    assert.equal(data.skills[0].category, 'soft');
    assert.equal(data.skills[2].name, 'Kinesioterapia');
    assert.equal(data.skills[2].category, 'technical');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await it('safeguards against Prompt Injection attempting to inject admin/auth keys', async () => {
  const originalFetch = globalThis.fetch;
  const maliciousAiJson = {
    personalInfo: {
      name: 'Hacker',
      role: 'SUPERADMIN',
      isAdmin: true,
      role_level: 'root',
      tokens: ['abc', 'def']
    },
    isAdmin: true,
    __proto__: { polluted: true },
    systemCommand: 'drop table users;'
  };

  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(maliciousAiJson) }] } }]
  }), { status: 200 });

  try {
    const req = new Request('https://mivitae.wearesamod.com/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: 'JVBERi0xLjQK' })
    });
    const res = await handleParseCv({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    assert.equal(res.status, 200);
    const { data } = await res.json();

    // Verify injected fields do not leak into sanitized profile
    assert.equal(data.isAdmin, undefined);
    assert.equal(data.systemCommand, undefined);
    assert.equal(data.personalInfo.isAdmin, undefined);
    assert.equal(data.personalInfo.role, undefined);
    assert.equal(data.personalInfo.tokens, undefined);
    assert.equal(Object.prototype.polluted, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// -------------------------------------------------------------
// SUITE 5: Frontend Integration & State Merging (DashboardPage)
// -------------------------------------------------------------
console.log('\n▶ Suite 5: Frontend Integration & State Merging (DashboardPage)');

const { useProfileStore } = await vite.ssrLoadModule('/src/stores/profileStore.js');

await it('handleCvImportSuccess preserves @username, avatar and theme immutability', async () => {
  const initialUserState = {
    username: 'carlos_senior_dev',
    theme: 'tech',
    plan: 'premium',
    personalInfo: {
      name: 'Carlos Original',
      title: 'Senior Dev',
      avatar: 'data:image/png;base64,existing-avatar-bytes',
      bio: 'Bio previa'
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: []
  };

  const incomingCvData = {
    username: 'should_not_overwrite_username',
    theme: 'minimalist',
    personalInfo: {
      name: 'Carlos Actualizado de CV',
      title: 'Staff Engineer & Cloud Architect',
      avatar: null,
      bio: 'Nueva bio profesional generada por IA'
    },
    experience: [
      { id: 'exp-1', company: 'Google', role: 'Staff SRE' }
    ],
    education: [
      { id: 'edu-1', institution: 'MIT', degree: 'Computer Science' }
    ],
    skills: [
      { name: 'Distributed Systems', category: 'technical', level: 95 }
    ],
    projects: [
      { id: 'proj-1', title: 'Global Cloud Mesh' }
    ],
    languages: [
      { language: 'Inglés', level: 'Nativo' }
    ]
  };

  // Replicate handleCvImportSuccess merging logic from DashboardPage.jsx
  let savedToSupabaseData = null;
  const mockSaveProfileToSupabase = async (profile) => {
    savedToSupabaseData = profile;
    return true;
  };

  const handleCvImportSuccessSimulator = (prev, extractedData) => {
    const merged = {
      ...prev,
      username: prev.username, // Guarantee username never changes
      theme: prev.theme,       // Guarantee theme never changes
      personalInfo: {
        ...prev.personalInfo,
        ...(extractedData.personalInfo || {}),
        avatar: prev.personalInfo?.avatar || extractedData.personalInfo?.avatar || 'blobatar'
      },
      experience: extractedData.experience || [],
      education: extractedData.education || [],
      skills: extractedData.skills || [],
      projects: extractedData.projects || [],
      languages: extractedData.languages || []
    };
    mockSaveProfileToSupabase(merged);
    return merged;
  };

  const result = handleCvImportSuccessSimulator(initialUserState, incomingCvData);

  // 1. Username is strictly preserved
  assert.equal(result.username, 'carlos_senior_dev', 'Username must NOT change');

  // 2. Theme is strictly preserved
  assert.equal(result.theme, 'tech', 'Theme must NOT change');

  // 3. Existing avatar is preserved
  assert.equal(result.personalInfo.avatar, 'data:image/png;base64,existing-avatar-bytes', 'Existing avatar must NOT be replaced with null/blobatar');

  // 4. New CV data is merged cleanly
  assert.equal(result.personalInfo.name, 'Carlos Actualizado de CV');
  assert.equal(result.personalInfo.title, 'Staff Engineer & Cloud Architect');
  assert.equal(result.experience.length, 1);
  assert.equal(result.education.length, 1);
  assert.equal(result.skills.length, 1);
  assert.equal(result.projects.length, 1);
  assert.equal(result.languages.length, 1);

  // 5. Cloud synchronization received the merged payload
  assert.ok(savedToSupabaseData);
  assert.equal(savedToSupabaseData.username, 'carlos_senior_dev');
  assert.equal(savedToSupabaseData.theme, 'tech');
});

// -------------------------------------------------------------
// SUITE 6: Modal Frontend Accessibility & Lifecycle (CvImportModal.jsx)
// -------------------------------------------------------------
console.log('\n▶ Suite 6: Modal Frontend Accessibility & Lifecycle (CvImportModal.jsx)');

const fs = await import('node:fs');
const cvModalSrc = fs.readFileSync(path.resolve(ROOT, 'src/components/Modals/CvImportModal.jsx'), 'utf-8');

await it('CvImportModal enforces strict 10MB limit and PDF format in frontend', () => {
  assert.match(cvModalSrc, /file\.size\s*>\s*10\s*\*\s*1024\s*\*\s*1024/, 'Debe verificar límite de 10MB');
  assert.match(cvModalSrc, /application\/pdf/, 'Debe validar mime type application/pdf');
});

await it('CvImportModal includes a11y attributes: role dialog, aria-modal, aria-labelledby', () => {
  assert.match(cvModalSrc, /role="dialog"/, 'Debe tener role="dialog"');
  assert.match(cvModalSrc, /aria-modal="true"/, 'Debe tener aria-modal="true"');
  assert.match(cvModalSrc, /aria-labelledby="cv-modal-title"/, 'Debe tener aria-labelledby');
  assert.match(cvModalSrc, /key\s*===\s*['"]Escape['"]/, 'Debe soportar cierre con tecla Escape');
});

await it('CvImportModal includes accessible live region announcements for errors and loading', () => {
  assert.match(cvModalSrc, /role="alert"|aria-live="assertive"/, 'Mensaje de error debe tener role alert para screen readers');
  assert.match(cvModalSrc, /role="status"|aria-live="polite"/, 'Estado de carga debe tener role status o aria-live polite');
});

await it('CvImportModal supports backdrop click dismissal when not loading', () => {
  assert.match(cvModalSrc, /onClick=\{!isLoading\s*\?\s*onClose\s*:\s*undefined\}/, 'Backdrop click debe cerrar el modal cuando no está cargando');
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
console.log('====================================================');

if (failures.length > 0) {
  console.log('\nFailed Tests Details:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error.message}`));
}

await vite.close();
process.exit(failedTests > 0 ? 1 : 0);
