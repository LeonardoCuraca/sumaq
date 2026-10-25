export interface Product {
  id: string;
  slug: string;
  category: 'hair' | 'barber';
  name: string;
  badge?: string;
  punchline: string;
  temp: string;
  voltage: string[];
  options?: string[];
  prices: {
    reg: number;
    min: number;
    salonPack: number;
  };
  images: string[];
  specs: Record<string, string>;
  shortDesc: string;
  longDesc: string;
  isFeatured?: boolean;
  stock?: number;
  reservedStock?: number;
  lowStockThreshold?: number;
  sku?: string;
  trackInventory?: boolean;
}

export function availableStock(product: Pick<Product, 'stock' | 'reservedStock' | 'trackInventory'>): number {
  if (product.trackInventory === false) return 999;
  const physical = typeof product.stock === 'number' ? product.stock : 25;
  const reserved = typeof product.reservedStock === 'number' ? product.reservedStock : 0;
  return Math.max(0, physical - reserved);
}

/**
 * Determina si una línea de productos ('hair' | 'barber') cuenta con al menos un producto con stock disponible.
 * Cuando una línea se queda sin stock en todos sus productos, desaparece automáticamente del catálogo público.
 */
export function categoryHasStock(
  products: Pick<Product, 'category' | 'stock' | 'reservedStock' | 'trackInventory'>[],
  category: Product['category']
): boolean {
  return products.some((p) => p.category === category && availableStock(p) > 0);
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'plancha-extreme',
    slug: 'plancha_extreme',
    category: 'hair',
    name: 'Plancha Lizze Extreme',
    badge: 'Best Seller Alisados',
    punchline: 'Alisado brasileño profesional en la mitad de pasadas',
    temp: '250°C (480°F)',
    voltage: ['220V', '127V'],
    prices: { reg: 380, min: 360, salonPack: 350 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/plancha-lizze-extreme.png',
    ],
    specs: {
      placas: 'Titanio nano-revestido 29mm x 110mm',
      cable: 'Giratorio de 2.7 metros con refuerzo profesional',
      temperatura: '5 niveles digitales hasta 250°C (480°F)',
      seguridad: 'Apagado automático de protección tras 60 minutos',
      garantia: '6 meses oficial en Perú con SUMAQ',
    },
    shortDesc:
      'La plancha más buscada por los mejores estilistas de Lima y provincias. Acelera el proceso de alisados progresivos, botox y keratina sin quemar la hebra.',
    longDesc:
      'Diseñada para uso continuo e intensivo en salones de belleza. Sus placas de titanio distribuyen el calor de manera uniforme y sellan la cutícula instantáneamente, otorgando un brillo espejo duradero y eliminando el frizz de inmediato.',
    isFeatured: true,
    stock: 25,
    sku: 'LZ-PLANCHA-EXTREME',
  },
  {
    id: 'plancha-supreme',
    slug: 'plancha_supreme',
    category: 'hair',
    name: 'Plancha Lizze Supreme',
    badge: 'Potencia Máxima',
    punchline: 'Placas anchas de 40mm de titanio para mechones más grandes',
    temp: '252°C (485°F)',
    voltage: ['220V', '127V'],
    prices: { reg: 480, min: 460, salonPack: 440 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/plancha-lizze-supreme.png',
    ],
    specs: {
      placas: 'Titanio Ultra-Ancho 40mm x 110mm',
      cable: '3 metros giratorio 360°',
      temperatura: 'Hasta 252°C (485°F) con sensor térmico MCH',
      display: 'Indicador LED multifunción con calibración rápida',
      garantia: '6 meses oficial en Perú',
    },
    shortDesc:
      'Diseñada específicamente para melenas abundantes, cabellos gruesos y tratamientos de sellado en menor tiempo.',
    longDesc:
      'Permite procesar mechones sustancialmente más gruesos gracias a su superficie de 40 mm, reduciendo el desgaste físico del estilista hasta en un 40% durante jornadas de alta demanda en el salón.',
    isFeatured: true,
    stock: 25,
    sku: 'LZ-PLANCHA-SUPREME',
  },
  {
    id: 'plancha-slim-extreme',
    slug: 'plancha_lim_extreme',
    category: 'hair',
    name: 'Plancha Lizze Slim',
    badge: 'Precisión de Raíz',
    punchline: 'Estructura delgada para flequillos, bordes y cabellos cortos',
    temp: '250°C (480°F)',
    voltage: ['220V'],
    prices: { reg: 360, min: 340, salonPack: 330 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/plancha-lizze-slim.png',
    ],
    specs: {
      placas: 'Titanio ultra-slim 20mm',
      peso: 'Estructura ultraligera de 320g',
      temperatura: '5 niveles configurables hasta 250°C',
      garantia: '6 meses oficial en Perú',
    },
    shortDesc:
      'Permite acercarse al cuero cabelludo con precisión quirúrgica sin riesgo de quemaduras en raíces y contornos.',
    longDesc:
      'Es la compañera indispensable de la Plancha Lizze Extreme para dar los toques finales en nucas, patillas y flequillos rebeldes.',
    stock: 25,
    sku: 'LZ-PLANCHA-SLIM',
  },
  {
    id: 'plancha-fusion',
    slug: 'plancha_fusion',
    category: 'hair',
    name: 'Plancha Lizze Fusion',
    badge: 'Nueva Tecnología',
    punchline: 'Placas flotantes de titanio de 30mm y calentamiento ultrarrápido',
    temp: '250°C (480°F)',
    voltage: ['220V', '127V'],
    prices: { reg: 430, min: 400, salonPack: 395 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/plancha-lizze-fusion.png',
    ],
    specs: {
      placas: 'Titanio Flotante 30mm',
      peso: '450 g con balance de muñeca ergonómico',
      seguridad: 'Circuito electrónico protegido contra caídas de tensión',
      garantia: '6 meses oficial',
    },
    shortDesc:
      'Especialmente creada para cuidar la fibra capilar manteniendo una temperatura ultra-alta y constante.',
    longDesc:
      'Diseñada para profesionales que exigen consistencia térmica milimétrica. Sus placas amortiguadas evitan tirones durante el planchado.',
    stock: 25,
    sku: 'LZ-PLANCHA-FUSION',
  },
  {
    id: 'plancha-mini',
    slug: 'plancha_mini',
    category: 'hair',
    name: 'Plancha Mini Lizze',
    badge: 'Compacta & Bivolt',
    punchline: 'Ideal para retoques en eventos, novias y cabellos cortos',
    temp: '200°C (392°F)',
    voltage: ['Bivolt Automático'],
    prices: { reg: 200, min: 180, salonPack: 165 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/plancha-mini-lizze.png',
    ],
    specs: {
      tamano: '17 cm de longitud total',
      voltaje: 'Doble voltaje inteligente 110V - 220V',
      placas: 'Titanio de respuesta térmica inmediata',
      garantia: '6 meses oficial',
    },
    shortDesc:
      'Se adapta a cualquier maletín o bolso de maquillaje. Potencia real en tamaño miniatura.',
    longDesc:
      'Diseñada para barberos y estilistas a domicilio que requieren transportar herramientas de calidad profesional sin cargar bultos pesados.',
    stock: 25,
    sku: 'LZ-PLANCHA-MINI',
  },
  {
    id: 'secador-extreme',
    slug: 'secador_extreme',
    category: 'hair',
    name: 'Secadora Lizze Extreme',
    badge: 'Turbo Power',
    punchline: 'Reduce el tiempo de secado hasta en un 50% con motor AC profesional 2400W',
    temp: 'Flujo a 160°C (320°F)',
    voltage: ['220V', '127V'],
    prices: { reg: 480, min: 460, salonPack: 440 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/secadora-lizze-extreme.png',
    ],
    specs: {
      potencia: '2400W reales continuos',
      flujo: 'Alta velocidad con emisión de iones negativos',
      boquillas: 'Incluye 2 boquillas direccionadoras de calor',
      cable: '3 metros de uso rudo',
      garantia: '6 meses oficial',
    },
    shortDesc:
      'Acelera el brushing de salón y prepara la fibra capilar para alisados con brillo absoluto.',
    longDesc:
      'Diseñada exclusivamente para el trabajo diario en peluquerías de alto tránsito. Menos tiempo por cliente significa mayor rentabilidad para tu salón.',
    isFeatured: true,
    stock: 25,
    sku: 'LZ-SECADORA-EXTREME',
  },
  {
    id: 'secador-supreme',
    slug: 'secador_supreme',
    category: 'hair',
    name: 'Secadora Lizze Supreme',
    badge: 'Línea Élite',
    punchline: 'Temperatura de hasta 356°F y acústica optimizada',
    temp: 'Hasta 180°C (356°F)',
    voltage: ['220V'],
    prices: { reg: 580, min: 560, salonPack: 535 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/secadora-lizze-supreme.png',
    ],
    specs: {
      motor: 'Motor Brushless Silence de alta resistencia',
      funciones: 'Golpe de frío instantáneo y 6 combinaciones de aire',
      peso: 'Reducción de fatiga en hombro y muñeca',
      garantia: '6 meses oficial',
    },
    shortDesc:
      'La secadora más potente y confortable para salones con largas jornadas de peinado.',
    longDesc:
      'Máximo caudal de aire caliente que sella cutículas sin resecar el córtex del cabello, dejando hebras suaves y manejables.',
    isFeatured: true,
    stock: 25,
    sku: 'LZ-SECADORA-SUPREME',
  },
  {
    id: 'secadora-hipersonic',
    slug: 'secadora_hipersonic',
    category: 'hair',
    name: 'Secadora Lizze Hipersonic',
    badge: 'Tecnología Digital 2600W',
    punchline: 'Motor digital ultraliviano con 4 programas inteligentes y autolimpieza',
    temp: '55°C a 120°C Digital',
    voltage: ['220V'],
    prices: { reg: 650, min: 620, salonPack: 590 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/secadora-lizze-hipersonic.png',
    ],
    specs: {
      potencia: '2600W reales con motor digital brushless',
      programas: '4 modos inteligentes (Baby 55°C, Suave 70°C, Medio 95°C, Turbo 120°C)',
      peso: 'Ultraliviana de 520g con sistema de autolimpieza',
      accesorios: 'Incluye 2 boquillas concentradoras y 1 difusor profesional',
      garantia: '6 meses oficial en Perú con SUMAQ',
    },
    shortDesc:
      'La secadora digital más avanzada de Lizze Brasil: máxima potencia de 2600W en un cuerpo ultraligero y silencioso.',
    longDesc:
      'Equipada con motor digital de alta eficiencia y generador de iones negativos que sellan la cutícula reduciendo el frizz al instante. Su función de autolimpieza inteligente invierte el flujo de aire para mantener el filtro impecable y prolongar la vida útil en el salón.',
    stock: 25,
    sku: 'LZ-SECADORA-HIPERSONIC',
  },
  {
    id: 'rizador-extreme',
    slug: 'rizador_extreme',
    category: 'hair',
    name: 'Tenaza Lizze',
    badge: 'Ondas de Larga Duración',
    punchline: '15 variaciones de temperatura de 80°C a 230°C en titanio',
    temp: '230°C (450°F)',
    voltage: ['Bivolt Automático'],
    options: ['19mm', '25mm', '32mm'],
    prices: { reg: 200, min: 180, salonPack: 175 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/tenaza-lizze.png',
    ],
    specs: {
      cilindros: 'Opciones disponibles en 19mm, 25mm y 32mm',
      temperatura: '15 configuraciones digitales de precisión',
      punta: 'Punta fría de seguridad antiquemaduras',
      garantia: '6 meses oficial',
    },
    shortDesc:
      'Ondas al agua, rizos definidos y peinados para novias que duran todo el evento sin caerse.',
    longDesc:
      'Desarrollada para peinadores profesionales. Su cilindro de titanio de conducción rápida permite marcar la onda en solo 5 segundos por mechón.',
    stock: 25,
    sku: 'LZ-TENAZA-EXTREME',
  },
  {
    id: 'foton-lizze',
    slug: 'foton',
    category: 'hair',
    name: 'Photon Lizze',
    badge: 'Tecnología Láser LED',
    punchline: 'Luz azul 450nm para acelerar tratamientos, alisados y botox capilar',
    temp: 'Luz atérmica 450nm',
    voltage: ['Bivolt Automático'],
    prices: { reg: 950, min: 900, salonPack: 880 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/photon-lizze.png',
    ],
    specs: {
      luces: 'Luz LED Azul 450nm de alta penetración fotónica',
      incluye: '2 pares de lentes profesionales de protección óptica UV',
      cable: '2.8 metros reforzado',
      garantia: '6 meses oficial',
    },
    shortDesc:
      'Multiplica el efecto de cualquier tratamiento químico reduciendo los tiempos de exposición a la mitad.',
    longDesc:
      'Equipo de bio-fototerapia para salón que abre nuevos servicios de alto margen. Penetra los principios activos en la fibra capilar aumentando la fijación del color, botox, hidrataciones y alisados.',
    stock: 25,
    sku: 'LZ-PHOTON',
  },
  {
    id: 'cepillo-jabali',
    slug: 'juego_de_cepillo_cerda_de_jabali',
    category: 'hair',
    name: 'Juego de Cepillos Cerda Jabalí',
    badge: 'Brushing de Lujo',
    punchline: 'Distribuye los aceites naturales y sella cutículas sin reventar el cabello',
    temp: 'N/A',
    voltage: ['N/A'],
    options: [
      'Color Negro',
      'Color Amarillo',
      'Color Rosado',
      '5.5cm (S/ 60)',
      '6.5cm (S/ 65)',
      '7.0cm (S/ 70)',
      '7.5cm (S/ 75)',
    ],
    prices: { reg: 60, min: 60, salonPack: 55 },
    images: [
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/cepillo-jabali-negro.png',
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/cepillo-jabali-amarillo.png',
      'https://52bu2pug01tretkn.public.blob.vercel-storage.com/products/cepillo-jabali-rosado.png',
    ],
    specs: {
      cerdas: '100% cerda natural de jabalí reforzada con nylon',
      colores: 'Disponible en Negro, Amarillo y Rosado',
      mango: 'Madera tratada ergonómica antideslizante',
      beneficio: 'Elimina electricidad estática y añade sedosidad',
      garantia: 'Garantía de satisfacción SUMAQ',
    },
    shortDesc:
      'El secreto de los mejores salones para un pulido impecable durante el secado y brushing.',
    longDesc:
      'Diseñados para deslizar suavemente a través de la hebra sin dañarla, proporcionando volumen natural y un sellado pulcro en 5 medidas profesionales.',
    stock: 25,
    sku: 'LZ-CEPILLOS-JABALI',
  },
  // Barber Products (stock: 0 -> la línea Barber desaparece automáticamente mientras no haya stock)
  {
    id: 'shaver-lizze',
    slug: 'shaver',
    category: 'barber',
    name: 'Shaver Lizze',
    badge: 'Afeitado al Ras',
    punchline: 'Cuchillas ultrafinas con suspensión hipoalergénica 8000 RPM',
    temp: 'N/A',
    voltage: ['Batería Litio USB'],
    prices: { reg: 340, min: 320, salonPack: 300 },
    images: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
    ],
    specs: {
      motor: 'Rotativo potente de 8000 RPM',
      autonomia: '180 minutos de uso continuo',
      laminas: 'Hipoalergénicas doradas que no irritan piel sensible',
      garantia: '6 meses oficial en Perú',
    },
    shortDesc:
      'Afeitados a ras cero milímetros para desvanecidos limpios y cuellos perfectos.',
    longDesc:
      'Construida para barberos exigentes. Su cabezal oscilante sigue los contornos faciales y craneales sin tirones ni irritaciones.',
    isFeatured: false,
    stock: 0,
    sku: 'LZ-SHAVER',
  },
  {
    id: 'trimmer-lizze',
    slug: 'trimmer',
    category: 'barber',
    name: 'Trimmer Lizze',
    badge: 'Delineado Láser',
    punchline: 'Motor sin escobillas hasta 8500 RPM y 4 velocidades programables',
    temp: 'N/A',
    voltage: ['Batería Litio Carga Base'],
    prices: { reg: 360, min: 340, salonPack: 325 },
    images: [
      'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80',
    ],
    specs: {
      cuchilla: 'DLC Diamond Like Carbon que no se calienta',
      velocidades: '5500, 6500, 7500 y 8500 RPM',
      peso: '260 g ultraligero y silencioso',
      garantia: '6 meses oficial en Perú',
    },
    shortDesc: 'Marcación de cerquillos, grecas y barbas con nitidez absoluta.',
    longDesc:
      'Herramienta insustituible para el barbero moderno. Su visión descubierta de 360 grados ofrece visibilidad total en cada pasada.',
    isFeatured: false,
    stock: 0,
    sku: 'LZ-TRIMMER',
  },
  {
    id: 'clipper-lizze',
    slug: 'clipper',
    category: 'barber',
    name: 'Clipper Lizze',
    badge: 'Fade Master',
    punchline: 'Motor magnético de 8500 RPM con cuchilla de acero al carbono',
    temp: 'N/A',
    voltage: ['Batería Litio Alta Densidad'],
    prices: { reg: 380, min: 360, salonPack: 345 },
    images: [
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80',
    ],
    specs: {
      motor: 'Magnético lineal de 8500 RPM constante',
      cuchilla: 'Acero al carbono micro-dentada para fades suaves',
      accesorios: '8 peines guía magnéticos reforzados incluidos',
      autonomia: '3 horas completas de corte ininterrumpido',
      garantia: '6 meses oficial en Perú',
    },
    shortDesc:
      'Corta con facilidad en cabellos secos o húmedos sin atascos ni pérdida de fuerza.',
    longDesc:
      'La potencia del motor magnético mantiene la velocidad constante sin importar la densidad del cabello o el nivel de carga de la batería.',
    isFeatured: false,
    stock: 0,
    sku: 'LZ-CLIPPER',
  },
];
