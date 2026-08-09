# Building the Android APK (Capacitor) — Free Toolchain

Capacitor wraps your React web app into a real Android app you can install as
an APK today, and publish to the Play Store later with zero rewrite.

## 1. Prerequisites (all free)
- Node.js 18+ and npm
- Android Studio (free) — https://developer.android.com/studio
- A JDK (Android Studio bundles one)

## 2. Build the web app
```bash
cd frontend
npm install
npm run build          # outputs to frontend/dist
```

## 3. Add Capacitor
```bash
npm install @capacitor/core @capacitor/android
npx cap init "Workers Committee" "com.yourcompany.workerscommittee" --web-dir=dist
npx cap add android
```

## 4. Copy the build into the native project and open Android Studio
```bash
npx cap copy android
npx cap open android
```
Android Studio opens the `android/` project. Click **Run ▶** with an emulator
or a USB-connected phone (enable Developer Options → USB Debugging) to test.

## 5. Generate a signed release APK
1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Choose **APK**, create a new keystore (store the `.jks` file and passwords
   somewhere safe — you'll need the SAME keystore for every future update)
3. Choose **release** build variant → Finish
4. The signed APK appears at `android/app/release/app-release.apk`
5. Share this file directly (e.g. via Google Drive link) for installs
   outside the Play Store — users must enable "Install unknown apps" once.

## 6. Push notifications on Android (Firebase Cloud Messaging — free)
1. Create a free Firebase project: https://console.firebase.google.com
2. Add an Android app with package name `com.yourcompany.workerscommittee`
3. Download `google-services.json` → place in `android/app/`
4. Add to `android/build.gradle` and `android/app/build.gradle` per the
   Firebase console's auto-generated instructions
5. Generate a **service account key** (Project Settings → Service accounts)
   and put its JSON content in the backend's `FCM_CREDENTIALS_JSON` env var

## 7. App icon & splash screen (free, no design tool needed)
```bash
npm install -D @capacitor/assets
# Put a 1024x1024 icon.png and 2732x2732 splash.png in /frontend/resources
npx capacitor-assets generate --android
```

## 8. When you're ready for the Play Store
1. Create a Google Play Console account (one-time $25 fee — the only
   non-free step in this whole stack)
2. Build a signed **.aab** (Android App Bundle) instead of APK:
   Build → Generate Signed Bundle / APK → choose "Android App Bundle"
3. Create the store listing, upload the .aab, submit for review

## 9. Updating the app later
Every time you change the React code:
```bash
npm run build
npx cap copy android
npx cap open android   # then re-generate the signed APK/AAB
```
