/*
 * bun run build:android:apk
 * Builds a standalone release APK on this machine (no EAS, no Metro: the JS bundle and assets are
 * inside the APK). Steps: check the toolchain, run prebuild only if android/ is missing or out of
 * date, run Gradle assembleRelease, then verify the APK and say which key signed it.
 *
 *   --prebuild   force `expo prebuild` even if android/ looks up to date
 *   --all-abis   also include x86 / x86_64 (emulators); default is real phones only (smaller APK)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const ANDROID = join(ROOT, 'android');
const APK_DIR = join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release');
const isWin = process.platform === 'win32';
const args = new Set(process.argv.slice(2));

function step(title: string) {
  console.log(`\n=== ${title} ===`);
}

function fail(message: string, hint?: string): never {
  console.error(`\nBUILD FAILED: ${message}`);
  if (hint) console.error(hint);
  process.exit(1);
}

function run(cmd: string[], cwd = ROOT): number {
  return Bun.spawnSync(cmd, { cwd, stdio: ['inherit', 'inherit', 'inherit'] }).exitCode;
}

const mtime = (p: string) => (existsSync(p) ? statSync(p).mtimeMs : 0);

// 1. Toolchain: JDK 17, Android SDK / NDK / build-tools (scripts/checkAndroidEnv.ts).
step('Checking the Android toolchain');
if (run(['bun', join(ROOT, 'scripts', 'checkAndroidEnv.ts')]) !== 0) {
  fail('the Android toolchain is not ready', 'Fix the FAIL lines above, then run this again.');
}

// 2. Native project: generate it if missing, refresh it if app config or plugins changed since.
const buildGradle = join(ANDROID, 'app', 'build.gradle');
const inputs = ['app.json', 'package.json', join('plugins', 'withReleaseSigning.js')].map((f) => mtime(join(ROOT, f)));
const stale = !existsSync(buildGradle) || inputs.some((t) => t > mtime(buildGradle));
if (args.has('--prebuild') || stale) {
  step(existsSync(buildGradle) ? 'Refreshing android/ from app.json (expo prebuild)' : 'Generating android/ (expo prebuild)');
  if (run(['bunx', 'expo', 'prebuild', '--platform', 'android', '--no-install']) !== 0) {
    fail('expo prebuild failed', 'Read the error above. If android/ is broken, run: bunx expo prebuild --platform android --clean');
  }
} else {
  step('android/ is up to date (skipping prebuild)');
}

// 3. Gradle release build. The JS bundle is created and embedded by this task.
const abis = args.has('--all-abis') ? 'armeabi-v7a,arm64-v8a,x86,x86_64' : 'armeabi-v7a,arm64-v8a';
step(`Gradle assembleRelease (${abis})`);
const gradlew = isWin ? ['cmd', '/c', join(ANDROID, 'gradlew.bat')] : [join(ANDROID, 'gradlew')];
const started = Date.now();
if (run([...gradlew, 'assembleRelease', `-PreactNativeArchitectures=${abis}`], ANDROID) !== 0) {
  fail(
    'Gradle assembleRelease failed',
    'Scroll up to the first "What went wrong" block. Common fixes:\n' +
      '  - JAVA_HOME must be JDK 17 (bun run android:doctor)\n' +
      '  - Out of memory: raise org.gradle.jvmargs in android/gradle.properties\n' +
      '  - Stale native build: bun run android:clean, then build again',
  );
}

// 4. Verify the output instead of assuming it.
step('Verifying the APK');
const meta = join(APK_DIR, 'output-metadata.json');
const fileName = existsSync(meta)
  ? (JSON.parse(readFileSync(meta, 'utf8')).elements?.[0]?.outputFile as string | undefined) ?? 'app-release.apk'
  : 'app-release.apk';
const apk = join(APK_DIR, fileName);
if (!existsSync(apk)) fail(`Gradle finished but no APK at ${apk}`);
if (statSync(apk).mtimeMs < started) fail(`${apk} is older than this build; Gradle did not produce a new one`);

// Which key signed it (apksigner ships with the Android SDK build-tools).
const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? '';
const apksigner = join(sdk, 'build-tools', '36.0.0', isWin ? 'apksigner.bat' : 'apksigner');
let signer = 'unknown (apksigner not found)';
if (existsSync(apksigner)) {
  const p = Bun.spawnSync(isWin ? ['cmd', '/c', apksigner, 'verify', '--print-certs', apk] : [apksigner, 'verify', '--print-certs', apk]);
  const out = p.stdout.toString();
  if (p.exitCode !== 0) fail('the APK signature does not verify', p.stderr.toString());
  signer = out.match(/certificate DN: (.*)/)?.[1]?.trim() ?? 'verified';
}
const debugSigned = /Android Debug/i.test(signer);

// Copy out of android/ (which prebuild --clean deletes) with a versioned name.
const app = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo;
const outDir = join(ROOT, 'dist');
mkdirSync(outDir, { recursive: true });
const copy = join(outDir, `ArrowZing-${app.version}-${app.android?.versionCode ?? 1}${debugSigned ? '-debugsigned' : ''}.apk`);
copyFileSync(apk, copy);

const mb = (statSync(apk).size / 1024 / 1024).toFixed(1);
const minutes = ((Date.now() - started) / 60000).toFixed(1);
console.log(`\nAPK built in ${minutes} min, ${mb} MB`);
console.log(`  Gradle output: ${apk}`);
console.log(`  Copy:          ${copy}`);
console.log(`  Signed by:     ${signer}`);
if (debugSigned) {
  console.log(
    '\n  NOTE: signed with the DEBUG key. Fine for testers; Google Play will reject it, and a later\n' +
      '  release-signed APK cannot install over it without uninstalling first.\n' +
      '  To use your own key, see "Release signing" in README.md.',
  );
}
