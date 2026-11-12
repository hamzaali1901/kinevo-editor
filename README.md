# Kinevo Editor — Urdu Auto Captions + Gallery Save Fixes

Kinevo Editor (Android WebView app) ka patched build. Is repo mein app ka HTML, native bridge patch (smali), aur APK rebuild scripts hain.

**APK download:** [Releases](../../releases) page se latest `KinevoEditor-vX.Y.apk` lein.

> NOTE: Yeh kisi original "Kinevo Editor" APK ka modified build hai. Original app aur uske assets ke haqooq unke owners ke paas hain. Sirf personal/educational use ke liye. App debug key se signed hai.

## Kya fix/add hua

1. **Video export Gallery mein save nahi hoti thi** — export ke baad `KinevoApp` native bridge se seedha `Movies/Kinevo` mein MediaStore entry banti hai (Share fallback bhi hai).
2. **Photo Enhance ki photo save nahi hoti thi** — pehle sirf preview dikhta tha ("long-press to save"). Ab `💾 Save` canvas ko JPEG bana kar native bridge se `Pictures/Kinevo` mein save karta hai. Iske liye native `begin(name, mime)` ab `image/*` mime par `MediaStore.Images` + `DIRECTORY_PICTURES` use karta hai (pehle sirf video hardcoded tha).
3. **Urdu auto captions** — toolbar mein `🗣️ Urdu Caps`:
   - **Online:** Groq `whisper-large-v3-turbo`, word-level timestamps, 8-min silence-aware chunks (25 MB limit ke andar).
   - **Offline:** on-device Whisper tiny (quantized, APK mein bundled) — internet ki zarurat nahi.
   - **Optional:** panel se `whisper-base` (~77 MB) ek dafa download karke behtar offline Urdu accuracy.
   - Captions editable text layers ban jati hain (RTL auto, background, position).
4. Native `begin()` ke null-path verifier bug ka fix + `android.permission.INTERNET`.

## Install

1. Release se APK download karein.
2. Purani app ke upar hi install karein (same package `com.kinevo.editor`, same signing cert) — data safe rahega.
3. Agar "app not installed" aaye to purani app uninstall karke install karein (data chala jayega).

## Istemal

- **Video save:** export → "Save to Gallery" → `Movies/Kinevo`.
- **Photo Enhance:** Home → Photo Enhance → image chunein → adjust → `💾 Save` → `Pictures/Kinevo`.
- **Urdu captions:**
  1. Timeline mein clip select karein.
  2. Toolbar → `🗣️ Urdu Caps`.
  3. Online ke liye [console.groq.com](https://console.groq.com) se free API key le kar panel mein paste karein (sirf app ke localStorage mein rehti hai).
  4. Engine chunein → `Start`. Pehli offline run par model load hone mein thora waqt lagta hai.

> **Privacy:** online mode mein audio Groq ke server par upload hota hai. Private content ke liye offline mode use karein.

## Repo structure

```
app/index.html                 # poora app (patched)
app/uc-block.js                # Urdu captions module (source of truth)
tools/build-apk.js             # ZIP rewriter: assets + manifest + classes4.dex replace, sign ke liye unsigned APK
tools/fetch-assets.js          # offline runtime + whisper-tiny model download (~65 MB)
tools/patch-apk.js             # purana save-bridge patch (reference)
tools/apply-uc.js, sync-uc.js  # index.html mein captions block inject/sync
tools/axml/AndroidManifest.xml # patched manifest (INTERNET permission, versionName)
tools/axml/patch-internet.js   # binary AXML editor script
tools/dex/patch-bridge.js      # Bridge.begin smali patch (image support + verifier fix)
tools/dex/MainActivity.Bridge.smali  # patched smali
tools/dex/classes4-original.dex      # original dex (reference)
tools/dex/classes4-patched.dex       # patched dex (build isi ko use karta hai)
```

## Build

Requirements: Node 18+, JDK 17+ (Android Studio ka JBR chalta hai), Android SDK build-tools (`zipalign`, `apksigner`, `d8`, `dexdump`), [baksmali/smali 2.5.2](https://bitbucket.org/JesusFreke/smali/downloads/).

```bash
# 1) offline runtime + model
node tools/fetch-assets.js

# 2) apna original APK yahan rakhein (repo mein shamil nahi hai)
cp /path/to/original.apk tools/original.apk

# 3) build
node tools/build-apk.js

# 4) align + sign (debug keystore)
zipalign -f -P 16 4 tools/rebuilt-unsigned.apk tools/aligned.apk
apksigner sign --ks ~/.android/debug.keystore --ks-pass pass:android \
  --key-pass pass:android --ks-key-alias androiddebugkey \
  --out KinevoEditor.apk tools/aligned.apk
```

Native bridge dobara patch karna ho to:

```bash
java -jar baksmali-2.5.2.jar d tools/dex/classes4-original.dex -o tools/dex/out
cd tools/dex && node patch-bridge.js
java -jar smali-2.5.2.jar a out -o classes4-patched.dex
```

`build-apk.js` khud `tools/axml/AndroidManifest.xml`, `tools/dex/classes4-patched.dex` aur `tools/apk-assets/**` ko APK mein daalta hai, aur purani signatures (`META-INF`) hata deta hai.

## Limitations

- Debug key se signed (Play Store ke liye release key chahiye).
- Offline tiny model Urdu accuracy theek-thaak hai, base model behtar hai.
- Is build ka asli phone par end-to-end test pending hai; offline captions aur save flow headless Chrome + mocked bridge se verify kiye gaye hain.

## License

Scripts: MIT (`LICENSE`). App HTML/assets/APK: original owners ke, sirf personal use.
