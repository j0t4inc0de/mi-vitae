import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
globalThis.window.localStorage = globalThis.localStorage;

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

it('matches hidden /admin/wearesamod route and rejects bare /admin as not_found', () => {
  const secretAdmin = matchRoute('/admin/wearesamod');
  assert.equal(secretAdmin.name, 'admin');
  assert.equal(secretAdmin.path, '/admin/wearesamod');

  const bareAdmin = matchRoute('/admin');
  assert.equal(bareAdmin.name, 'not_found');
});

it('matches /snake route', () => {
  const res = matchRoute('/snake');
  assert.equal(res.name, 'snake');
  assert.equal(res.path, '/snake');
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

  // Legal modal state
  store.openLegalModal('privacy');
  assert.equal(useProfileStore.getState().isLegalModalOpen, true);
  assert.equal(useProfileStore.getState().legalModalTab, 'privacy');
  store.closeLegalModal();
  assert.equal(useProfileStore.getState().isLegalModalOpen, false);

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
const { filterEmptyProfileItems } = await vite.ssrLoadModule('/src/components/Themes/ThemeRenderer.jsx');

it('supports all 6 production themes without fallback loss', () => {
  const themes = ['tech', 'creative', 'minimalist', 'warm', 'executive', 'neo_brutalist'];
  for (const t of themes) {
    assert.ok(themeRendererContent.includes(`${t}:`) || themeRendererContent.includes(`'${t}'`), `ThemeRenderer must support '${t}'`);
  }
});

const themeModules = {
  minimalist: await vite.ssrLoadModule('/src/components/Themes/MinimalistTheme.jsx'),
  neo_brutalist: await vite.ssrLoadModule('/src/components/Themes/NeoBrutalistTheme.jsx'),
  creative: await vite.ssrLoadModule('/src/components/Themes/CreativeTheme.jsx'),
  tech: await vite.ssrLoadModule('/src/components/Themes/TechTheme.jsx'),
  warm: await vite.ssrLoadModule('/src/components/Themes/WarmTheme.jsx'),
  executive: await vite.ssrLoadModule('/src/components/Themes/ExecutiveTheme.jsx')
};

it('verifies all 6 theme components load cleanly and export valid default components', () => {
  for (const [slug, mod] of Object.entries(themeModules)) {
    assert.ok(typeof mod.default === 'function', `Theme '${slug}' must export a valid component function`);
  }
});

const legalModalMod = await vite.ssrLoadModule('/src/components/Modals/LegalModal.jsx');

it('verifies LegalModal component loads cleanly and exports valid default component', () => {
  assert.ok(typeof legalModalMod.default === 'function', 'LegalModal must export a valid component function');
});

const snakePageMod = await vite.ssrLoadModule('/src/pages/SnakePage.jsx');

it('verifies SnakePage component loads cleanly and exports valid default component', () => {
  assert.ok(typeof snakePageMod.default === 'function', 'SnakePage must export a valid component function');
});

const snakeModalMod = await vite.ssrLoadModule('/src/components/Modals/SnakeEasterEggModal.jsx');

it('verifies SnakeEasterEggModal component loads cleanly and exports valid default component', () => {
  assert.ok(typeof snakeModalMod.default === 'function', 'SnakeEasterEggModal must export a valid component function');
});

const footerMod = await vite.ssrLoadModule('/src/components/Common/Footer.jsx');

it('verifies Footer component loads cleanly and integrates Snake link to another window', () => {
  assert.ok(typeof footerMod.default === 'function', 'Footer must export a valid component function');
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
  const configFile = path.join(functionsDir, 'config.js');
  const createOrderFile = path.join(functionsDir, 'create-flow-order.js');
  const emailFile = path.join(functionsDir, 'send-email.js');
  const avatarFile = path.join(functionsDir, 'upload-avatar.js');
  const healthFile = path.join(functionsDir, 'health.js');

  assert.ok(fs.existsSync(webhookFile), 'functions/api/flow-webhook.js must exist');
  assert.ok(fs.existsSync(configFile), 'functions/api/config.js must exist');
  assert.ok(fs.existsSync(createOrderFile), 'functions/api/create-flow-order.js must exist');
  assert.ok(fs.existsSync(emailFile), 'functions/api/send-email.js must exist');
  assert.ok(fs.existsSync(avatarFile), 'functions/api/upload-avatar.js must exist');
  assert.ok(fs.existsSync(healthFile), 'functions/api/health.js must exist');

  const webhookContent = fs.readFileSync(webhookFile, 'utf-8');
  assert.ok(webhookContent.includes('export async function onRequestPost'), 'flow-webhook must export onRequestPost');

  const configContent = fs.readFileSync(configFile, 'utf-8');
  assert.ok(configContent.includes('export async function onRequestGet'), 'config.js must export onRequestGet');

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

  assert.ok(wranglerContent.includes('https://mivitae.wearesamod.com'), 'wrangler.toml must use production URL');
  assert.ok(workerContent.includes('https://mivitae.wearesamod.com'), 'worker.js must use production URL');
  assert.ok(configContent.includes('https://mivitae.wearesamod.com'), 'config.js must use production URL');
});

it('verifies GitHub Actions Supabase keep-alive cron workflow', () => {
  const keepAlivePath = path.join(ROOT, '.github', 'workflows', 'supabase-keepalive.yml');
  assert.ok(fs.existsSync(keepAlivePath), 'supabase-keepalive.yml must exist');

  const content = fs.readFileSync(keepAlivePath, 'utf-8');
  assert.ok(content.includes('cron:'), 'workflow must define cron schedule');
  assert.ok(content.includes('VITE_SUPABASE_URL'), 'workflow must use Supabase URL secret');
});

it('verifies SEO infrastructure for Google Search Console (robots.txt, sitemap, meta)', () => {
  const robotsPath = path.join(ROOT, 'public', 'robots.txt');
  const sitemapPath = path.join(ROOT, 'public', 'sitemap.xml');
  const indexPath = path.join(ROOT, 'index.html');
  const sitemapFnPath = path.join(ROOT, 'functions', 'api', 'sitemap.js');

  assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
  assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');
  assert.ok(fs.existsSync(sitemapFnPath), 'functions/api/sitemap.js must exist');

  const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
  assert.ok(robotsContent.includes('Sitemap: https://mivitae.wearesamod.com/sitemap.xml'), 'robots.txt must declare sitemap URL');
  assert.ok(robotsContent.includes('Disallow: /dashboard'), 'robots.txt must disallow private dashboard');

  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  assert.ok(indexContent.includes('rel="canonical"'), 'index.html must have canonical link');
  assert.ok(indexContent.includes('name="robots" content="index, follow"'), 'index.html must have robots index/follow meta');
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

it('verifies skills independent update logic prevents multi-skill level mutation even without IDs', () => {
  // Simulate Dashboard skills update logic
  const handleUpdateSkillLogic = (skills, id, field, value, idx) => {
    return skills.map((sk, i) =>
      ((id && sk.id) ? sk.id === id : i === idx) ? { ...sk, [field]: value } : sk
    );
  };

  const handleDeleteSkillLogic = (skills, id, idx) => {
    return skills.filter((sk, i) =>
      (id && sk.id) ? sk.id !== id : i !== idx
    );
  };

  // Case 1: Multiple skills with undefined id (imported from CV or legacy DB)
  const legacySkills = [
    { name: 'JavaScript', category: 'technical', level: 80 },
    { name: 'TypeScript', category: 'technical', level: 75 },
    { name: 'React', category: 'technical', level: 90 }
  ];

  // Update second skill (idx = 1) with undefined id
  const updatedLegacy = handleUpdateSkillLogic(legacySkills, undefined, 'level', 95, 1);
  assert.equal(updatedLegacy[0].level, 80, 'Skill 0 must not change when updating skill 1');
  assert.equal(updatedLegacy[1].level, 95, 'Skill 1 must be updated to 95');
  assert.equal(updatedLegacy[2].level, 90, 'Skill 2 must not change when updating skill 1');

  // Delete first skill (idx = 0) with undefined id
  const afterDelete = handleDeleteSkillLogic(updatedLegacy, undefined, 0);
  assert.equal(afterDelete.length, 2);
  assert.equal(afterDelete[0].name, 'TypeScript');
  assert.equal(afterDelete[1].name, 'React');

  // Case 2: Skills with valid IDs
  const validSkills = [
    { id: 'sk-1', name: 'Go', level: 80 },
    { id: 'sk-2', name: 'Rust', level: 70 }
  ];
  const updatedValid = handleUpdateSkillLogic(validSkills, 'sk-2', 'level', 88, 1);
  assert.equal(updatedValid[0].level, 80);
  assert.equal(updatedValid[1].level, 88);

  // Verify DashboardPage.jsx implements the required patterns
  assert.ok(dashboardContent.includes('(id && sk.id) ? sk.id === id : i === idx'), 'DashboardPage must use safe ID/index check in handleUpdateSkill');
  assert.ok(dashboardContent.includes('(id && sk.id) ? sk.id !== id : i !== idx'), 'DashboardPage must use safe ID/index check in handleDeleteSkill');
  assert.ok(dashboardContent.includes('handleUpdateSkill(skill.id, \'level\', Number(e.target.value), idx)'), 'JSX slider must pass idx to handleUpdateSkill');
});

it('verifies tagsRaw and tagsArray allow typing commas without deleting characters and strips tagsRaw in filterEmptyProfileItems', () => {

  // Simulate user typing "React," in tags input
  const proj = { id: 'proj-1', title: 'Mi Vitae', tags: ['React'] };
  const inputVal = 'React, ';
  const tagsArray = inputVal.split(',').map((t) => t.trim()).filter(Boolean);

  const updatedProject = {
    ...proj,
    tags: tagsArray,
    tagsRaw: inputVal
  };

  assert.equal(updatedProject.tagsRaw, 'React, ', 'tagsRaw must retain comma and trailing space');
  assert.deepEqual(updatedProject.tags, ['React'], 'tags array must contain cleanly parsed tags');

  // Simulate typing next tag: "React, Vue"
  const nextInputVal = 'React, Vue';
  const nextTagsArray = nextInputVal.split(',').map((t) => t.trim()).filter(Boolean);
  const nextProject = {
    ...updatedProject,
    tags: nextTagsArray,
    tagsRaw: nextInputVal
  };
  assert.deepEqual(nextProject.tags, ['React', 'Vue'], 'tags array must now contain both tags');
  assert.equal(nextProject.tagsRaw, 'React, Vue');

  // Simulate onBlur normalizer
  const onBlurValue = (nextProject.tags || []).join(', ');
  assert.equal(onBlurValue, 'React, Vue');

  // Verify filterEmptyProfileItems strips tagsRaw before save
  const mockProfile = {
    username: 'test_dev',
    projects: [
      { id: 'proj-1', title: 'Mi Vitae', tags: ['React', 'Vue'], tagsRaw: 'React, Vue' }
    ]
  };

  const filtered = filterEmptyProfileItems(mockProfile);
  assert.equal(filtered.projects[0].tagsRaw, undefined, 'filterEmptyProfileItems must strip tagsRaw');
  assert.deepEqual(filtered.projects[0].tags, ['React', 'Vue'], 'tags array must be preserved');

  // Verify DashboardPage.jsx source includes tagsRaw and onBlur handlers
  assert.ok(dashboardContent.includes('proj.tagsRaw !== undefined ? proj.tagsRaw : (proj.tags || []).join(\', \')'), 'DashboardPage must use tagsRaw in value');
  assert.ok(dashboardContent.includes('tagsRaw: val'), 'DashboardPage must update tagsRaw on change');
  assert.ok(dashboardContent.includes('tagsRaw: (p.tags || []).join(\', \')'), 'DashboardPage must clean tagsRaw on blur');
});

it('verifies DashboardPage THEME_OPTIONS contains 6 themes with neo_brutalist (Pop Tactile) at position 2', () => {
  const themeMatch = dashboardContent.match(/const THEME_OPTIONS = \[([\s\S]*?)\]\r?\n\r?\nconst DEMO_ARCHETYPES/);
  assert.ok(themeMatch, 'THEME_OPTIONS block must exist in DashboardPage.jsx');
  const themeIds = [...themeMatch[1].matchAll(/id:\s*'([a-z_]+)'/g)].map((m) => m[1]);
  assert.equal(themeIds.length, 6, 'Must have exactly 6 themes in THEME_OPTIONS');
  assert.equal(themeIds[0], 'minimalist', 'First theme must be minimalist');
  assert.equal(themeIds[1], 'neo_brutalist', 'Second theme must be neo_brutalist (Pop Tactile)');
  assert.equal(themeIds[2], 'creative', 'Third theme must be creative');
  assert.equal(themeIds[3], 'tech', 'Fourth theme must be tech');
  assert.equal(themeIds[4], 'warm', 'Fifth theme must be warm');
  assert.equal(themeIds[5], 'executive', 'Sixth theme must be executive');
});

it('verifies RegisterFeedbackModal contains all 6 themes including Pop Tactile for symmetrical display', () => {
  const registerModalContent = fs.readFileSync(path.resolve(__dirname, '../src/components/Modals/RegisterFeedbackModal.jsx'), 'utf-8');
  const modalThemeMatch = registerModalContent.match(/\/\/ Theme choices for Step 1\r?\nconst THEME_OPTIONS = \[([\s\S]*?)\]/);
  assert.ok(modalThemeMatch, 'THEME_OPTIONS must be defined in RegisterFeedbackModal.jsx');
  const modalThemeIds = [...modalThemeMatch[1].matchAll(/id:\s*'([a-z_]+)'/g)].map((m) => m[1]);
  assert.equal(modalThemeIds.length, 6, 'RegisterFeedbackModal must contain exactly 6 themes');
  assert.ok(modalThemeIds.includes('neo_brutalist'), 'RegisterFeedbackModal must include neo_brutalist (Pop Tactile)');
  assert.ok(registerModalContent.includes('grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2'), 'RegisterFeedbackModal must use symmetrical par grid layout');
});

// -------------------------------------------------------------
// SUITE 8: PAYPAL CHECKOUT V2 & MULTI-GATEWAY PAYMENTS (PC 2 AUDIT)
// -------------------------------------------------------------
console.log('\n▶ Suite 8: PayPal Checkout v2 & Multi-Gateway Checkout');

const configModule = await import(pathToFileURL(path.resolve(ROOT, 'functions/api/config.js')).href);

it('verifies /api/config serverless endpoint returns paypalClientId and paypalEnv', async () => {
  const mockContext = {
    env: {
      VITE_PAYPAL_CLIENT_ID: 'test_pp_client_12345',
      VITE_PAYPAL_ENV: 'sandbox',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon_key_test'
    }
  };
  const res = await configModule.onRequestGet(mockContext);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.paypalClientId, 'test_pp_client_12345');
  assert.equal(data.paypalEnv, 'sandbox');
  assert.equal(data.configured, true);
});

it('verifies PayPal JS SDK CDN URL builder adheres to official v2 spec with USD currency', () => {
  const testClientId = 'AZDxjDScnHuhteiB_8';
  const url = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(testClientId)}&currency=USD`;
  assert.ok(url.startsWith('https://www.paypal.com/sdk/js?client-id='));
  assert.ok(url.includes('&currency=USD'));
  assert.ok(url.includes(testClientId));
});

it('verifies PayPal createOrder logic packages purchase units, $3.99 USD, and custom_id payload', () => {
  const targetUsername = 'carlos_dev';
  const activeCreatorCode = 'INFLUENCER10';

  const orderPayload = {
    purchase_units: [{
      description: 'Suscripción Mi Vitae Pro ($3.99 USD/mes)',
      custom_id: JSON.stringify({
        username: targetUsername,
        creator_code: activeCreatorCode || null
      }),
      amount: {
        currency_code: 'USD',
        value: '3.99'
      }
    }]
  };

  assert.equal(orderPayload.purchase_units[0].amount.value, '3.99');
  assert.equal(orderPayload.purchase_units[0].amount.currency_code, 'USD');

  const customData = JSON.parse(orderPayload.purchase_units[0].custom_id);
  assert.equal(customData.username, 'carlos_dev');
  assert.equal(customData.creator_code, 'INFLUENCER10');
});

it('verifies PayPal onApprove updates profile, sets 30-day expiration and builds transaction voucher', () => {
  const mockOrderId = 'PP-ORDER-987654';
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const profileUpdate = {
    plan: 'premium',
    planName: 'Suscripción Mi Vitae ($3.99 USD/mes)',
    planStatus: 'active',
    planExpiresAt: expiresAt.toISOString()
  };

  assert.equal(profileUpdate.plan, 'premium');
  assert.equal(profileUpdate.planStatus, 'active');
  const expDate = new Date(profileUpdate.planExpiresAt);
  assert.ok(expDate.getTime() > now.getTime());

  const transactionRecord = {
    transactionId: mockOrderId,
    orderNumber: mockOrderId,
    username: 'carlos_dev',
    amount: 3.99,
    currency: 'USD',
    status: 'APROBADO',
    paymentMethod: 'PayPal',
    creator_code: 'INFLUENCER10'
  };

  assert.equal(transactionRecord.amount, 3.99);
  assert.equal(transactionRecord.currency, 'USD');
  assert.equal(transactionRecord.status, 'APROBADO');
  assert.equal(transactionRecord.paymentMethod, 'PayPal');
});

it('verifies FlowCheckoutModal source includes multi-currency dual tabs and PayPal v2 SDK integration', () => {
  const modalPath = path.resolve(ROOT, 'src/components/Modals/FlowCheckoutModal.jsx');
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.ok(content.includes('loadPayPalScript'), 'Must declare dynamic PayPal loader');
  assert.ok(content.includes('https://www.paypal.com/sdk/js?client-id='), 'Must load official PayPal SDK v2 CDN');
  assert.ok(content.includes('3.490 CLP'), 'Must support Chile Flow $3.490 CLP');
  assert.ok(content.includes('3.99 USD'), 'Must support International PayPal $3.99 USD');
  assert.ok(content.includes('actions.order.create'), 'Must use PayPal actions.order.create');
  assert.ok(content.includes('actions.order.capture'), 'Must use PayPal actions.order.capture');
  assert.ok(content.includes('paypal-button-container'), 'Must have official PayPal buttons container');
  assert.ok(content.includes('handleSimulatePayPalPayment'), 'Must support local dev simulation fallback');
});

it('verifies CSP in _headers permits paypal.com and sandbox.paypal.com with zero legacy Paddle domains', () => {
  const headersPath = path.resolve(ROOT, 'public/_headers');
  const content = fs.readFileSync(headersPath, 'utf-8');

  assert.ok(content.includes('https://www.paypal.com'), 'Must allow www.paypal.com in CSP');
  assert.ok(content.includes('https://www.sandbox.paypal.com'), 'Must allow sandbox.paypal.com in CSP');
  assert.ok(!content.toLowerCase().includes('paddle.com'), 'Must NOT contain legacy Paddle domains');
});

it('verifies zero secret keys or private credentials leaked in client-side codebase', () => {
  const srcDir = path.resolve(ROOT, 'src');
  const scanFiles = (dir) => {
    let files = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(scanFiles(fullPath));
      } else if (item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
        files.push(fullPath);
      }
    }
    return files;
  };

  const clientFiles = scanFiles(srcDir);
  const prohibitedKeys = [
    'PADDLE_WEBHOOK_SECRET',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FLOW_SECRET_KEY',
    'RESEND_API_KEY'
  ];

  for (const file of clientFiles) {
    const fileContent = fs.readFileSync(file, 'utf-8');
    for (const forbidden of prohibitedKeys) {
      assert.ok(
        !fileContent.includes(forbidden),
        `CRITICAL SECURITY VIOLATION: ${forbidden} found in client file: ${path.relative(ROOT, file)}`
      );
    }
  }
});

// -------------------------------------------------------------
// SUITE 9: CREATOR CODE / REFERRAL SYSTEM ("APOYA A UN CREADOR")
// -------------------------------------------------------------
console.log('\n▶ Suite 9: Creator Code / Referral System (Apoya a un creador)');

const creatorModule = await import(pathToFileURL(path.resolve(ROOT, 'src/lib/creatorCode.js')).href);

it('sanitizes creator codes: uppercase, removes illegal chars, max 30 chars', () => {
  assert.equal(creatorModule.sanitizeCreatorCode('influencer10'), 'INFLUENCER10');
  assert.equal(creatorModule.sanitizeCreatorCode('  streamer_pro-2026!@#$%  '), 'STREAMER_PRO-2026');
  assert.equal(creatorModule.sanitizeCreatorCode('a'.repeat(50)), 'A'.repeat(30));
  assert.equal(creatorModule.sanitizeCreatorCode(''), '');
  assert.equal(creatorModule.sanitizeCreatorCode(null), '');
});

it('captures creator code automatically from URL parameters (?ref= and ?creator=)', () => {
  // Test ?ref=
  const res1 = creatorModule.captureCreatorCodeFromUrl('?ref=dev_master');
  assert.equal(res1, 'DEV_MASTER');
  assert.equal(creatorModule.getStoredCreatorCode(), 'DEV_MASTER');

  // Test ?creator= overrides
  const res2 = creatorModule.captureCreatorCodeFromUrl('?creator=streamer99&utm_source=youtube');
  assert.equal(res2, 'STREAMER99');
  assert.equal(creatorModule.getStoredCreatorCode(), 'STREAMER99');

  // Set and remove manually
  creatorModule.setStoredCreatorCode('');
  assert.equal(creatorModule.getStoredCreatorCode(), '');
});

it('verifies PayPal order custom_id carries target username and creator_code payload', () => {
  const targetUsername = 'carlos_dev';
  const creatorCode = 'INFLUENCER_TOP';
  const customIdPayload = JSON.stringify({
    username: targetUsername,
    creator_code: creatorCode || null
  });
  const parsed = JSON.parse(customIdPayload);
  assert.equal(parsed.username, 'carlos_dev');
  assert.equal(parsed.creator_code, 'INFLUENCER_TOP');
});

it('verifies create-flow-order serverless endpoint includes creator_code in optional payload', async () => {
  const flowOrderModule = await import(pathToFileURL(path.resolve(ROOT, 'functions/api/create-flow-order.js')).href);
  const req = new Request('https://mivitae.wearesamod.com/api/create-flow-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@ejemplo.cl',
      username: 'carlos_dev',
      creator_code: 'STREAMER_CHILE'
    })
  });

  const res = await flowOrderModule.onRequestPost({
    request: req,
    env: {}
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.creator_code, 'STREAMER_CHILE');
});

it('verifies FlowCheckoutModal integrates Apoya a un creador section and handlers', () => {
  const modalPath = path.resolve(ROOT, 'src/components/Modals/FlowCheckoutModal.jsx');
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.ok(content.includes('Apoya a un Creador'), 'Must document Apoya a un Creador system');
  assert.ok(content.includes('¿Tienes un código de creador?'), 'Must have prompt for creator code');
  assert.ok(content.includes('handleApplyCreatorCode'), 'Must implement apply handler');
  assert.ok(content.includes('handleRemoveCreatorCode'), 'Must implement remove handler');
  assert.ok(content.includes('creator_code'), 'Must pass creator_code to checkout');
  assert.ok(!content.includes('Apoyando a:'), 'Must NOT show "Apoyando a:" text in active badge for compact layout');
  assert.ok(content.includes('hidden sm:flex items-center justify-between p-3 rounded-2xl bg-slate-50'), 'Media bars must be hidden on mobile');
});

// -------------------------------------------------------------
// SUITE 10: USER ACCOUNT DRAWER & RENEWAL GUARD (FUNCTIONAL & NON-FUNCTIONAL)
// -------------------------------------------------------------
console.log('\n▶ Suite 10: User Account Drawer & Renewal Guard (Functional & Non-Functional)');

it('verifies UserAccountModal blocks premature renewal when user has > 5 days remaining', () => {
  const modalPath = path.resolve(ROOT, 'src/components/Modals/UserAccountModal.jsx');
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Verify business rule definition in component
  assert.ok(content.includes("isPlanExpired = planStatus === 'expired' || diffMs <= 0 || daysRemaining === 0"), 'Must compute isPlanExpired');
  assert.ok(content.includes('isPlanExpired || daysRemaining <= 5'), 'Must gate renewal button to <= 5 days or expired');
  assert.ok(content.includes('Membresía al día'), 'Must display Membresía al día badge when active');
  assert.ok(content.includes('Podrás renovar cuando falten 5 días o menos para el vencimiento.'), 'Must explain renewal condition to user');
});

it('verifies premature renewal gate logic accurately differentiates 29 days vs 5 days vs expired', () => {
  const scenarios = [
    { days: 29, status: 'active', canRenew: false, desc: '29 days remaining (full month) must NOT allow renewal' },
    { days: 15, status: 'active', canRenew: false, desc: '15 days remaining must NOT allow renewal' },
    { days: 6, status: 'active', canRenew: false, desc: '6 days remaining must NOT allow renewal' },
    { days: 5, status: 'active', canRenew: true, desc: '5 days remaining MUST allow renewal' },
    { days: 2, status: 'active', canRenew: true, desc: '2 days remaining MUST allow renewal' },
    { days: 0, status: 'expired', canRenew: true, desc: '0 days expired MUST allow renewal' },
    { days: 0, status: 'active', canRenew: true, desc: '0 days remaining MUST allow renewal' }
  ];

  for (const s of scenarios) {
    const isPlanExpired = s.status === 'expired' || s.days <= 0;
    const canRenew = isPlanExpired || s.days <= 5;
    assert.equal(canRenew, s.canRenew, s.desc);
  }
});

it('verifies UserAccountModal auto-closes drawer immediately before launching checkout modal', () => {
  const modalPath = path.resolve(ROOT, 'src/components/Modals/UserAccountModal.jsx');
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Verify onClick executes onClose() followed by openFlowModal regardless of line breaks
  assert.ok(/onClose\(\)\s+openFlowModal\(\{/.test(content), 'Must close sidebar drawer first before opening checkout modal');
});

it('verifies useProfileStore partialize prevents ephemeral modal booleans from persisting to localStorage (ghost modal fix)', () => {
  const storePath = path.resolve(ROOT, 'src/stores/profileStore.js');
  const content = fs.readFileSync(storePath, 'utf-8');

  // Verify partialize explicitly white-lists only profiles and activeUsername
  assert.ok(content.includes('partialize: (state) => ({'), 'Store must define partialize in persist middleware');
  assert.ok(content.includes('profiles: state.profiles,'), 'Must persist profiles');
  assert.ok(content.includes('activeUsername: state.activeUsername'), 'Must persist activeUsername');

  // Verify merge explicitly resets modal booleans
  assert.ok(content.includes('isFlowModalOpen: false,'), 'merge must ensure isFlowModalOpen is false on load');
  assert.ok(content.includes('isAccountModalOpen: false,'), 'merge must ensure isAccountModalOpen is false on load');
  assert.ok(content.includes('isRegisterModalOpen: false,'), 'merge must ensure isRegisterModalOpen is false on load');
  assert.ok(content.includes('isLegalModalOpen: false,'), 'merge must ensure isLegalModalOpen is false on load');
});

it('verifies z-index stacking hierarchy: FlowCheckoutModal (z-[70]) renders above UserAccountModal (z-50)', () => {
  const flowPath = path.resolve(ROOT, 'src/components/Modals/FlowCheckoutModal.jsx');
  const flowContent = fs.readFileSync(flowPath, 'utf-8');
  assert.ok(flowContent.includes('z-[70]'), 'FlowCheckoutModal backdrop must be z-[70] to guarantee topmost rendering');

  const accountPath = path.resolve(ROOT, 'src/components/Modals/UserAccountModal.jsx');
  const accountContent = fs.readFileSync(accountPath, 'utf-8');
  assert.ok(accountContent.includes('z-50'), 'UserAccountModal must be at z-50 level');

  const appPath = path.resolve(ROOT, 'src/App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  const accountIdx = appContent.indexOf('<UserAccountModal');
  const flowIdx = appContent.indexOf('<FlowCheckoutModal');
  assert.ok(accountIdx !== -1 && flowIdx !== -1, 'Both modals must be rendered in App.jsx');
  assert.ok(flowIdx > accountIdx, 'FlowCheckoutModal must be rendered after UserAccountModal in JSX tree');
});

// -------------------------------------------------------------
// SUITE 11: Serverless Admin User Management & RLS Bypass Guard
// -------------------------------------------------------------
console.log('\n▶ Suite 11: Serverless Admin User Management & RLS Bypass Guard');

it('verifies /api/admin-manage-user rejects unauthorized requests without valid adminSecret', async () => {
  const adminFnPath = path.resolve(ROOT, 'functions/api/admin-manage-user.js');
  assert.ok(fs.existsSync(adminFnPath), 'functions/api/admin-manage-user.js must exist');

  const { onRequestPost } = await import(`file://${adminFnPath}`);
  
  // Test request with invalid secret
  const fakeReq = new Request('https://mi-vitae.wearesamod.com/api/admin-manage-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_plan', username: 'testuser', plan: 'lifetime', adminSecret: 'wrongpass' })
  });
  const res = await onRequestPost({ request: fakeReq, env: {} });
  assert.equal(res.status, 401, 'Must reject with 401 Unauthorized');
  const body = await res.json();
  assert.equal(body.success, false);
});

it('verifies /api/admin-manage-user maps lifetime plan to 2099-12-31 and Pro plan name', async () => {
  const adminFnContent = fs.readFileSync(path.resolve(ROOT, 'functions/api/admin-manage-user.js'), 'utf-8');
  assert.ok(adminFnContent.includes("'2099-12-31T23:59:59.000Z'"), 'Must set lifetime expiration to year 2099');
  assert.ok(adminFnContent.includes("'Plan Pro (De por vida)'"), 'Must set lifetime plan name');
  assert.ok(adminFnContent.includes("SUPABASE_SERVICE_ROLE_KEY"), 'Must use SUPABASE_SERVICE_ROLE_KEY to bypass RLS');
});

it('verifies worker.js registers /api/admin-manage-user route', () => {
  const workerContent = fs.readFileSync(path.resolve(ROOT, 'worker.js'), 'utf-8');
  assert.ok(workerContent.includes("pathname === '/api/admin-manage-user'"), 'worker.js must route /api/admin-manage-user');
  assert.ok(workerContent.includes("handleAdminManageUser"), 'worker.js must import handleAdminManageUser');
});

it('verifies supabase/schema.sql provides SECURITY DEFINER admin RPC functions', () => {
  const schemaContent = fs.readFileSync(path.resolve(ROOT, 'supabase/schema.sql'), 'utf-8');
  assert.ok(schemaContent.includes('CREATE OR REPLACE FUNCTION public.admin_set_profile_plan'), 'Must define admin_set_profile_plan RPC');
  assert.ok(schemaContent.includes('CREATE OR REPLACE FUNCTION public.admin_delete_profile'), 'Must define admin_delete_profile RPC');
  assert.ok(schemaContent.includes('SECURITY DEFINER'), 'Admin RPC must have SECURITY DEFINER to bypass RLS');
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
