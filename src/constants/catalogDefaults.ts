import type { OperationsSettings, StorefrontSettings } from '../types/models';

export const BOOTSTRAPPED_PRIMARY_OWNER_EMAIL = 'david.qc.op@gmail.com';
export const BOOTSTRAPPED_SECONDARY_OWNER_EMAIL = 'amico.official22@gmail.com';

export const GENERATED_ASSETS = {
  heroAtelier: '/src/assets/images/hero_souvenir_atelier_1795739708014.jpg',
  ceramicTumbler: '/src/assets/images/product_ceramic_tumbler_1795739707916.jpg',
  canvasTotebag: '/src/assets/images/product_canvas_totebag_1795739708260.jpg',
  linenGiftbox: '/src/assets/images/product_linen_giftbox_1795739709136.jpg',
  reedDiffuser: '/src/assets/images/product_reed_diffuser_1795739708869.jpg',
} as const;

export const BRAND_LOGO_PATH = '/assets/aistudio/image_b614b5c5.png';

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  businessName: 'ami.co_official',
  tagline: 'Kurasi souvenir kustom made-to-order untuk pernikahan, korporat, dan momen seremonial.',
  logoUrl: BRAND_LOGO_PATH,
  whatsappNumber: '6281234567890',
  instagramHandle: '@ami.co_official',
  address: 'Jl. Kemang Raya No. 48, Jakarta Selatan',
  contactEmail: 'halo@amico-official.id',
  contactHours: 'Senin - Sabtu, 09.00 - 17.30 WIB',
  defaultCurrency: 'IDR',
};

export const DEFAULT_OPERATIONS_SETTINGS: OperationsSettings = {
  primaryOwnerEmail: BOOTSTRAPPED_PRIMARY_OWNER_EMAIL,
  secondaryOwnerEmail: BOOTSTRAPPED_SECONDARY_OWNER_EMAIL,
  defaultQuotationValidityDays: 14,
  inquiryNumberFormat: 'INQ-YYYYMMDD-XXXX',
  quotationNumberFormat: 'QUO-YYYYMM-XXXX',
  salesOrderNumberFormat: 'SO-YYYYMM-XXXX',
  purchaseOrderNumberFormat: 'PO-YYYYMM-XXXX',
};

export interface StandardCategorySeed {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  imageUrl: string;
}

export const STANDARD_CATEGORIES: StandardCategorySeed[] = [
  {
    id: 'wedding-souvenirs',
    slug: 'wedding-souvenirs',
    name: 'Wedding Souvenirs',
    description: 'Cendera mata pernikahan elegan dengan personalisasi nama dan tanggal acara.',
    sortOrder: 1,
    imageUrl: GENERATED_ASSETS.linenGiftbox,
  },
  {
    id: 'engagement',
    slug: 'engagement',
    name: 'Engagement',
    description: 'Hantaran dan bingkisan pertunangan berkonsep hangat dan berkelas.',
    sortOrder: 2,
    imageUrl: GENERATED_ASSETS.reedDiffuser,
  },
  {
    id: 'birthday',
    slug: 'birthday',
    name: 'Birthday',
    description: 'Souvenir ulang tahun dan perayaan personal dengan kemasan eksklusif.',
    sortOrder: 3,
    imageUrl: GENERATED_ASSETS.ceramicTumbler,
  },
  {
    id: 'corporate-gifts',
    slug: 'corporate-gifts',
    name: 'Corporate Gifts',
    description: 'Bingkisan perusahaan, seminar kit, dan hampers klien dengan branding logo.',
    sortOrder: 4,
    imageUrl: GENERATED_ASSETS.canvasTotebag,
  },
  {
    id: 'bags',
    slug: 'bags',
    name: 'Bags',
    description: 'Tote bag kanvas, pouch linen, dan tas serut dengan sablon atau bordir kustom.',
    sortOrder: 5,
    imageUrl: GENERATED_ASSETS.canvasTotebag,
  },
  {
    id: 'drinkware',
    slug: 'drinkware',
    name: 'Drinkware',
    description: 'Tumbler keramik, botol vakum, dan cangkir dengan grafir laser presisi.',
    sortOrder: 6,
    imageUrl: GENERATED_ASSETS.ceramicTumbler,
  },
  {
    id: 'accessories',
    slug: 'accessories',
    name: 'Accessories',
    description: 'Aksesori seremonial seperti cermin saku, gantungan kunci kulit, dan pin.',
    sortOrder: 7,
    imageUrl: GENERATED_ASSETS.heroAtelier,
  },
  {
    id: 'household',
    slug: 'household',
    name: 'Household',
    description: 'Pengharum ruangan reed diffuser, lilin aromaterapi, dan perlengkapan rumah.',
    sortOrder: 8,
    imageUrl: GENERATED_ASSETS.reedDiffuser,
  },
  {
    id: 'packaging',
    slug: 'packaging',
    name: 'Packaging',
    description: 'Rigid box linen, pita grosgrain cetak, segel lilin, dan kartu ucapan kustom.',
    sortOrder: 9,
    imageUrl: GENERATED_ASSETS.linenGiftbox,
  },
  {
    id: 'other-custom-products',
    slug: 'other-custom-products',
    name: 'Other Custom Products',
    description: 'Produk souvenir kustom sesuai spesifikasi khusus acara atau perusahaan Anda.',
    sortOrder: 10,
    imageUrl: GENERATED_ASSETS.heroAtelier,
  },
];

export const DEV_SAMPLE_PRODUCTS = [
  {
    id: 'dev-sample-tumbler-sage',
    productCode: 'SBH-DW-001',
    name: 'Tumbler Keramik Matte Sage & Krim',
    categoryId: 'drinkware',
    categoryName: 'Drinkware',
    photos: [GENERATED_ASSETS.ceramicTumbler],
    description:
      'Tumbler berinsulasi dinding ganda dengan lapisan luar matte sage dan dasar keramik krim hangat. Ideal untuk souvenir pernikahan eksklusif maupun bingkisan korporat.',
    specifications: 'Kapasitas 380 ml · Stainless steel SUS 304 · Finishing matte powder coat · Tutup anti-tumpah dengan pegangan silikon',
    availableColors: ['Sage Green', 'Warm Cream', 'Charcoal'],
    availableSizes: ['380 ml', '500 ml'],
    customizationOptions: ['Grafir Laser Monogram', 'Sablon Logo 1 Warna', 'Kemasan Rigid Box'],
    minimumOrderQty: 50,
    startingPrice: 68000,
    estimatedLeadTimeDays: 14,
    isFeatured: true,
    isPublished: true,
  },
  {
    id: 'dev-sample-totebag-kanvas',
    productCode: 'SBH-BG-002',
    name: 'Tote Bag Kanvas Organik Tali Sage',
    categoryId: 'bags',
    categoryName: 'Bags',
    photos: [GENERATED_ASSETS.canvasTotebag],
    description:
      'Tas jinjing berbahan kanvas katun organik tebal berwarna krim natural dengan tali webbing sage green yang kokoh dan elegan.',
    specifications: 'Katun kanvas 12 oz · Dimensi 34 x 38 x 10 cm · Jahitan penguat X-stitch · Kantong dalam beritsleting',
    availableColors: ['Natural Cream / Sage', 'Natural Cream / Espresso'],
    availableSizes: ['Medium (34x38 cm)', 'Large (40x42 cm)'],
    customizationOptions: ['Bordir Monogram Timbul', 'Sablon Plastisol', 'Label Woven Kustom'],
    minimumOrderQty: 100,
    startingPrice: 42000,
    estimatedLeadTimeDays: 12,
    isFeatured: true,
    isPublished: true,
  },
  {
    id: 'dev-sample-linen-giftbox',
    productCode: 'SBH-PK-003',
    name: 'Kotak Kado Linen Pita Grosgrain & Segel',
    categoryId: 'wedding-souvenirs',
    categoryName: 'Wedding Souvenirs',
    photos: [GENERATED_ASSETS.linenGiftbox],
    description:
      'Rigid gift box berlapis kertas linen bertekstur halus, dilengkapi pita grosgrain hijau sage dan segel lilin kuningan untuk kemasan cendera mata seremonial.',
    specifications: 'Hardboard 2.5 mm · Pelapis kertas linen impor · Pita grosgrain 25 mm · Segel lilin kustom inisial',
    availableColors: ['Warm Cream Linen', 'Ivory', 'Soft Sage'],
    availableSizes: ['18 x 14 x 7 cm', '24 x 18 x 9 cm'],
    customizationOptions: ['Hot Foil Emas / Perak', 'Segel Lilin Inisial', 'Kartu Ucapan Kustom'],
    minimumOrderQty: 50,
    startingPrice: 35000,
    estimatedLeadTimeDays: 10,
    isFeatured: true,
    isPublished: true,
  },
  {
    id: 'dev-sample-reed-diffuser',
    productCode: 'SBH-HH-004',
    name: 'Set Reed Diffuser Kaca Frosted & Tabung Linen',
    categoryId: 'household',
    categoryName: 'Household',
    photos: [GENERATED_ASSETS.reedDiffuser],
    description:
      'Pengharum ruangan botol kaca frosted nuansa sage dengan tutup kayu solid dan kemasan tabung linen mewah, menghadirkan aroma kayu cendana dan bergamot.',
    specifications: 'Volume 100 ml / 200 ml · 6 batang rotan natural · Label kertas katun bertekstur · Kemasan tabung rigid',
    availableColors: ['Frosted Sage', 'Amber Apothecary'],
    availableSizes: ['100 ml', '200 ml'],
    customizationOptions: ['Label Kertas Kustom Acara', 'Emboss Tutup Tabung', 'Pilihan Aroma Eksklusif'],
    minimumOrderQty: 50,
    startingPrice: 85000,
    estimatedLeadTimeDays: 18,
    isFeatured: true,
    isPublished: true,
  },
];
