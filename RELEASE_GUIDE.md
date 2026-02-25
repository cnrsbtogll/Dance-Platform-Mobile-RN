# 🚀 Feriha Mobil Uygulaması - Geliştirici Rehberi

Bu döküman, Feriha mobil uygulamasının geliştirme, test, sürüm yönetimi ve yayınlama süreçlerinde kullanılan tüm temel komutları içerir.

---

## 📌 1. Sürüm ve Build Yönetimi (Release)

Yeni bir versiyon çıkacağınızda veya test için build alacağınızda bu adımları izleyin.

### 🔢 Versiyonlama

> **⚠️ Önemli:** Bu proje **bare workflow** kullandığından EAS, `app.config.js`'deki `version` değerini native dosyalara otomatik **yazmaz**.
> Sadece `expo_runtime_version` (OTA güncelleme için) ve `Expo.plist` otomatik güncellenir.
> Gerçek App Store/Play Store versiyonu için aşağıdaki akışı kullanın.

#### Versiyon Güncelleme Akışı

**1. `app.config.js` dosyasında `version`'ı yükselt:**
```js
version: "1.0.3",
runtimeVersion: "1.0.3",
```

**2. Native dosyalara sync et:**
```bash
yarn sync:version
```
Bu komut aşağıdakileri otomatik günceller:
- `android/app/build.gradle` → `versionName`
- `ios/FerihaDancePlatform/Info.plist` → `CFBundleShortVersionString`

**3. Build al** (aşağıdaki build komutlarına bakın).

> **Not:** `versionCode` (Android) ve `buildNumber` (iOS) sayısal değerleri EAS tarafından `"appVersionSource": "remote"` ayarı sayesinde otomatik artırılır. Bunlara dokunmanıza gerek yok.

---

### 🍎 iOS Build Komutları
| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **App Store (TestFlight)** | `eas build --platform ios --profile production --auto-submit` | App Store Connect'e otomatik gönderilen build alır. |
| **Ad Hoc (Test Cihazı)** | `eas build --platform ios --profile preview` | Kayıtlı cihazlara (UDID) link ile kurulabilen .ipa dosyası üretir. |

### 🤖 Android Build Komutları
| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **Play Store (AAB)** | `eas build --platform android --profile production --auto-submit` | Google Play Console'a gönderilmek üzere .aab (App Bundle) üretir ve otomatik yükler. |
| **APK (Test/Manuel)** | `eas build --platform android --profile preview` | Cihaza direkt kurulabilen .apk dosyası üretir. Play Store kabul etmez, sadece elden dağıtım içindir. |

---

## ⚡ 2. EAS Updates (Over-the-Air Güncellemeler)

Mağaza onayı (Apple/Google review) beklemeden, JS kodundaki ve assetlerdeki (resim vb.) değişiklikleri kullanıcılara anında göndermek için kullanılır.

> **⚠️ Önemli:** Native modül (google-signin, stripe vb.) eklediyseniz veya native kod (`ios/`, `android/` klasörleri) değiştiyse EAS Update **ÇALIŞMAZ**. Yeni build almanız gerekir.

### Kurulum (Sadece ilk kez)
Eğer projede kurulu değilse:
```bash
npx expo install expo-updates
eas update:configure
```

### Güncelleme Gönderme Komutları

| Kanal | Komut | Açıklama |
| :--- | :--- | :--- |
| **Herkese (Production)** | `eas update --branch production --message "Hızlı hata düzeltmesi"` | Production (Mağaza) sürümünü kullanan tüm kullanıcılara güncellemeyi gönderir. |
| **Test Ekibine (Preview)** | `eas update --branch preview --message "Özellik testi"` | Preview profilini (APK/Ad Hoc) kullanan test ekibine gönderir. |

**Kullanım Örneği:**
1. Kodda ufak bir metin hatasını düzelttiniz.
2. `eas update --branch production --message "Metin düzeltmesi"` komutunu çalıştırın.
3. Kullanıcılar uygulamayı kapatıp açtığında (veya 2. açışlarında) yeni hali yüklenir.

---

## 💻 3. Geliştirme Ortamı (Expo CLI)

Uygulamayı geliştirirken kullanılacak komutlar.

| Komut | Açıklama |
| :--- | :--- |
| `npx expo start --dev-client` | **(Önerilen)** Development Build ile başlatır. Native kütüphaneler çalışır. |
| `npx expo start` | Expo Go ile başlatır. Native kütüphaneler (Google Sign-In) çalışmaz. |
| `npx expo start --clear` | Cache'i temizleyerek başlatır. Garip hatalar için ilk çözümdür. |

**Terminal Kısayolları (Çalışırken):**
*   `s`: Mod değiştir (Expo Go <-> Development Build)
*   `i`: iOS simülatörünü aç
*   `a`: Android emülatörünü aç
*   `r`: Reload (Yeniden yükle)
*   `m`: Geliştirici menüsünü aç

---

## ☁️ 4. EAS Servisleri ve Diğerleri

| İşlem | Komut | Açıklama |
| :--- | :--- | :--- |
| **Cihaz Ekleme (iOS)** | `eas device:create` | Test (Ad Hoc) dağıtımı için yeni bir iPhone/iPad'i ekler. |
| **Manuel Gönderim** | `eas submit -p ios` (veya android) | Daha önce alınmış bir build'i mağazaya manuel göndermek için. |
| **Build Listesi** | `eas build:list` | Geçmiş buildleri listeler. |
| **Update Listesi** | `eas update:list` | Geçmiş OTA güncellemelerini listeler. |

### Sorun Giderme
Eğer build alırken veya geliştirme yaparken native modül hataları alırsanız:
```bash
# iOS için temiz kurulum
rm -rf node_modules ios/Pods ios/build && yarn install && cd ios && pod install && cd ..
```
