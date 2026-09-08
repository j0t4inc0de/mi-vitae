import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// ponytail: Native zero-dependency test runner using Node assert + Vite SSR module loader
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🚀 PONYTAIL TEST RUNNER: FULL FUNCTIONAL SUITE');
console.log('====================================================\n');

const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom'
});

let passedTests = 0;
let failedTests = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

// Mock browser globals for SSR environment
globalThis.window = {
  location: { pathname: '/', hash: '', search: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {}
};

globalThis.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// -------------------------------------------------------------
// SUITE 1: ROUTER ENGINE & ROUTE MATCHING (src/router/Router.jsx)
// -------------------------------------------------------------
console.log('▶ Suite 1: Router Engine & Route Matching');

const { matchRoute } = await vite.ssrLoadModule('/src/router/Router.jsx');

it('matches root path / as landing page', () => {
  const res = matchRoute('/');
  assert.equal(res.name, 'landing');
  assert.equal(res.path, '/');
});

it('matches /dashboard route', () => {
  const res = matchRoute('/dashboard');
  assert.equal(res.name, 'dashboard');
  assert.equal(res.path, '/dashboard');
});

it('matches /admin route', () => {
  const res = matchRoute('/admin');
  assert.equal(res.name, 'admin');
  assert.equal(res.path, '/admin');
});

it('matches /login, /register, /auth, /signin with correct initialMode', () => {
  const login = matchRoute('/login');
  assert.equal(login.name, 'auth');
  assert.equal(login.params.initialMode, 'login');

  const register = matchRoute('/register');
  assert.equal(register.name, 'auth');
  assert.equal(register.params.initialMode, 'register');

  const auth = matchRoute('/auth');
  assert.equal(auth.name, 'auth');
  assert.equal(auth.params.initialMode, 'login');

  const signin = matchRoute('/signin');
  assert.equal(signin.name, 'auth');
  assert.equal(signin.params.initialMode, 'login');
});

it('matches dynamic portfolio route /:username and strips query/hash', () => {
  const res = matchRoute('/carlos_dev?ref=linkedin#experience');
  assert.equal(res.name, 'portfolio');
  assert.equal(res.params.username, 'carlos_dev');
  assert.equal(res.path, '/carlos_dev');
});

// -------------------------------------------------------------
// SUITE 2: MOCK DATA INTEGRITY (src/data/mockProfiles.js)
// -------------------------------------------------------------
console.log('\n▶ Suite 2: Mock Profiles & Schema Completeness');

const { INITIAL_MOCK_PROFILES } = await vite.ssrLoadModule('/src/data/mockProfiles.js');

it('has all 5 core mock profiles populated', () => {
  const expectedProfiles = ['carlos_dev', 'antonia_ux', 'valeria_psico', 'rodrigo_ops', 'abogado_consultor'];
  for (const slug of expectedProfiles) {
    assert.ok(INITIAL_MOCK_PROFILES[slug], `Missing expected profile: ${slug}`);
  }
});

it('each profile satisfies the required schema contract', () => {
  for (const [slug, profile] of Object.entries(INITIAL_MOCK_PROFILES)) {
    assert.equal(profile.username, slug, `${slug}: username field mismatch`);
    assert.ok(profile.personalInfo, `${slug}: missing personalInfo`);
    assert.ok(profile.personalInfo.name, `${slug}: missing personalInfo.name`);
    assert.ok(profile.personalInfo.title, `${slug}: missing personalInfo.title`);
    assert.ok(profile.personalInfo.email, `${slug}: missing personalInfo.email`);
    assert.ok(Array.isArray(profile.skills), `${slug}: skills must be array`);
    assert.ok(Array.isArray(profile.experience), `${slug}: experience must be array`);
    assert.ok(Array.isArray(profile.education), `${slug}: education must be array`);
    assert.ok(Array.isArray(profile.projects), `${slug}: projects must be array`);
    assert.ok(profile.floatingButton, `${slug}: missing floatingButton`);
    assert.ok(typeof profile.floatingButton.enabled === 'boolean', `${slug}: floatingButton.enabled must be bool`);
    assert.ok(profile.analytics, `${slug}: missing analytics`);
    assert.equal(typeof profile.analytics.views, 'number', `${slug}: analytics.views must be number`);
  }
});

// -------------------------------------------------------------
// SUITE 3: ZUSTAND PROFILE STORE (src/stores/profileStore.js)
// -------------------------------------------------------------
console.log('\n▶ Suite 3: Profile Store Business Logic & Edge Cases');

const { useProfileStore } = await vite.ssrLoadModule('/src/stores/profileStore.js');

it('validates username availability correctly and blocks reserved routes', () => {
  const store = useProfileStore.getState();

  // Existing usernames
  assert.equal(store.isUsernameAvailable('carlos_dev'), false, 'carlos_dev should not be available');
  assert.equal(store.isUsernameAvailable('CARLOS_DEV'), false, 'carlos_dev case-insensitive check failed');

  // Reserved routes
  const reserved = ['dashboard', 'admin', 'login', 'register', 'api', 'app', 'settings', 'help', 'pricing'];
  for (const r of reserved) {
    assert.equal(store.isUsernameAvailable(r), false, `Reserved slug '${r}' must be unavailable`);
    assert.equal(store.isUsernameAvailable(r.toUpperCase()), false, `Reserved slug '${r.toUpperCase()}' must be unavailable`);
  }

  // Blank or empty
  assert.equal(store.isUsernameAvailable(''), false, 'Empty string must be unavailable');
  assert.equal(store.isUsernameAvailable('   '), false, 'Whitespace must be unavailable');

  // Brand new available username
  assert.equal(store.isUsernameAvailable('maria_cloud_2026'), true, 'Unique username should be available');
});

it('tests addProfile, getProfileByUsername and setActiveUsername', () => {
  const store = useProfileStore.getState();
  const testUser = 'tester_ponytail';

  store.addProfile({
    username: testUser,
    personalInfo: {
      name: 'Tester Ponytail',
      title: 'Senior QA Engineer',
      email: 'tester@wearesamod.com'
    },
    theme: 'tech',
    skills: [{ id: 'sk-1', name: 'Automated Testing', level: 99 }]
  });

  const retrieved = store.getProfileByUsername(testUser);
  assert.ok(retrieved, 'Profile must be retrievable after addProfile');
  assert.equal(retrieved.username, testUser);
  assert.equal(retrieved.personalInfo.name, 'Tester Ponytail');
  assert.equal(retrieved.theme, 'tech');

  // Case insensitive retrieval
  const retrievedUpper = store.getProfileByUsername(testUser.toUpperCase());
  assert.ok(retrievedUpper, 'Profile lookup must be case-insensitive');

  // Set active username
  store.setActiveUsername(testUser);
  assert.equal(useProfileStore.getState().activeUsername, testUser);
  assert.equal(useProfileStore.getState().getActiveProfile().username, testUser);
});

it('tests updateProfile immutability and partial update', () => {
  const store = useProfileStore.getState();
  const testUser = 'tester_ponytail';

  store.updateProfile(testUser, {
    personalInfo: {
      bio: 'Audited and verified by Ponytail.'
    }
  });

  const updated = store.getProfileByUsername(testUser);
  assert.equal(updated.personalInfo.bio, 'Audited and verified by Ponytail.');
  assert.equal(updated.personalInfo.name, 'Tester Ponytail', 'Existing personalInfo fields must be preserved');
});

it('tests analytics metrics recording (views, contactClicks, cvDownloads)', () => {
  const store = useProfileStore.getState();
  const testUser = 'tester_ponytail';

  const initialViews = store.getProfileByUsername(testUser).analytics.views || 0;
  store.recordView(testUser);
  assert.equal(store.getProfileByUsername(testUser).analytics.views, initialViews + 1);

  const initialClicks = store.getProfileByUsername(testUser).analytics.contactClicks || 0;
  store.recordClick(testUser);
  assert.equal(store.getProfileByUsername(testUser).analytics.contactClicks, initialClicks + 1);

  const initialDownloads = store.getProfileByUsername(testUser).analytics.cvDownloads || 0;
  store.recordDownload(testUser);
  assert.equal(store.getProfileByUsername(testUser).analytics.cvDownloads, initialDownloads + 1);
});

it('tests free trial activation and feedback storage', () => {
  const store = useProfileStore.getState();
  const testUser = 'tester_ponytail';

  store.activateFreeTrial(testUser, {
    role: 'tech',
    cvObstacle: 'static_pdf',
    referral: 'samod'
  });

  const profile = store.getProfileByUsername(testUser);
  assert.equal(profile.plan, 'free_trial');
  assert.equal(profile.feedbackSurveyCompleted, true);
  assert.ok(profile.planExpiresAt);
});

it('tests global modal state openers & closers', () => {
  const store = useProfileStore.getState();

  // Register modal
  store.openRegisterModal({ username: 'ana_dev', theme: 'creative' });
  assert.equal(useProfileStore.getState().isRegisterModalOpen, true);
  assert.equal(useProfileStore.getState().registerModalPrefill.username, 'ana_dev');
  store.closeRegisterModal();
  assert.equal(useProfileStore.getState().isRegisterModalOpen, false);

  // Flow checkout modal
  store.openFlowModal({ username: 'ana_dev', amount: 3490 });
  assert.equal(useProfileStore.getState().isFlowModalOpen, true);
  assert.equal(useProfileStore.getState().flowModalData.amount, 3490);
  store.closeFlowModal();
  assert.equal(useProfileStore.getState().isFlowModalOpen, false);

  // Global loader state
  store.showLoading('Generando código QR...');
  assert.equal(useProfileStore.getState().isGlobalLoading, true);
  assert.equal(useProfileStore.getState().loadingMessage, 'Generando código QR...');
  store.hideLoading();
  assert.equal(useProfileStore.getState().isGlobalLoading, false);
  assert.equal(useProfileStore.getState().loadingMessage, '');
});

// -------------------------------------------------------------
// SUITE 4: THEME RENDERER POLYMORPHISM (src/components/Themes/ThemeRenderer.jsx)
// -------------------------------------------------------------
console.log('\n▶ Suite 4: Theme Renderer Polymorphic Mapping');

const themeRendererContent = fs.readFileSync(path.join(ROOT, 'src/components/Themes/ThemeRenderer.jsx'), 'utf8');

it('supports all 5 production themes without fallback loss', () => {
  const themes = ['tech', 'creative', 'minimalist', 'warm', 'executive'];
  for (const t of themes) {
    assert.ok(themeRendererContent.includes(`${t}:`) || themeRendererContent.includes(`'${t}'`), `ThemeRenderer must support '${t}'`);
  }
});

// -------------------------------------------------------------
// SUITE 5: COLOR PALETTE ARCHITECTURE (src/theme/palette.js)
// -------------------------------------------------------------
console.log('\n▶ Suite 5: Color Palette & Dynamic Theme Tokens');

const { rawPalette, semanticTokens, generateCssVariables } = await vite.ssrLoadModule('/src/theme/palette.js');

it('rawPalette contains valid hex colors with 50-950 scale', () => {
  assert.ok(rawPalette, 'rawPalette must exist');
  const paletteKeys = Object.keys(rawPalette);
  assert.ok(paletteKeys.length >= 3, 'rawPalette should have multiple color scales');
  
  for (const key of paletteKeys) {
    const scale = rawPalette[key];
    assert.ok(scale['500'], `Scale ${key} must have shade 500`);
    assert.match(scale['500'], /^#[0-9a-fA-F]{6}$/, `Scale ${key} 500 must be valid 6-char hex`);
  }
});

it('generates valid CSS variables string for injection', () => {
  const cssVars = generateCssVariables();
  assert.ok(typeof cssVars === 'string');
  assert.ok(cssVars.includes('--primary:'));
  assert.ok(cssVars.includes('--accent:'));
  assert.ok(cssVars.includes('--highlight:'));
  assert.ok(cssVars.includes('--glow:'));
});

// -------------------------------------------------------------
// SUITE 6: SERVERLESS EDGE, CLOUDFLARE PAGES & SUPABASE CLOUD
// -------------------------------------------------------------
console.log('\n▶ Suite 6: Serverless Edge, Cloudflare Pages & Supabase Cloud');

it('verifies Cloudflare Pages SPA redirects and edge security headers', () => {
  const redirectsPath = path.join(ROOT, 'public', '_redirects');
  const headersPath = path.join(ROOT, 'public', '_headers');
  const wranglerPath = path.join(ROOT, 'wrangler.toml');

  assert.ok(fs.existsSync(redirectsPath), 'public/_redirects must exist');
  assert.ok(fs.existsSync(headersPath), 'public/_headers must exist');
  assert.ok(fs.existsSync(wranglerPath), 'wrangler.toml must exist');

  const redirectsContent = fs.readFileSync(redirectsPath, 'utf-8');
  assert.match(redirectsContent, /\/index\.html\s+200/, '_redirects must route to index.html with 200');

  const headersContent = fs.readFileSync(headersPath, 'utf-8');
  assert.ok(headersContent.includes('X-Content-Type-Options: nosniff'), '_headers must contain security headers');
  assert.ok(headersContent.includes('Cache-Control: public, max-age=31536000'), '_headers must configure immutable asset cache');
});

it('verifies Supabase SQL production schema completeness', () => {
  const schemaPath = path.join(ROOT, 'supabase', 'schema.sql');
  assert.ok(fs.existsSync(schemaPath), 'supabase/schema.sql must exist');

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  assert.ok(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'schema must define profiles table');
  assert.ok(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.feedbacks'), 'schema must define feedbacks table');
  assert.ok(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.subscriptions'), 'schema must define subscriptions table');
  assert.ok(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.transactions'), 'schema must define transactions table');
  assert.ok(schemaContent.includes('handle_new_user()'), 'schema must define auto new user trigger');
  assert.ok(schemaContent.includes('increment_analytics'), 'schema must define analytics RPC function');
  assert.ok(schemaContent.includes('ENABLE ROW LEVEL SECURITY'), 'schema must enable RLS');
});

it('verifies Cloudflare Pages Functions serverless endpoints exist', () => {
  const functionsDir = path.join(ROOT, 'functions', 'api');
  const webhookFile = path.join(functionsDir, 'flow-webhook.js');
  const createOrderFile = path.join(functionsDir, 'create-flow-order.js');
  const emailFile = path.join(functionsDir, 'send-email.js');
  const avatarFile = path.join(functionsDir, 'upload-avatar.js');
  const healthFile = path.join(functionsDir, 'health.js');

  assert.ok(fs.existsSync(webhookFile), 'functions/api/flow-webhook.js must exist');
  assert.ok(fs.existsSync(createOrderFile), 'functions/api/create-flow-order.js must exist');
  assert.ok(fs.existsSync(emailFile), 'functions/api/send-email.js must exist');
  assert.ok(fs.existsSync(avatarFile), 'functions/api/upload-avatar.js must exist');
  assert.ok(fs.existsSync(healthFile), 'functions/api/health.js must exist');

  const webhookContent = fs.readFileSync(webhookFile, 'utf-8');
  assert.ok(webhookContent.includes('export async function onRequestPost'), 'flow-webhook must export onRequestPost');

  const emailContent = fs.readFileSync(emailFile, 'utf-8');
  assert.ok(emailContent.includes('export async function onRequestPost'), 'send-email must export onRequestPost');
});

const supabaseModule = await vite.ssrLoadModule('/src/lib/supabaseClient.js');
const emailModule = await vite.ssrLoadModule('/src/lib/emailService.js');

it('verifies Supabase client and email service frontend modules load properly', () => {
  assert.ok(typeof supabaseModule.signUpWithSupabase === 'function');
  assert.ok(typeof supabaseModule.signInWithSupabase === 'function');
  assert.ok(typeof supabaseModule.fetchProfileFromSupabase === 'function');
  assert.ok(typeof supabaseModule.saveProfileToSupabase === 'function');

  assert.ok(typeof emailModule.sendWelcomeEmail === 'function');
  assert.ok(typeof emailModule.sendPaymentReceiptEmail === 'function');
});

it('verifies GitHub Actions Supabase keep-alive cron workflow', () => {
  const keepAlivePath = path.join(ROOT, '.github', 'workflows', 'supabase-keepalive.yml');
  assert.ok(fs.existsSync(keepAlivePath), 'supabase-keepalive.yml must exist');

  const content = fs.readFileSync(keepAlivePath, 'utf-8');
  assert.ok(content.includes('cron:'), 'workflow must define cron schedule');
  assert.ok(content.includes('VITE_SUPABASE_URL'), 'workflow must use Supabase URL secret');
});

await vite.close();

// -------------------------------------------------------------
// SUMMARY SCOREBOARD
// -------------------------------------------------------------
console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
}
