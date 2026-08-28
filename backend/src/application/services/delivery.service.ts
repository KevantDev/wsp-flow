import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaCompanyConfigRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-company-config.repository';

export type DeliveryType = 'PICKUP' | 'HOME_DELIVERY' | 'PROVINCE_AGENCY';

export interface DeliveryZone {
  id: string;
  name: string;
  type: DeliveryType;
  price: number;
  estimatedTime: string;
  districts?: string[];
  description: string;
}

export interface GeocodedLocationResult {
  formattedAddress: string;
  district: string;
  city: string;
  deliveryZone: DeliveryZone;
  deliveryFee: number;
  latitude: number;
  longitude: number;
}

const LIMA_ZONA1_DISTRICTS = [
  'miraflores',
  'san isidro',
  'san borja',
  'santiago de surco',
  'surco',
  'jesus maria',
  'jesús maría',
  'lince',
  'magdalena',
  'magdalena del mar',
  'pueblo libre',
  'barranco',
  'surquillo',
  'san miguel',
  'brena',
  'breña',
  'cercado de lima',
  'lima',
  'la victoria',
];

const LIMA_ZONA2_DISTRICTS = [
  'los olivos',
  'san martin de porres',
  'smp',
  'comas',
  'independencia',
  'chorrillos',
  'san juan de miraflores',
  'sjm',
  'villa maria del triunfo',
  'vmt',
  'la molina',
  'santa anita',
  'ate',
  'ate vitarte',
  'san juan de lurigancho',
  'sjl',
  'el agustino',
  'rimac',
  'rímac',
];

const LIMA_ZONA3_DISTRICTS = [
  'callao',
  'bellavista',
  'la punta',
  'carmen de la legua',
  'la perla',
  'ventanilla',
  'puente piedra',
  'carabayllo',
  'ancon',
  'ancón',
  'santa rosa',
  'villa el salvador',
  'ves',
  'lurin',
  'lurín',
  'pachacamac',
  'pachacámac',
  'san bartolo',
  'punta hermosa',
  'punta negra',
  'santa maria del mar',
  'pucusana',
  'cieneguilla',
  'chaclacayo',
  'chosica',
  'lurigancho',
];

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly configRepo: PrismaCompanyConfigRepository) {}

  /**
   * Obtiene la lista completa de zonas con precios configurables desde CompanyConfig
   */
  async getAllDeliveryZones(): Promise<DeliveryZone[]> {
    let z1Price = 10.0;
    let z2Price = 15.0;
    let z3Price = 20.0;
    let provPrice = 15.0;
    let storeAddr = 'Av. Larco 743, Miraflores, Lima';
    let storeHours = 'Lunes a Sábados de 09:00 a 20:00';

    try {
      const config = await this.configRepo.getConfig();
      if (config) {
        z1Price = config.deliveryZone1Price ?? 10.0;
        z2Price = config.deliveryZone2Price ?? 15.0;
        z3Price = config.deliveryZone3Price ?? 20.0;
        provPrice = config.deliveryProvincePrice ?? 15.0;
        storeAddr = config.pickupStoreAddress || config.address || storeAddr;
        storeHours = config.pickupStoreHours || config.workingHours || storeHours;
      }
    } catch (e: any) {
      this.logger.warn(`No se pudo cargar configuración de delivery: ${e.message}`);
    }

    return [
      {
        id: 'pickup_store',
        name: 'Recojo en Tienda (Pick-up Local)',
        type: 'PICKUP',
        price: 0.0,
        estimatedTime: 'Listo en 2 horas',
        description: `${storeAddr} (${storeHours}). ¡Costo S/ 0.00 (Gratis)!`,
      },
      {
        id: 'lima_zona1',
        name: 'Lima Zona 1 (Centro / Moderna)',
        type: 'HOME_DELIVERY',
        price: z1Price,
        estimatedTime: '24 a 48 horas (Mismo día disponible)',
        districts: LIMA_ZONA1_DISTRICTS,
        description: 'Miraflores, San Isidro, Surco, San Borja, Jesús María, Lince, Magdalena, Pueblo Libre, Barranco, San Miguel, Cercado.',
      },
      {
        id: 'lima_zona2',
        name: 'Lima Zona 2 (Norte / Sur / Este)',
        type: 'HOME_DELIVERY',
        price: z2Price,
        estimatedTime: '24 a 48 horas',
        districts: LIMA_ZONA2_DISTRICTS,
        description: 'Los Olivos, SMP, Comas, Chorrillos, SJM, La Molina, Santa Anita, Ate, SJL, Rímac, VMT.',
      },
      {
        id: 'lima_zona3',
        name: 'Lima Zona 3 & Callao (Zonas Periféricas)',
        type: 'HOME_DELIVERY',
        price: z3Price,
        estimatedTime: '48 a 72 horas',
        districts: LIMA_ZONA3_DISTRICTS,
        description: 'Callao, Bellavista, La Punta, Ventanilla, Puente Piedra, Carabayllo, VES, Lurín, Chosica, Balnearios.',
      },
      {
        id: 'provincia_shalom',
        name: 'Envío a Provincia (Agencia Shalom / Marvisur / Olva)',
        type: 'PROVINCE_AGENCY',
        price: provPrice,
        estimatedTime: '2 a 4 días hábiles',
        description: 'Despacho a agencia con guía de remisión para recojo en Trujillo, Arequipa, Cusco, Chiclayo, Piura, Huancayo, etc.',
      },
    ];
  }

  /**
   * Determina la zona y tarifa de entrega a partir del tipo o texto de distrito/dirección
   */
  calculateDelivery(
    type?: DeliveryType,
    districtOrAddress?: string,
    customZones?: DeliveryZone[],
  ): { zone: DeliveryZone; deliveryFee: number } {
    const zones = customZones || [
      {
        id: 'pickup_store',
        name: 'Recojo en Tienda (Pick-up Local)',
        type: 'PICKUP' as DeliveryType,
        price: 0.0,
        estimatedTime: 'Listo en 2 horas',
        description: 'Av. Larco 743, Miraflores, Lima (Lunes a Sábados de 09:00 a 20:00). ¡Costo S/ 0.00 (Gratis)!',
      },
      {
        id: 'lima_zona1',
        name: 'Lima Zona 1 (Centro / Moderna)',
        type: 'HOME_DELIVERY' as DeliveryType,
        price: 10.0,
        estimatedTime: '24 a 48 horas',
        districts: LIMA_ZONA1_DISTRICTS,
        description: 'Lima Centro / Moderna',
      },
      {
        id: 'lima_zona2',
        name: 'Lima Zona 2 (Norte / Sur / Este)',
        type: 'HOME_DELIVERY' as DeliveryType,
        price: 15.0,
        estimatedTime: '24 a 48 horas',
        districts: LIMA_ZONA2_DISTRICTS,
        description: 'Lima Norte / Sur / Este',
      },
      {
        id: 'lima_zona3',
        name: 'Lima Zona 3 & Callao',
        type: 'HOME_DELIVERY' as DeliveryType,
        price: 20.0,
        estimatedTime: '48 a 72 horas',
        districts: LIMA_ZONA3_DISTRICTS,
        description: 'Callao & Periferia',
      },
      {
        id: 'provincia_shalom',
        name: 'Envío a Provincia (Agencia)',
        type: 'PROVINCE_AGENCY' as DeliveryType,
        price: 15.0,
        estimatedTime: '2 a 4 días hábiles',
        description: 'Agencia Shalom / Marvisur / Olva',
      },
    ];

    // 1. Si es expresamente Recojo en Tienda
    if (type === 'PICKUP') {
      const pickupZone = zones.find((z) => z.id === 'pickup_store')!;
      return { zone: pickupZone, deliveryFee: 0.0 };
    }

    // 2. Si es expresamente Envío a Provincia
    if (type === 'PROVINCE_AGENCY') {
      const provinceZone = zones.find((z) => z.id === 'provincia_shalom')!;
      return { zone: provinceZone, deliveryFee: provinceZone.price };
    }

    if (!districtOrAddress) {
      const defaultZone = zones.find((z) => z.id === 'lima_zona1')!;
      return { zone: defaultZone, deliveryFee: defaultZone.price };
    }

    const cleanInput = districtOrAddress.toLowerCase().trim();

    // Comprobar si menciona recojo en tienda en el texto
    if (
      cleanInput.includes('recojo') ||
      cleanInput.includes('recoger') ||
      cleanInput.includes('tienda') ||
      cleanInput.includes('local') ||
      cleanInput.includes('retiro')
    ) {
      const pickupZone = zones.find((z) => z.id === 'pickup_store')!;
      return { zone: pickupZone, deliveryFee: 0.0 };
    }

    // Comprobar si menciona agencias o ciudades de provincia
    if (
      cleanInput.includes('provincia') ||
      cleanInput.includes('shalom') ||
      cleanInput.includes('marvisur') ||
      cleanInput.includes('olva') ||
      cleanInput.includes('trujillo') ||
      cleanInput.includes('arequipa') ||
      cleanInput.includes('cusco') ||
      cleanInput.includes('chiclayo') ||
      cleanInput.includes('piura') ||
      cleanInput.includes('huancayo') ||
      cleanInput.includes('tacna') ||
      cleanInput.includes('iquitos') ||
      cleanInput.includes('chimbote')
    ) {
      const provinceZone = zones.find((z) => z.id === 'provincia_shalom')!;
      return { zone: provinceZone, deliveryFee: provinceZone.price };
    }

    // Buscar coincidencia en Zona 1
    const zona1 = zones.find((z) => z.id === 'lima_zona1')!;
    if (zona1.districts?.some((d) => cleanInput.includes(d))) {
      return { zone: zona1, deliveryFee: zona1.price };
    }

    // Buscar coincidencia en Zona 2
    const zona2 = zones.find((z) => z.id === 'lima_zona2')!;
    if (zona2.districts?.some((d) => cleanInput.includes(d))) {
      return { zone: zona2, deliveryFee: zona2.price };
    }

    // Buscar coincidencia en Zona 3
    const zona3 = zones.find((z) => z.id === 'lima_zona3')!;
    if (zona3.districts?.some((d) => cleanInput.includes(d))) {
      return { zone: zona3, deliveryFee: zona3.price };
    }

    // Por defecto si está en Lima pero no especifica zona: Tarifa base Zona 1
    return { zone: zona1, deliveryFee: zona1.price };
  }

  /**
   * Resuelve coordenadas GPS de WhatsApp (Latitud / Longitud) usando Reverse Geocoding
   */
  async resolveLocationFromCoords(
    latitude: number,
    longitude: number,
    hintAddress?: string,
    hintName?: string,
  ): Promise<GeocodedLocationResult> {
    this.logger.log(
      `📍 Geocodificando ubicación GPS: [${latitude}, ${longitude}] | Hint: "${hintName || ''} - ${hintAddress || ''}"`,
    );

    let district = 'Miraflores';
    let city = 'Lima';
    let formattedAddress = hintName || hintAddress || `Coordenadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    // Comprobar si el hint de WhatsApp ya contiene un distrito reconocido
    const fullHint = `${hintName || ''} ${hintAddress || ''}`.toLowerCase();
    for (const d of LIMA_ZONA1_DISTRICTS) {
      if (fullHint.includes(d)) {
        district = d.charAt(0).toUpperCase() + d.slice(1);
        break;
      }
    }
    for (const d of LIMA_ZONA2_DISTRICTS) {
      if (fullHint.includes(d)) {
        district = d.charAt(0).toUpperCase() + d.slice(1);
        break;
      }
    }
    for (const d of LIMA_ZONA3_DISTRICTS) {
      if (fullHint.includes(d)) {
        district = d.charAt(0).toUpperCase() + d.slice(1);
        break;
      }
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          'accept-language': 'es',
        },
        headers: {
          'User-Agent': 'WspFlowEcommerce/1.0 (info@wspflow.com)',
        },
        timeout: 4000,
      });

      if (response.data) {
        const addr = response.data.address || {};
        const displayName = (response.data.display_name || '').toLowerCase();

        // Buscar coincidencia exacta de distrito en todo el display_name o campos
        let detectedDistrict = '';
        for (const d of [...LIMA_ZONA1_DISTRICTS, ...LIMA_ZONA2_DISTRICTS, ...LIMA_ZONA3_DISTRICTS]) {
          if (
            displayName.includes(d) ||
            (addr.suburb && addr.suburb.toLowerCase().includes(d)) ||
            (addr.city_district && addr.city_district.toLowerCase().includes(d)) ||
            (addr.district && addr.district.toLowerCase().includes(d)) ||
            (addr.town && addr.town.toLowerCase().includes(d)) ||
            (addr.village && addr.village.toLowerCase().includes(d))
          ) {
            detectedDistrict = d.charAt(0).toUpperCase() + d.slice(1);
            break;
          }
        }

        if (detectedDistrict) {
          district = detectedDistrict;
        } else {
          district =
            addr.suburb ||
            addr.city_district ||
            addr.district ||
            addr.town ||
            addr.village ||
            addr.city ||
            district;
        }

        city = addr.city || addr.state || 'Lima';

        const road = addr.road || addr.pedestrian || addr.street || '';
        const houseNumber = addr.house_number || '';
        const roadWithNumber = [road, houseNumber].filter(Boolean).join(' ');

        if (roadWithNumber) {
          formattedAddress = `${roadWithNumber}, ${district}, ${city}`;
        } else if (hintName || hintAddress) {
          formattedAddress = [hintName, hintAddress, district].filter(Boolean).join(', ');
        } else {
          formattedAddress = `${district}, ${city}`;
        }
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ Nominatim API no disponible (${err.message}). Usando cálculo por coordenadas.`);

      if (!district || district === 'Lima') {
        if (latitude > -12.05 && latitude < -11.85) {
          district = 'Los Olivos';
        } else if (latitude < -12.15 && latitude > -12.35) {
          district = 'Villa El Salvador';
        } else if (longitude < -77.10) {
          district = 'Callao';
        } else {
          district = 'Miraflores';
        }
      }
      formattedAddress = hintAddress || `${district}, Lima (Ubicación GPS)`;
    }

    const { zone, deliveryFee } = this.calculateDelivery('HOME_DELIVERY', district);

    return {
      formattedAddress,
      district,
      city,
      deliveryZone: zone,
      deliveryFee,
      latitude,
      longitude,
    };
  }
}
