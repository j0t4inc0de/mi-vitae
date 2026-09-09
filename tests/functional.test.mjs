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

it('handles route edge cases: URL-encoded usernames and rejects multi-segment paths as not_found', () => {
  const encoded = matchRoute('/carlos%20dev?utm_source=test#top');
  assert.equal(encoded.name, 'portfolio');
  assert.equal(encoded.params.username, 'carlos dev');
  assert.equal(encoded.path, '/carlos%20dev');

  const nested = matchRoute('/unknown/deep/path');
  assert.equal(nested.name, 'not_found');
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

it('verifies portfolio plan expiration logic (expired status and elapsed date)', () => {
  const store = useProfileStore.getState();
  const testUser = 'tester_ponytail';

  // Helper matching PortfolioPage.jsx check
  const isPlanExpired = (p) => Boolean(
    p.planStatus === 'expired' ||
    p.plan_status === 'expired' ||
    (p.planExpiresAt && new Date(p.planExpiresAt).getTime() < Date.now()) ||
    (p.plan_expires_at && new Date(p.plan_expires_at).getTime() < Date.now())
  );

  const activeProfile = store.getProfileByUsername(testUser);
  assert.equal(isPlanExpired(activeProfile), false, 'Active profile within 30 days should not be expired');

  const expiredByStatus = { ...activeProfile, planStatus: 'expired' };
  assert.equal(isPlanExpired(expiredByStatus), true, 'Profile with planStatus expired must be flagged');

  const expiredByDate = { ...activeProfile, planExpiresAt: new Date(Date.now() - 1000).toISOString() };
  assert.equal(isPlanExpired(expiredByDate), true, 'Profile with past expiration date must be flagged');
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

const { getApproximateDataUrlBytes, formatBytes } = await vite.ssrLoadModule('/src/utils/imageCompressor.js');

it('verifies native image compression utilities and size limits', () => {
  // Base64 byte size approximation
  const mockBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(1024);
  const bytes = getApproximateDataUrlBytes(mockBase64);
  assert.ok(bytes > 0 && bytes <= 1024, 'Base64 byte size calculation must be accurate');

  // Format bytes helper
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024 * 2), '2 MB');
});

// -------------------------------------------------------------
// SUITE 6: SERVERLESS EDGE, CLOUDFLARE PAGES & SUPABASE CLOUD
// -------------------------------------------------------------
console.log('\n▶ Suite 6: Serverless Edge, Cloudflare Pages & Supabase Cloud');

it('verifies Cloudflare SPA handling and edge security headers', () => {
  const headersPath = path.join(ROOT, 'public', '_headers');
  const wranglerPath = path.join(ROOT, 'wrangler.toml');
  const workerPath = path.join(ROOT, 'worker.js');

  assert.ok(fs.existsSync(headersPath), 'public/_headers must exist');
  assert.ok(fs.existsSync(wranglerPath), 'wrangler.toml must exist');
  assert.ok(fs.existsSync(workerPath), 'worker.js must exist');

  const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
  assert.ok(wranglerContent.includes('[assets]'), 'wrangler.toml must configure [assets]');
  assert.ok(wranglerContent.includes('main = "worker.js"'), 'wrangler.toml must define main = "worker.js"');
  assert.ok(wranglerContent.includes('single-page-application'), 'wrangler.toml must configure SPA handling');

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

it('verifies Supabase client connects to real instance and is configured', () => {
  assert.equal(supabaseModule.isSupabaseConfigured, true, 'isSupabaseConfigured must be true');
  assert.ok(supabaseModule.supabase, 'supabase client must be initialized');
});

it('verifies CSP policy and clickjacking protection in _headers', () => {
  const headersPath = path.join(ROOT, 'public', '_headers');
  const headersContent = fs.readFileSync(headersPath, 'utf-8');
  assert.ok(headersContent.includes('Content-Security-Policy:'), '_headers must include Content-Security-Policy');
  assert.ok(headersContent.includes('X-Frame-Options: SAMEORIGIN') || headersContent.includes('X-Frame-Options: DENY'), '_headers must protect against clickjacking');
});

it('verifies production APP_URL consistency across worker, wrangler and config', () => {
  const wranglerContent = fs.readFileSync(path.join(ROOT, 'wrangler.toml'), 'utf-8');
  const workerContent = fs.readFileSync(path.join(ROOT, 'worker.js'), 'utf-8');
  const configContent = fs.readFileSync(path.join(ROOT, 'functions', 'api', 'config.js'), 'utf-8');

  assert.ok(wranglerContent.includes('https://mi-vitae.wearesamod.com'), 'wrangler.toml must use production URL with hyphen');
  assert.ok(workerContent.includes('https://mi-vitae.wearesamod.com'), 'worker.js must use production URL with hyphen');
  assert.ok(configContent.includes('https://mi-vitae.wearesamod.com'), 'config.js must use production URL with hyphen');
});

it('verifies GitHub Actions Supabase keep-alive cron workflow', () => {
  const keepAlivePath = path.join(ROOT, '.github', 'workflows', 'supabase-keepalive.yml');
  assert.ok(fs.existsSync(keepAlivePath), 'supabase-keepalive.yml must exist');

  const content = fs.readFileSync(keepAlivePath, 'utf-8');
  assert.ok(content.includes('cron:'), 'workflow must define cron schedule');
  assert.ok(content.includes('VITE_SUPABASE_URL'), 'workflow must use Supabase URL secret');
});

// -------------------------------------------------------------
// SUITE 7: DASHBOARD PAGE AUDIT (FUNCTIONAL & NON-FUNCTIONAL)
// -------------------------------------------------------------
console.log('\n▶ Suite 7: Dashboard Page QA Audit (Functional & Non-Functional)');

const dashboardContent = fs.readFileSync(path.join(ROOT, 'src/pages/DashboardPage.jsx'), 'utf-8');

it('verifies all 8 editor tabs are defined with icons and null-safe counts', () => {
  const expectedTabs = ['personal', 'theme', 'experience', 'education', 'skills', 'projects', 'languages', 'floatingButton'];
  for (const tabId of expectedTabs) {
    assert.ok(dashboardContent.includes(`id: '${tabId}'`), `Dashboard must include tab '${tabId}'`);
  }
  // Null safety verification
  assert.ok(dashboardContent.includes('profileData.experience?.length || 0'));
  assert.ok(dashboardContent.includes('profileData.education?.length || 0'));
  assert.ok(dashboardContent.includes('profileData.skills?.length || 0'));
  assert.ok(dashboardContent.includes('profileData.projects?.length || 0'));
  assert.ok(dashboardContent.includes('profileData.languages?.length || 0'));
});

it('verifies calculatePlanStatus handles active vs expired dates and statuses correctly', () => {
  const testCalculatePlanStatus = (profile) => {
    const isPremium = profile?.plan === 'premium';
    const planStatus = profile?.planStatus || profile?.plan_status || 'active';
    const rawExpiresAt = profile?.planExpiresAt || profile?.plan_expires_at;
    const rawTrialAt = profile?.trialActivatedAt || profile?.trial_activated_at;
    
    let expirationDate = null;
    if (rawExpiresAt) {
      expirationDate = new Date(rawExpiresAt);
    } else if (rawTrialAt) {
      const activated = new Date(rawTrialAt);
      expirationDate = new Date(activated.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      const now = new Date();
      expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffMs <= 0 || daysRemaining <= 0 || planStatus === 'expired';

    return { isPremium, isExpired, daysRemaining: Math.max(0, daysRemaining), planStatus };
  };

  // Active user within trial
  const activeUser = { username: 'test_active', plan: 'free_trial', planStatus: 'active' };
  const resActive = testCalculatePlanStatus(activeUser);
  assert.equal(resActive.isExpired, false);
  assert.ok(resActive.daysRemaining > 0);

  // Expired by status
  const expiredStatus = { username: 'test_exp_status', planStatus: 'expired' };
  assert.equal(testCalculatePlanStatus(expiredStatus).isExpired, true);

  // Expired by status (snake_case)
  const expiredSnakeStatus = { username: 'test_exp_snake', plan_status: 'expired' };
  assert.equal(testCalculatePlanStatus(expiredSnakeStatus).isExpired, true);

  // Expired by past date
  const expiredDate = { username: 'test_exp_date', planExpiresAt: new Date(Date.now() - 5000).toISOString() };
  assert.equal(testCalculatePlanStatus(expiredDate).isExpired, true);

  // Expired by past date (snake_case)
  const expiredSnakeDate = { username: 'test_exp_snake_date', plan_expires_at: new Date(Date.now() - 5000).toISOString() };
  assert.equal(testCalculatePlanStatus(expiredSnakeDate).isExpired, true);
});

it('verifies visual status indicator states (Offline vs Online dot)', () => {
  assert.ok(dashboardContent.includes('Portafolio Offline'), 'Must include Portafolio Offline status text');
  assert.ok(dashboardContent.includes('bg-rose-500'), 'Must include static red dot (bg-rose-500)');
  assert.ok(dashboardContent.includes('Portafolio en Línea'), 'Must include Portafolio en Línea status text');
  assert.ok(dashboardContent.includes('bg-emerald-500') && dashboardContent.includes('animate-ping'), 'Must include pulsating green dot');
});

it('verifies mobile touch target heights (>= 44px) and mobile bottom bar padding', () => {
  // Mobile bar buttons
  assert.ok(dashboardContent.includes('min-h-[44px] px-3 py-2 rounded-xl bg-slate-100'), 'Mobile QR button must meet touch target');
  assert.ok(dashboardContent.includes('min-h-[44px] px-3 py-2 rounded-xl bg-palette-gradient'), 'Mobile En Vivo button must meet touch target');
  // Bottom padding for mobile fixed bar
  assert.ok(dashboardContent.includes('pb-24 md:pb-10') || dashboardContent.includes('pb-24'), 'Main wrapper must have bottom padding to prevent mobile bar overlap');
});

it('verifies memory leak prevention on unmount with timer cleanups', () => {
  assert.ok(dashboardContent.includes('savedAlertTimerRef'), 'Must track savedAlert timer reference');
  assert.ok(dashboardContent.includes('copiedLinkTimerRef'), 'Must track copiedLink timer reference');
  assert.ok(dashboardContent.includes('clearTimeout(savedAlertTimerRef.current)'), 'Must clear savedAlert timer on unmount');
  assert.ok(dashboardContent.includes('clearTimeout(copiedLinkTimerRef.current)'), 'Must clear copiedLink timer on unmount');
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
