import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';

// Mock useSyncExternalStore for Zustand SSR
React.useSyncExternalStore = (sub, getSnap) => getSnap();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('EMAIL UNIQUE VALIDATION - QA & RELIABILITY TEST SUITE');
console.log('Testing: Supabase Cloud, profileStore, AuthPage & Modals');
console.log('====================================================\n');

// Mock browser globals
globalThis.window = {
  location: { pathname: '/register', hash: '', search: '', origin: 'https://mivitae.wearesamod.com' },
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

const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom'
});

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`    -> ${err.stack || err.message}`);
    failed++;
  }
}

// Load modules via Vite SSR
const supabaseModule = await vite.ssrLoadModule('/src/lib/supabaseClient.js');
const profileStoreModule = await vite.ssrLoadModule('/src/stores/profileStore.js');

const {
  checkEmailAvailableInSupabase,
  signUpWithSupabase,
  isSupabaseConfigured,
  supabase
} = supabaseModule;

const { useProfileStore } = profileStoreModule;

console.log('--- SUITE 1: Supabase Direct Query (checkEmailAvailableInSupabase) ---');

await test('1.1: Supabase client is configured and connected', async () => {
  assert.equal(isSupabaseConfigured, true, 'Supabase must be configured');
  assert.ok(supabase, 'Supabase instance must exist');
});

await test('1.2: Returns false for registered email: benjaminn.martinez.ortega@hotmail.com', async () => {
  const result = await checkEmailAvailableInSupabase('benjaminn.martinez.ortega@hotmail.com');
  assert.equal(result, false, 'benjaminn.martinez.ortega@hotmail.com must be taken (false)');
});

await test('1.3: Returns false for registered email: cnserranom@gmail.com', async () => {
  const result = await checkEmailAvailableInSupabase('cnserranom@gmail.com');
  assert.equal(result, false, 'cnserranom@gmail.com must be taken (false)');
});

await test('1.4: Returns false for UPPERCASE registered email (case-insensitivity)', async () => {
  const resultUpper1 = await checkEmailAvailableInSupabase('BENJAMINN.MARTINEZ.ORTEGA@HOTMAIL.COM');
  assert.equal(resultUpper1, false, 'BENJAMINN.MARTINEZ.ORTEGA@HOTMAIL.COM (uppercase) must return false');

  const resultUpper2 = await checkEmailAvailableInSupabase('CNSERRANOM@GMAIL.COM');
  assert.equal(resultUpper2, false, 'CNSERRANOM@GMAIL.COM (uppercase) must return false');

  const resultMixed = await checkEmailAvailableInSupabase('Benjaminn.Martinez.Ortega@Hotmail.Com');
  assert.equal(resultMixed, false, 'Mixed case email must return false');
});

await test('1.5: Returns true for unused email: usuario_qa_prueba_998877@test.com', async () => {
  const result = await checkEmailAvailableInSupabase('usuario_qa_prueba_998877@test.com');
  assert.equal(result, true, 'Unregistered email must return true');
});

await test('1.6: Handles edge inputs gracefully (empty, null, whitespace)', async () => {
  const rEmpty = await checkEmailAvailableInSupabase('');
  assert.equal(rEmpty, true, 'Empty email returns true safely');

  const rNull = await checkEmailAvailableInSupabase(null);
  assert.equal(rNull, true, 'Null email returns true safely');

  const rUndefined = await checkEmailAvailableInSupabase(undefined);
  assert.equal(rUndefined, true, 'Undefined email returns true safely');
});

console.log('\n--- SUITE 2: signUpWithSupabase Guard Verification ---');

await test('2.1: Rejects duplicate email registration cleanly without creating orphans', async () => {
  const response = await signUpWithSupabase({
    email: 'benjaminn.martinez.ortega@hotmail.com',
    password: 'PasswordTest123!',
    username: 'qa_temp_duplicate_user',
    fullName: 'QA Duplicate Tester'
  });

  assert.equal(response.success, false, 'Registration must fail for existing email');
  assert.equal(
    response.error,
    'Este correo electrónico ya está registrado. Por favor inicia sesión con tu cuenta.',
    'Must return exact error message for duplicate email'
  );
});

await test('2.2: Rejects uppercase duplicate email cleanly in signUpWithSupabase', async () => {
  const response = await signUpWithSupabase({
    email: 'BENJAMINN.MARTINEZ.ORTEGA@HOTMAIL.COM',
    password: 'PasswordTest123!',
    username: 'qa_temp_duplicate_user_2',
    fullName: 'QA Duplicate Tester 2'
  });

  assert.equal(response.success, false, 'Registration must fail for uppercase existing email');
  assert.equal(
    response.error,
    'Este correo electrónico ya está registrado. Por favor inicia sesión con tu cuenta.'
  );
});

console.log('\n--- SUITE 3: Zustand profileStore Integration ---');

await test('3.1: isEmailAvailable checks local store synchronously', () => {
  const store = useProfileStore.getState();

  // Carlos Mendoza is in mock profiles
  assert.equal(store.isEmailAvailable('carlos.mendoza.code@gmail.com'), false);
  assert.equal(store.isEmailAvailable('CARLOS.MENDOZA.CODE@GMAIL.COM'), false);
  assert.equal(store.isEmailAvailable('  carlos.mendoza.code@gmail.com  '), false);

  // Available local email
  assert.equal(store.isEmailAvailable('unused_qa_email_555@example.com'), true);

  // Edge cases
  assert.equal(store.isEmailAvailable(''), false);
  assert.equal(store.isEmailAvailable(null), false);
  assert.equal(store.isEmailAvailable(undefined), false);
  assert.equal(store.isEmailAvailable('no-at-sign.com'), false);
});

await test('3.2: checkEmailAvailability checks both local store and Supabase asynchronously', async () => {
  const store = useProfileStore.getState();

  // Blocked by local store
  const localResult = await store.checkEmailAvailability('carlos.mendoza.code@gmail.com');
  assert.equal(localResult, false, 'Must be false when taken locally');

  // Blocked by Supabase
  const supabaseResult = await store.checkEmailAvailability('benjaminn.martinez.ortega@hotmail.com');
  assert.equal(supabaseResult, false, 'Must be false when taken in Supabase');

  const supabaseResultUpper = await store.checkEmailAvailability('BENJAMINN.MARTINEZ.ORTEGA@HOTMAIL.COM');
  assert.equal(supabaseResultUpper, false, 'Must be false for uppercase Supabase email');

  // Available everywhere
  const availableResult = await store.checkEmailAvailability('usuario_qa_prueba_998877@test.com');
  assert.equal(availableResult, true, 'Must be true for completely unused email');

  // Edge cases
  assert.equal(await store.checkEmailAvailability(''), false);
  assert.equal(await store.checkEmailAvailability(null), false);
  assert.equal(await store.checkEmailAvailability(undefined), false);
  assert.equal(await store.checkEmailAvailability('invalid-email-format'), false);
});

console.log('\n--- SUITE 4: Static Inspection & Memory Leak Audit ---');

await test('4.1: RegisterFeedbackModal.jsx implements debounce and clearTimeout', () => {
  const content = fs.readFileSync(path.resolve(ROOT, 'src/components/Modals/RegisterFeedbackModal.jsx'), 'utf-8');

  // Verify clearTimeout cleanup
  assert.ok(content.includes('clearTimeout(timer)'), 'Must clear timer in useEffect cleanup');
  assert.ok(content.includes('checkEmailAvailability'), 'Must call checkEmailAvailability');

  // Verify step 1 validation includes emailStatus
  assert.ok(
    content.includes('emailStatus.available !== false') || content.includes('emailStatus.available === true'),
    'isStep1Valid must verify emailStatus'
  );

  // Verify pre-submit check in handleSubmit
  assert.ok(
    content.includes('const isEmailFree = await useProfileStore.getState().checkEmailAvailability'),
    'handleSubmit must double-check email before calling signUpWithSupabase'
  );
  assert.ok(
    content.includes('setSubmitError(\'Este correo electrónico ya está registrado. Por favor inicia sesión.\')'),
    'handleSubmit must set exact user-friendly message'
  );

  // Verify UI feedback
  assert.ok(content.includes('Verificando disponibilidad de correo...'), 'Must show verifying state in UI');
  assert.ok(content.includes('Este correo ya está registrado'), 'Must show already registered message in UI');
});

await test('4.2: AuthPage.jsx implements debounce, clearTimeout, and pre-submit guards', () => {
  const content = fs.readFileSync(path.resolve(ROOT, 'src/pages/AuthPage.jsx'), 'utf-8');

  // Verify clearTimeout cleanup
  assert.ok(content.includes('clearTimeout(timer)'), 'Must clear timer in useEffect cleanup');
  assert.ok(content.includes('checkEmailAvailability'), 'Must call checkEmailAvailability');

  // Verify handleSubmit pre-submit guard
  assert.ok(
    content.includes('const isEmailFree = await useProfileStore.getState().checkEmailAvailability'),
    'AuthPage handleSubmit must verify email availability before signUp'
  );
  assert.ok(
    content.includes('Este correo electrónico ya está registrado. Por favor inicia sesión con tu cuenta.'),
    'AuthPage handleSubmit must throw friendly error for existing email'
  );

  // Verify submit button disabled state
  assert.ok(
    content.includes('emailStatus.checking') || content.includes('!emailStatus.available'),
    'AuthPage submit button or logic must account for email availability'
  );
});

console.log('\n====================================================');
console.log(`AUDIT RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('====================================================');

await vite.close();

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
