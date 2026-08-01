# Runopoly Sürüm ve Güncelleme Rehberi

Bu dosya Runopoly projesinin Sunucu (Backend) ve Uygulama (Mobil/Web) versiyonlarının nasıl yönetilmesi ve güncellenmesi gerektiğini detaylandırır.

## 1. Sunucu (Backend) Güncellemeleri
Sunucu versiyonu `A.B` (Örnek: `1.1`, `1.2`, `1.3`) formatında ilerler. 
Sunucuya yeni bir özellik eklendiğinde veya hata düzeltildiğinde:
1. `runopoly-backend/index.js` dosyasına gidin.
2. `socket.emit('server_info', { version: '1.X' });` satırındaki versiyon numarasını manuel olarak bir kademe artırın.
3. Sunucudaki (VPS) PM2 uygulamasını yeniden başlatın (`pm2 restart runopoly`).

*Not: Sunucu ile mobil uygulamanın sürümleri aynı olmak zorunda değildir.*

---

## 2. Uygulama (App) Güncellemeleri
Uygulama versiyonları `A.B.C` (Örnek: `1.0.45`) formatında ilerler.
Sürüm numarasının anlamı:
- **A (Major):** Çok büyük ve oyunun altyapısını değiştiren vizyon güncellemelerinde **sadece manuel olarak** artırılır.
- **B (Minor / Native):** Uygulamaya OTA (Over-The-Air) üzerinden **gönderilemeyecek**, uygulamanın tamamen baştan indirilip kurulmasını gerektiren çekirdek/native kod değişikliklerinde (örneğin kamerayı açan bir özellik, yeni bir harici kütüphane eklenmesi vs.) artırılır. 
- **C (Build / Patch):** Her GitHub Actions Build (APK çıkartma) işleminde **otomatik olarak** (`github.run_number` ile) artar. Sizin müdahale etmenize gerek yoktur.

### Senaryo 1: OTA (Arka Plan) Güncellemesi Göndermek (Sadece Kod/Arayüz Değişikliği)
Eğer sadece yazı tipini, bir hatayı veya oyunun mantığını değiştirdiyseniz bu bir **OTA güncellemesidir**.
* Kullanıcının yeni APK indirmesine gerek **yoktur.**
* `app.json` içerisindeki `version` ve `runtimeVersion` ayarlarına **DOKUNMAYIN.**
* Kodları GitHub'a gönderin veya direkt terminalden `eas update --auto` komutunu çalıştırın.
* Kullanıcılar oyunu açtığında arkadan gizlice yeni kodları indireceklerdir.

### Senaryo 2: Büyük/Native Güncelleme Yapmak (Yeni APK Gerektiren)
Eğer uygulamaya OTA ile gidemeyecek büyük bir kütüphane eklediyseniz, mecburen **B sayısını (Ortadaki sayıyı)** artırmanız gerekir.
1. `runopoly-app/app.json` dosyasını açın.
2. `version` alanını bir sonraki onluğa yuvarlayın. (Örnek: `"1.0.0"` ise `"1.1.0"` yapın).
3. **ÇOK ÖNEMLİ:** `runtimeVersion` alanını da `version`'un ilk iki hanesi ile eşitleyin! (Örnek: `"1.1"` yapın).
4. **ZORUNLU UYARI:** Eski sürümlerin sunucuya girip oyunu bozmasını engellemek için `runopoly-backend/index.js` dosyasına gidin. `socket.emit('server_info', { version: '1.X', minBVersion: 1 });` satırındaki `minBVersion` sayısını, yeni B sayınız (örnekte 1) ile eşitleyin.
5. Değişiklikleri GitHub'a pushlayın (gönderin).
6. GitHub otomatik olarak (örneğin) `runopoly-1.1.46.apk` dosyasını oluşturacaktır.
7. Oyunculara bu yeni APK'yı indirip kurmalarını söyleyin. Eski OTA güncellemeleri bu yeni sürüme etki etmeyecektir, artık tertemiz bir `1.1` OTA kanalınız olacaktır. Ve eski APK'yı kullananlar "Update Required" uyarısı ile karşılaşacaklardır.

### Senaryo 3: APK Build Sürecini Hızlandırmak ([build] komutu)
Eğer her "git push" işleminde 15-20 dakika süren o hantal Android (APK) derlemesini **İSTEMİYORSANIZ**, commit mesajınıza `[build]` yazmanıza gerek yoktur. `[build]` yazmadığınız tüm push'lar otomatik olarak o ağır APK üretme sürecini ATLAR (Skip). 
Sadece 1 dakikalık hızlı bir "OTA Update" yapar ve oyuncular oyuna girdiği an güncellenir.
Eğer cidden yeni bir APK oluşturmak isterseniz (örneğin kütüphane eklediniz), o zaman commit mesajınızda mutlaka `[build]` yazmalısınız (Örn: `git commit -m "feat: yeni kamera kütüphanesi [build]"`).
- Backend (Sunucu) kodunda bir mantik veya islev degisikligi yapildiginda mutlaka 'index.js' icerisindeki 'server_info' kismindaki version numarasi arttirilmalidir. (Orn: 1.3 -
