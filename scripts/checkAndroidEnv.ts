/*
 * Dev tool: bun run android:doctor
 * Checks that this Windows machine can build Outbound for Android: JDK 17 for Gradle,
 * the Android SDK parts React Native 0.81 needs, adb, and a connected device.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** What the project needs (Gradle 8.14.3 / AGP 8.11 / RN 0.81: see node_modules/react-native/gradle/libs.versions.toml). */
const REQUIRED_JDK = 17;
const REQUIRED_PLATFORM = 'android-36';
const REQUIRED_BUILD_TOOLS = '36.0.0';
const REQUIRED_NDK = '27.1.12297006';

let failed = false;
const ok = (msg: string) => console.log(`  OK    ${msg}`);
const bad = (msg: string, fix: string) => {
  failed = true;
  console.log(`  FAIL  ${msg}\n        fix: ${fix}`);
};
const warn = (msg: string) => console.log(`  WARN  ${msg}`);

function run(cmd: string[]): string | null {
  try {
    const p = Bun.spawnSync(cmd, { stderr: 'pipe', stdout: 'pipe' });
    return (p.stdout.toString() + p.stderr.toString()).trim();
  } catch {
    return null;
  }
}

console.log('Outbound Android build environment\n');

// JDK: Gradle uses JAVA_HOME. Android Studio's bundled JDK (25) is too new for Gradle 8.14.
const javaHome = process.env.JAVA_HOME;
if (!javaHome) {
  bad('JAVA_HOME is not set', 'set JAVA_HOME to a JDK 17 install, e.g. C:\\Program Files\\Microsoft\\jdk-17.0.20.101-hotspot');
} else {
  const java = join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  const out = existsSync(java) ? run([java, '-version']) : null;
  const major = out?.match(/version "(\d+)/)?.[1];
  if (!major) bad(`JAVA_HOME=${javaHome} has no working java`, 'point JAVA_HOME at a JDK 17 install');
  else if (Number(major) !== REQUIRED_JDK) bad(`JAVA_HOME is JDK ${major} (${javaHome})`, `use JDK ${REQUIRED_JDK}; Gradle 8.14 cannot run on newer JDKs such as 25`);
  else ok(`JDK ${major} at ${javaHome}`);
}

// Android SDK
const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
if (!sdk || !existsSync(sdk)) {
  bad('ANDROID_HOME is not set or does not exist', 'set ANDROID_HOME to C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk');
} else {
  ok(`Android SDK at ${sdk}`);
  const need: [string, string][] = [
    [join(sdk, 'platforms', REQUIRED_PLATFORM), `SDK Platform ${REQUIRED_PLATFORM}`],
    [join(sdk, 'build-tools', REQUIRED_BUILD_TOOLS), `Build-Tools ${REQUIRED_BUILD_TOOLS}`],
    [join(sdk, 'ndk', REQUIRED_NDK), `NDK ${REQUIRED_NDK}`],
    [join(sdk, 'platform-tools'), 'Platform-Tools (adb)'],
  ];
  for (const [path, name] of need) {
    if (existsSync(path)) ok(name);
    else bad(`${name} is missing`, 'install it in Android Studio > SDK Manager');
  }
}

// adb and a device
const devices = run(['adb', 'devices']);
if (devices === null) {
  bad('adb is not on PATH', 'add %ANDROID_HOME%\\platform-tools to PATH');
} else {
  const attached = devices.split('\n').slice(1).filter((l) => /\tdevice$/.test(l.trim()) || l.includes('\tdevice'));
  if (attached.length) ok(`device connected: ${attached.map((l) => l.split('\t')[0]).join(', ')}`);
  else warn('no device connected (needed for bun run android / android:release:device; not for building an APK)');
}

// Generated native project
if (existsSync('android/gradlew.bat')) {
  ok('android/ native project present');
  const props = existsSync('android/gradle.properties') ? readFileSync('android/gradle.properties', 'utf8') : '';
  if (/org\.gradle\.java\.home/.test(props)) warn('android/gradle.properties sets org.gradle.java.home; it overrides JAVA_HOME');
} else {
  warn('android/ not generated yet: run bun run android:prebuild');
}

console.log(failed ? '\nSome checks failed.' : '\nReady to build.');
process.exit(failed ? 1 : 0);
