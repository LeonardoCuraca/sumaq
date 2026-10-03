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
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "plancha-extreme",
    slug: "plancha_extreme",
    category: "hair",
    name: "Plancha Lizze Extreme",
    badge: "Best Seller Alisados",
    punchline: "Alisado brasileño profesional en la mitad de pasadas",
    temp: "250°C (480°F)",
    voltage: ["220V", "127V"],
    prices: { reg: 380, min: 360, salonPack: 350 },
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      placas: "Titanio nano-revestido 29mm x 110mm",
      cable: "Giratorio de 2.7 metros con refuerzo profesional",
      temperatura: "5 niveles digitales hasta 250°C (480°F)",
      seguridad: "Apagado automático de protección tras 60 minutos",
      garantia: "6 meses oficial en Perú con SUMAQ"
    },
    shortDesc: "La plancha más buscada por los mejores estilistas de Lima y provincias. Acelera el proceso de alisados progresivos, botox y keratina sin quemar la hebra.",
    longDesc: "Diseñada para uso continuo e intensivo en salones de belleza. Sus placas de titanio distribuyen el calor de manera uniforme y sellan la cutícula instantáneamente, otorgando un brillo espejo duradero y eliminando el frizz de inmediato.",
    isFeatured: true
  },
  {
    id: "plancha-supreme",
    slug: "plancha_supreme",
    category: "hair",
    name: "Plancha Lizze Supreme Ancha",
    badge: "Potencia Máxima",
    punchline: "Cuchillas anchas de 40mm para mechones más grandes",
    temp: "252°C (485°F)",
    voltage: ["220V", "127V"],
    prices: { reg: 480, min: 460, salonPack: 440 },
    images: [
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      placas: "Titanio Ultra-Ancho 40mm x 110mm",
      cable: "3 metros giratorio 360°",
      temperatura: "Hasta 252°C (485°F) con sensor térmico MCH",
      display: "Indicador LED multifunción con calibración rápida",
      garantia: "6 meses oficial en Perú"
    },
    shortDesc: "Diseñada específicamente para melenas abundantes, cabellos gruesos y tratamientos de sellado en menor tiempo.",
    longDesc: "Permite procesar mechones sustancialmente más gruesos gracias a su superficie de 40 mm, reduciendo el desgaste físico del estilista hasta en un 40% durante jornadas de alta demanda en el salón.",
    isFeatured: true
  },
  {
    id: "plancha-slim-extreme",
    slug: "plancha_lim_extreme",
    category: "hair",
    name: "Plancha Slim Extreme",
    badge: "Precisión de Raíz",
    punchline: "Estructura delgada para flequillos, bordes y cabellos cortos",
    temp: "250°C (480°F)",
    voltage: ["220V"],
    prices: { reg: 360, min: 340, salonPack: 330 },
    images: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      placas: "Titanio ultra-slim 20mm",
      peso: "Estructura ultraligera de 320g",
      temperatura: "5 niveles configurables hasta 250°C",
      garantia: "6 meses oficial en Perú"
    },
    shortDesc: "Permite acercarse al cuero cabelludo con precisión quirúrgica sin riesgo de quemaduras en raíces y contornos.",
    longDesc: "Es la compañera indispensable de la Plancha Extreme para dar los toques finales en nucas, patillas y flequillos rebeldes."
  },
  {
    id: "plancha-fusion",
    slug: "plancha_fusion",
    category: "hair",
    name: "Plancha Lizze Fusion",
    badge: "Nueva Tecnología",
    punchline: "Placas flotantes de titanio de 30mm y calentamiento ultrarrápido",
    temp: "250°C (480°F)",
    voltage: ["220V", "127V"],
    prices: { reg: 430, min: 400, salonPack: 395 },
    images: [
      "https://images.unsplash.com/photo-1522337094346-297c11a8c918?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      placas: "Titanio Flotante 30mm",
      peso: "450 g con balance de muñeca ergonómico",
      seguridad: "Circuito electrónico protegido contra caídas de tensión",
      garantia: "6 meses oficial"
    },
    shortDesc: "Especialmente creada para cuidar la fibra capilar manteniendo una temperatura ultra-alta y constante.",
    longDesc: "Diseñada para profesionales que exigen consistencia térmica milimétrica. Sus placas amortiguadas evitan tirones durante el planchado."
  },
  {
    id: "plancha-mini",
    slug: "plancha_mini",
    category: "hair",
    name: "Plancha Lizze Mini Portátil",
    badge: "Compacta & Bivolt",
    punchline: "Ideal para retoques en eventos, novias y cabellos cortos",
    temp: "200°C (392°F)",
    voltage: ["Bivolt Automático"],
    prices: { reg: 200, min: 180, salonPack: 165 },
    images: [
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      tamano: "17 cm de longitud total",
      voltaje: "Doble voltaje inteligente 110V - 220V",
      placas: "Titanio de respuesta térmica inmediata",
      garantia: "6 meses oficial"
    },
    shortDesc: "Se adapta a cualquier maletín o bolso de maquillaje. Potencia real en tamaño miniatura.",
    longDesc: "Diseñada para barberos y estilistas a domicilio que requieren transportar herramientas de calidad profesional sin cargar bultos pesados."
  },
  {
    id: "secador-extreme",
    slug: "secador_extreme",
    category: "hair",
    name: "Secador Lizze Extreme 2400W/2600W",
    badge: "Turbo Power",
    punchline: "Reduce el tiempo de secado hasta en un 50% con motor AC profesional",
    temp: "Flujo a 160°C (320°F)",
    voltage: ["220V", "127V"],
    prices: { reg: 480, min: 460, salonPack: 440 },
    images: [
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      potencia: "2400W reales continuos",
      flujo: "Alta velocidad con emisión de iones negativos",
      boquillas: "Incluye 2 boquillas direccionadoras de calor",
      cable: "3 metros de uso rudo",
      garantia: "6 meses oficial"
    },
    shortDesc: "Acelera el brushing de salón y prepara la fibra capilar para alisados con brillo absoluto.",
    longDesc: "Diseñado exclusivamente para el trabajo diario en peluquerías de alto tránsito. Menos tiempo por cliente significa mayor rentabilidad para tu salón.",
    isFeatured: true
  },
  {
    id: "secador-supreme",
    slug: "secador_supreme",
    category: "hair",
    name: "Secador Lizze Supreme Luxury",
    badge: "Línea Élite",
    punchline: "Temperatura de hasta 356°F y acústica optimizada",
    temp: "Hasta 180°C (356°F)",
    voltage: ["220V"],
    prices: { reg: 580, min: 560, salonPack: 535 },
    images: [
      "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      motor: "Motor Brushless Silence de alta resistencia",
      funciones: "Golpe de frío instantáneo y 6 combinaciones de aire",
      peso: "Reducción de fatiga en hombro y muñeca",
      garantia: "6 meses oficial"
    },
    shortDesc: "El secador más potente y confortable para salones con largas jornadas de peinado.",
    longDesc: "Máximo caudal de aire caliente que sella cutículas sin resecar el córtex del cabello, dejando hebras suaves y manejables."
  },
  {
    id: "rizador-extreme",
    slug: "rizador_extreme",
    category: "hair",
    name: "Rizador Lizze Extreme",
    badge: "Ondas de Larga Duración",
    punchline: "15 variaciones de temperatura de 80°C a 230°C",
    temp: "230°C (450°F)",
    voltage: ["Bivolt Automático"],
    options: ["19mm", "25mm", "32mm"],
    prices: { reg: 200, min: 180, salonPack: 175 },
    images: [
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      cilindros: "Opciones disponibles en 19mm, 25mm y 32mm",
      temperatura: "15 configuraciones digitales de precisión",
      punta: "Punta fría de seguridad antiquemaduras",
      garantia: "6 meses oficial"
    },
    shortDesc: "Ondas al agua, rizos definidos y peinados para novias que duran todo el evento sin caerse.",
    longDesc: "Desarrollado para peinadores profesionales. Su cilindro de conducción rápida permite marcar la onda en solo 5 segundos por mechón."
  },
  {
    id: "foton-lizze",
    slug: "foton",
    category: "hair",
    name: "Fotón Lizze (Fototerapia Capilar)",
    badge: "Tecnología Láser LED",
    punchline: "Luz azul 450nm para acelerar tratamientos y botox capilar",
    temp: "Luz atérmica",
    voltage: ["Bivolt Automático"],
    prices: { reg: 950, min: 900, salonPack: 880 },
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      luces: "Luz Azul 450nm (absorción) / Roja 600nm (crecimiento) / Verde (brillo)",
      incluye: "2 pares de lentes profesionales de protección óptica",
      cable: "2.8 metros",
      garantia: "6 meses oficial"
    },
    shortDesc: "Multiplica el efecto de cualquier tratamiento químico reduciendo los tiempos de exposición a la mitad.",
    longDesc: "Equipo de bio-fototerapia para salón que abre nuevos servicios de alto margen. Penetra los principios activos en la fibra capilar aumentando la fijación del color y los alisados."
  },
  {
    id: "cepillo-jabali",
    slug: "juego_de_cepillo_cerda_de_jabali",
    category: "hair",
    name: "Juego de Cepillos de Cerda de Jabalí",
    badge: "Brushing de Lujo",
    punchline: "Distribuye los aceites naturales y sella cutículas sin reventar el cabello",
    temp: "N/A",
    voltage: ["N/A"],
    options: ["5.5cm (S/ 60)", "6.5cm (S/ 65)", "7.0cm (S/ 70)", "7.5cm (S/ 75)"],
    prices: { reg: 60, min: 60, salonPack: 55 },
    images: [
      "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      cerdas: "100% cerda natural de jabalí reforzada con nylon",
      mango: "Madera tratada ergonómica antideslizante",
      beneficio: "Elimina electricidad estática y añade sedosidad",
      garantia: "Garantía de satisfacción SUMAQ"
    },
    shortDesc: "El secreto de los mejores salones para un pulido impecable durante el secado.",
    longDesc: "Diseñados para deslizar suavemente a través de la hebra sin dañarla, proporcionando volumen natural y un sellado pulcro."
  },
  // Barber Products
  {
    id: "shaver-lizze",
    slug: "shaver",
    category: "barber",
    name: "Shaver Lizze Professional 8000 RPM",
    badge: "Afeitado al Ras",
    punchline: "Cuchillas ultrafinas con suspensión hipoalergénica",
    temp: "N/A",
    voltage: ["Batería Litio USB"],
    prices: { reg: 340, min: 320, salonPack: 300 },
    images: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      motor: "Rotativo potente de 8000 RPM",
      autonomia: "180 minutos de uso continuo",
      laminas: "Hipoalergénicas doradas que no irritan piel sensible",
      garantia: "6 meses oficial en Perú"
    },
    shortDesc: "Afeitados a ras cero milímetros para desvanecidos limpios y cuellos perfectos.",
    longDesc: "Construida para barberos exigentes. Su cabezal oscilante sigue los contornos faciales y craneales sin tirones ni irritaciones.",
    isFeatured: true
  },
  {
    id: "trimmer-lizze",
    slug: "trimmer",
    category: "barber",
    name: "Trimmer Lizze con Cuchillas DLC",
    badge: "Delineado Láser",
    punchline: "Motor sin escobillas hasta 8500 RPM y 4 velocidades programables",
    temp: "N/A",
    voltage: ["Batería Litio Carga Base"],
    prices: { reg: 360, min: 340, salonPack: 325 },
    images: [
      "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      cuchilla: "DLC Diamond Like Carbon que no se calienta",
      velocidades: "5500, 6500, 7500 y 8500 RPM",
      peso: "260 g ultraligero y silencioso",
      garantia: "6 meses oficial en Perú"
    },
    shortDesc: "Marcación de cerquillos, grecas y barbas con nitidez absoluta.",
    longDesc: "Herramienta insustituible para el barbero moderno. Su visión descubierta de 360 grados ofrece visibilidad total en cada pasada.",
    isFeatured: true
  },
  {
    id: "clipper-lizze",
    slug: "clipper",
    category: "barber",
    name: "Máquina Clipper Lizze Magnética",
    badge: "Fade Master",
    punchline: "Motor magnético de 8500 RPM con cuchilla de acero al carbono",
    temp: "N/A",
    voltage: ["Batería Litio Alta Densidad"],
    prices: { reg: 380, min: 360, salonPack: 345 },
    images: [
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80"
    ],
    specs: {
      motor: "Magnético lineal de 8500 RPM constante",
      cuchilla: "Acero al carbono micro-dentada para fades suaves",
      accesorios: "8 peines guía magnéticos reforzados incluidos",
      autonomia: "3 horas completas de corte ininterrumpido",
      garantia: "6 meses oficial en Perú"
    },
    shortDesc: "Corta con facilidad en cabellos secos o húmedos sin atascos ni pérdida de fuerza.",
    longDesc: "La potencia del motor magnético mantiene la velocidad constante sin importar la densidad del cabello o el nivel de carga de la batería.",
    isFeatured: true
  }
];
