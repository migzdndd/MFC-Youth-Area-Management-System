import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');

console.log('🚀 [MFC Youth AMS] Starting Android Release APK Build Pipeline...');

// 1. Resolve JAVA_HOME
const candidateJdks = [
  process.env.JAVA_HOME,
  'C:\\Program Files\\Android\\openjdk\\jdk-21.0.8',
  'C:\\Program Files\\Android\\Android Studio\\jbr',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21',
  'C:\\Program Files\\Java\\jdk-21'
].filter(Boolean);

let resolvedJavaHome = candidateJdks.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')));

if (resolvedJavaHome) {
  process.env.JAVA_HOME = resolvedJavaHome;
  const javaBin = path.join(resolvedJavaHome, 'bin');
  if (!process.env.PATH.includes(javaBin)) {
    process.env.PATH = `${javaBin}${path.delimiter}${process.env.PATH}`;
  }
  console.log(`✅ JAVA_HOME: ${resolvedJavaHome}`);
} else {
  console.warn('⚠️ Could not auto-detect JDK directory. Will rely on system PATH.');
}

// 2. Resolve ANDROID_HOME
const candidateSdks = [
  process.env.ANDROID_HOME,
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
  'C:\\Program Files (x86)\\Android\\android-sdk'
].filter(Boolean);

let resolvedAndroidHome = candidateSdks.find(p => fs.existsSync(p));
if (resolvedAndroidHome) {
  process.env.ANDROID_HOME = resolvedAndroidHome;
  console.log(`✅ ANDROID_HOME: ${resolvedAndroidHome}`);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';

// 3. Build Web Bundle
console.log('\n📦 Step 1/3: Compiling Vite Production Web Bundle...');
const buildRes = spawnSync(npmCmd, ['run', 'build'], { cwd: rootDir, stdio: 'inherit', shell: true });
if (buildRes.status !== 0) {
  console.error('❌ Vite build failed.');
  process.exit(buildRes.status || 1);
}

// 4. Sync Capacitor Android
console.log('\n📱 Step 2/3: Syncing assets to Capacitor Android...');
const syncRes = spawnSync(npxCmd, ['cap', 'sync', 'android'], { cwd: rootDir, stdio: 'inherit', shell: true });
if (syncRes.status !== 0) {
  console.error('❌ Capacitor sync failed.');
  process.exit(syncRes.status || 1);
}

// 5. Run Gradle assembleRelease
console.log('\n🔨 Step 3/3: Running Gradle assembleRelease (signed APK)...');
const gradleRes = spawnSync(gradlewCmd, ['assembleRelease'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: true,
  env: process.env
});

if (gradleRes.status !== 0) {
  console.error('❌ Gradle assembleRelease failed.');
  process.exit(gradleRes.status || 1);
}

// 6. Verify Output
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (fs.existsSync(apkPath)) {
  const stats = fs.statSync(apkPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log('\n======================================================');
  console.log('🎉 ANDROID RELEASE APK BUILD COMPLETE!');
  console.log(`📍 Location: ${apkPath}`);
  console.log(`📊 File Size: ${sizeMb} MB`);
  console.log('======================================================\n');
} else {
  console.warn('⚠️ Build finished but output APK was not found at expected path.');
}
