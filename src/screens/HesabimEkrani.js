import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet, apiPost } from '../services/api';
import { refreshTokenAl } from '../services/tokenStorage';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { gunBicimle } from '../utils/bicimlendir';        // ⭐

export default function HesabimEkrani({ navigation }) {
  const { token, kullanici, cikisYap } = useAuth();
  const { renkler, temaAdi, temaDegistir } = useTema();
  const styles = stilOlustur(renkler);

  const [profil, setProfil] = useState(null);   // ⭐ email + üyelik tarihi buradan

  // ⭐ YENİ — aktif oturum sayısı.
  //
  // null = henüz bilinmiyor / alınamadı.
  //
  // Neden 0 ile başlatmıyoruz? Çünkü 0 geçerli bir cevap ("hiç oturum
  // yok") ama bizim durumumuz "henüz sormadım". İkisini karıştırırsak
  // veri gelmeden ekranda "0" yazar ve kullanıcı yanlış bilgi görür.
  // ?? ile || farkında öğrendiğimiz aynı prensip: yokluk ile sıfır
  // birbirinden ayrı şeyler.
  const [oturumSayisi, setOturumSayisi] = useState(null);



  // Giriş varsa profili çek, çıkışta temizle
  useEffect(() => {
    async function profiliGetir() {
      if (!token) {
        setProfil(null);
        return;
      }
      try {
        const veri = await apiGet('/auth/ben-kimim');
        setProfil(veri);
      } catch (hata) {
        console.log('Profil alınamadı:', hata.message);
      }
    }
    profiliGetir();
  }, [token]);
  
  // ⭐ YENİ — OTURUM SAYISINI ÇEK
  //
  // Neden useFocusEffect, useEffect değil?
  //   Kullanıcı Oturumlarım ekranına girip bir oturum kapatıp geri
  //   dönebilir. useEffect sadece token değişince çalışırdı ve sayaç
  //   bayat kalırdı. useFocusEffect ekran her odağa geldiğinde çalışır.
  //
  //   Sunucudan gelen türetilmiş değer, girdisi değişebiliyorsa yeniden
  //   sorulmalı — kupon indiriminde de aynı ilkeyi uygulamıştık.
  useFocusEffect(
    useCallback(() => {
      // Misafirse istek atma
      if (!token) {
        setOturumSayisi(null);
        return;
      }

      // ⭐ İPTAL BAYRAĞI
      //
      // Kullanıcı ekrana girip hemen çıkarsa istek hâlâ yolda olabilir.
      // Cevap gelince setOturumSayisi çağrılır ama ekran artık odakta
      // değil — boşa iş. Temizlik fonksiyonunda bayrağı kaldırıp
      // cevabı yok sayıyoruz.
      let iptalEdildi = false;

      async function sayiyiGetir() {
        try {
          // Mobilde kasa ASENKRON (SecureStore) — await şart
          const refresh = (await refreshTokenAl()) ?? '';

          const veri = await apiPost('/auth/oturumlarim', {
            refreshToken: refresh,
          });

          if (!iptalEdildi) {
            setOturumSayisi(veri.toplam);
          }
        } catch {
          // Sessizce yut. Bu bir SAYAÇ — alınamazsa ekran yine
          // çalışmalı, kullanıcıya hata göstermek gereksiz gürültü.
          // Asıl hata yönetimi Oturumlarım ekranında yapılıyor.
          if (!iptalEdildi) {
            setOturumSayisi(null);
          }
        }
      }

      sayiyiGetir();

      return () => {
        iptalEdildi = true;
      };
    }, [token])
  );

  function menuSatiri(ikon, baslik, hedef) {
    return (
      <TouchableOpacity
        style={styles.menuSatir}
        onPress={() => navigation.navigate(hedef)}
        activeOpacity={0.7}
      >
        <Ionicons name={ikon} size={22} color={renkler.anaRenk} />
        <Text style={styles.menuYazi}>{baslik}</Text>
        <Ionicons name="chevron-forward" size={20} color={renkler.yaziGri} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <ScrollView contentContainerStyle={styles.icerik}>
        <Text style={styles.baslik}>Hesabım</Text>

        {token ? (
          /* ============ ÜYE GÖRÜNÜMÜ ============ */
          <>
            <View style={styles.kart}>
              <Text style={styles.ad}>{kullanici?.fullName}</Text>

              {profil?.email ? (
                <Text style={styles.eposta}>{profil.email}</Text>
              ) : null}

              <View style={styles.kartAlt}>
                <Text style={styles.rol}>Rol: {profil?.role || kullanici?.role}</Text>

                {profil?.createdAt ? (
                  <Text style={styles.uyelik}>Üye: {gunBicimle(profil.createdAt)}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.menu}>
              {menuSatiri('receipt-outline', 'Siparişlerim', 'Siparislerim')}
              {menuSatiri('location-outline', 'Adreslerim', 'Adreslerim')}
              {menuSatiri('card-outline', 'Kartlarım', 'Kartlarim')}
              {menuSatiri('wallet-outline', 'Ödemelerim', 'Odemelerim')}
            </View>

            {/* ⭐ YENİ — HESAP AYARLARI
                Alışveriş menüsünden AYRI bir grup olarak duruyor.
                Sebebi: "Siparişlerim" ve "Adreslerim" alışverişe dair,
                "Şifre Değiştir" hesaba dair. Farklı amaçları aynı listede
                karıştırmak kullanıcıyı yavaşlatır — göz gruplara göre tarar. */}
            <Text style={styles.bolumBaslik}>Hesap Ayarları</Text>
            <View style={styles.menu}>
              {/* Profil ekranı e-postayı KİLİTLİ göstermek için biliyor
                  olmalı; parametre olarak geçiyoruz. Orada ayrıca
                  /auth/ben-kimim çağırmak gereksiz bir ağ turu olurdu. */}
              <TouchableOpacity
                style={styles.menuSatir}
                onPress={() =>
                  navigation.navigate('ProfilDuzenle', { eposta: profil?.email })
                }
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={22} color={renkler.anaRenk} />
                <Text style={styles.menuYazi}>Profili Düzenle</Text>
                <Ionicons name="chevron-forward" size={20} color={renkler.yaziGri} />
              </TouchableOpacity>

              {menuSatiri('lock-closed-outline', 'Şifre Değiştir', 'SifreDegistir')}

              {/* ⭐ YENİ — Aktif Oturumlar + sayaç rozeti.
                  
                  menuSatiri yardımcısını kullanmıyoruz çünkü o sağ
                  tarafa rozet koymuyor. Tek bir istisna için yardımcının
                  imzasını değiştirip tüm çağrıları güncellemek yerine
                  bu satırı elle yazıyoruz — "bir kere gereken şey için
                  soyutlama değiştirilmez". */}
              <TouchableOpacity
                style={styles.menuSatir}
                onPress={() => navigation.navigate('Oturumlarim')}
                activeOpacity={0.7}
              >
                <Ionicons name="desktop-outline" size={22} color={renkler.anaRenk} />
                <Text style={styles.menuYazi}>Aktif Oturumlar</Text>

                {/* Sayı henüz gelmediyse "···" gösteriyoruz.
                    Boş bırakmak "hiç oturum yok" gibi okunurdu;
                    0 yazmak düpedüz yanlış bilgi olurdu. */}
                <View style={styles.sayacRozet}>
                  <Text style={styles.sayacYazi}>
                    {oturumSayisi === null ? '···' : oturumSayisi}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={renkler.yaziGri} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ============ MİSAFİR GÖRÜNÜMÜ ============ */
          <>
            <View style={styles.misafirKart}>
              <View style={styles.misafirIkonDaire}>
                <Ionicons
                  name="person-outline"
                  size={38}
                  color={renkler.anaRenk}
                />
              </View>

              <Text style={styles.misafirBaslik}>Hoş geldin!</Text>

              <Text style={styles.misafirAciklama}>
                Sepetine ürün eklemek, favori kaydetmek ve sipariş verebilmek
                için giriş yapman gerekiyor.
              </Text>

              <TouchableOpacity
                style={styles.anaButon}
                onPress={() => navigation.navigate('Giris')}
                activeOpacity={0.8}
              >
                <Text style={styles.anaButonYazi}>Giriş Yap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ikincilButon}
                onPress={() => navigation.navigate('Kayit')}
                activeOpacity={0.8}
              >
                <Text style={styles.ikincilButonYazi}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.misafirDipnot}>
              Giriş yapmadan ürünleri gezmeye devam edebilirsin.
            </Text>
          </>
        )}

        {/* ============ ORTAK: GÖRÜNÜM (TEMA) ============ */}
        <Text style={styles.bolumBaslik}>Görünüm</Text>
        <View style={styles.temaSatir}>
          <TouchableOpacity
            style={[styles.temaButon, temaAdi === 'acik' && styles.temaButonSecili]}
            onPress={() => temaDegistir('acik')}
          >
            <Text style={[styles.temaYazi, temaAdi === 'acik' && styles.temaYaziSecili]}>
              Açık
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.temaButon, temaAdi === 'koyu' && styles.temaButonSecili]}
            onPress={() => temaDegistir('koyu')}
          >
            <Text style={[styles.temaYazi, temaAdi === 'koyu' && styles.temaYaziSecili]}>
              Koyu
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============ SADECE ÜYE: ÇIKIŞ ============ */}
        {token ? (
          <>
            <TouchableOpacity style={styles.cikisButon} onPress={cikisYap}>
              <Text style={styles.cikisYazi}>Çıkış Yap</Text>
            </TouchableOpacity>

            {/* ⭐ YENİ — TEHLİKELİ BÖLGE
                
                Tasarım kararları:
                  · En ALTTA duruyor — kullanıcı buraya kazara gelmez,
                    kaydırıp aramak gerekir
                  · Büyük buton DEĞİL, ince bir metin bağlantısı — göze
                    çarpmasın, yanlışlıkla basılmasın
                  · Üstünde ayırıcı çizgi var — "burası farklı bir bölge"
                  · Altında ne olacağı yazıyor — tıklamadan önce bilsin
                
                Yıkıcı işlemleri kolay erişilir yapmak kötü tasarımdır.
                Zor bulunur ama BULUNABİLİR olmalı — gizlemek de yanlış. */}
            <View style={styles.tehlikeAyirac} />

            <TouchableOpacity
              style={styles.tehlikeSatir}
              onPress={() => navigation.navigate('HesapKapat')}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={renkler.hata} />
              <Text style={styles.tehlikeSatirYazi}>Hesabımı Kapat</Text>
            </TouchableOpacity>

            <Text style={styles.tehlikeAciklama}>
              Kişisel bilgilerin silinir, geçmiş siparişlerin muhasebe
              kaydı olarak saklanır. Bu işlem geri alınamaz.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan
  },
  icerik: {
    padding: 16
  },
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: renkler.yaziKoyu
  },

  /* --- ÜYE GÖRÜNÜMÜ --- */
  kart: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  ad: {
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  eposta: {
    fontSize: 14,
    color: renkler.yaziOrta,
    marginTop: 2
  },
  kartAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  rol: {
    fontSize: 15,
    color: renkler.yaziOrta
  },
  uyelik: {
    fontSize: 13,
    color: renkler.yaziGri
  },
  menu: {
    marginBottom: 24
  },
  menuSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: renkler.kenarlik
  },
  menuYazi: {
    flex: 1,
    fontSize: 16,
    color: renkler.yaziKoyu,
    marginLeft: 12
  },

  /* ⭐ YENİ — oturum sayacı rozeti.
     minWidth: tek haneli ve iki haneli sayılarda rozet aynı genişlikte
     kalsın, satırlar arası zıplama olmasın. */
  sayacRozet: {
    minWidth: 26,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: renkler.acikKart,
    marginRight: 8,
    alignItems: 'center'
  },
  sayacYazi: {
    fontSize: 12,
    fontWeight: '700',
    color: renkler.yaziOrta
  },



  /* --- MİSAFİR GÖRÜNÜMÜ --- */
  misafirKart: {
    backgroundColor: renkler.acikKart,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12
  },
  misafirIkonDaire: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: renkler.kartArka,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  misafirBaslik: {
    fontSize: 20,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    marginBottom: 8
  },
  misafirAciklama: {
    fontSize: 14,
    color: renkler.yaziOrta,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22
  },
  anaButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10
  },
  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold'
  },
  ikincilButon: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: renkler.anaRenk,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%'
  },
  ikincilButonYazi: {
    color: renkler.anaRenk,
    fontSize: 16,
    fontWeight: 'bold'
  },
  misafirDipnot: {
    fontSize: 12,
    color: renkler.yaziGri,
    textAlign: 'center',
    marginBottom: 24
  },

  /* --- ORTAK: TEMA --- */
  bolumBaslik: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 10
  },
  temaSatir: {
    flexDirection: 'row',
    marginBottom: 24
  },
  temaButon: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    alignItems: 'center',
    marginRight: 10
  },
  temaButonSecili: {
    backgroundColor: renkler.anaRenk,
    borderColor: renkler.anaRenk
  },
  temaYazi: {
    fontSize: 15,
    color: renkler.yaziOrta
  },
  temaYaziSecili: {
    color: renkler.anaRenkUstuYazi,
    fontWeight: 'bold'
  },

  /* --- ÇIKIŞ --- */
  cikisButon: {
    backgroundColor: renkler.anaRenk,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cikisYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold'
  },

  /* --- ⭐ YENİ: TEHLİKELİ BÖLGE --- */
  tehlikeAyirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginTop: 32,
    marginBottom: 16
  },
  tehlikeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12
  },
  tehlikeSatirYazi: {
    fontSize: 15,
    color: renkler.hata,
    fontWeight: '600'
  },
  tehlikeAciklama: {
    fontSize: 12,
    color: renkler.yaziGri,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8
  }
});