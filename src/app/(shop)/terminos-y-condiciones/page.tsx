import React from 'react';

export const metadata = {
  title: 'Términos, Condiciones y Garantía Oficial Lizze | SUMAQ Importaciones',
  description:
    'Políticas oficiales de compra, despacho a todo el Perú y cobertura de 6 meses de garantía para herramientas profesionales Lizze Brasil.',
};

export default function TermsPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-bold text-sumaq-400 uppercase tracking-widest">
          Documento Legal Oficial
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
          Términos, Condiciones y Garantía Lizze
        </h1>
        <p className="text-xs text-zinc-400 mt-2">
          Actualizado y válido para todo el territorio de la República del Perú.
        </p>
      </div>

      <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
        <section className="p-6 rounded-2xl bg-[#131519] border border-white/5 space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            1. Sobre la Empresa y Autenticidad
          </h2>
          <p>
            SUMAQ Importaciones es el canal de importación especializado de herramientas profesionales
            térmicas y de barbería de la prestigiosa marca LIZZE BRASIL en Perú. Todos nuestros
            productos cuentan con números de serie y sellos de conformidad de fábrica.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#131519] border border-white/5 space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            2. Política de Garantía Oficial (6 Meses)
          </h2>
          <p>
            Todos nuestros equipos cuentan con una garantía de seis (6) meses frente a defectos
            atribuibles a fabricación a partir de la fecha de entrega. La garantía ampara componentes
            internos como circuitos electrónicos MCH, pantallas digitales, switches y motores
            magnéticos.
          </p>
          <p className="text-zinc-400">
            Exclusiones: Daños producidos por caídas violentas, rotura de placas de titanio por impacto
            exterior, inmersión en agua o líquidos químicos, cables cortados o alteraciones por
            fluctuaciones eléctricas extremas ajenas al equipo.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#131519] border border-white/5 space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            3. Envíos y Cobertura Nacional
          </h2>
          <p>
            Realizamos entregas gratuitas para Lima Metropolitana y Callao según zonas de cobertura
            regular. Para envíos a provincias, despachamos a diario a través de agencias autorizadas
            (Shalom, Olva Courier, Marvisur, etc.) con tarifa fija base a partir de S/ 19 según
            volumen del pedido.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[#131519] border border-white/5 space-y-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            4. Medios de Pago Autorizados
          </h2>
          <p>
            Aceptamos pagos directos mediante Yape, Plin, transferencia bancaria (BCP, BBVA, Interbank)
            o pago con tarjeta mediante link verificado. Todo comprobante es emitido formalmente antes
            del despacho.
          </p>
        </section>
      </div>
    </div>
  );
}
