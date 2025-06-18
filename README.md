# Negeka ReactGraphQl Magento 2 Module

Bu modül, Magento 2 Luma teması üzerinde çalışmak üzere geliştirilmiş ve **Sample Data** modülünün yüklü olmasını gerektiren bir React ve GraphQL entegrasyon modülüdür.

---

## Gereksinimler

- Magento 2 (4.8p-1 önerilir)
- Luma teması (Magento varsayılan teması)
- Sample Data modülleri kurulu ve aktif
- PHP 8.2 uyumlu ortam
- Composer yüklü ve çalışır durumda

---

## Kurulum Adımları

### 1. Magento 2 ve Sample Data Kurulumu

Eğer Magento 2 ve sample data kurulu değilse, aşağıdaki adımları takip edin:

```bash
# Magento 2 kurulumu (örnek)
composer create-project --repository-url=https://repo.magento.com/ magento/project-community-edition=2.4.8p-1

# Sample data modüllerini yükleyin
bin/magento sampledata:deploy

# Sample data kurulumunu tamamlayın
bin/magento setup:upgrade

mkdir -p app/code/Negeka/ReactGraphQl
# Modül dosyalarını bu klasöre kopyalayın veya klonlayın

# Modülü etkinleştirin
bin/magento module:enable Negeka_ReactGraphQl

# Setup upgrade ile veritabanı güncellemelerini uygulayın
bin/magento setup:upgrade

# Static content deploy
bin/magento setup:static-content:deploy -f

# Cache temizleme
bin/magento cache:flush

# Geliştirme Ortamında çalıştırmanızı öneririm
bin/magento deploy:mode:set developer

## Kullanım

Modül kurulduktan sonra, React tabanlı frontend ve GraphQL işlemlerini aşağıdaki URL üzerinden görüntüleyebilirsiniz:

https://<magento-site-url>/negekareactgraphql/product/view

Bu sayfa, React bileşenlerini ve GraphQL API isteklerini çalıştırarak ürün detaylarını dinamik olarak gösterir.
