import React from 'react';

export function Ticker() {
  const items = [
    '⚡ LIZZE BRASIL ORIGINAL CON CERTIFICADO',
    '🔥 HASTA 252°C (485°F) PARA RESULTADOS DE SALÓN',
    '🚚 ENVÍO GRATIS LIMA METROPOLITANA Y CALLAO',
    '🛡️ GARANTÍA OFICIAL PERÚ 6 MESES',
    '💼 PLANES B2B PARA SALONES & DISTRIBUIDORES',
    '⚡ LIZZE BRASIL ORIGINAL CON CERTIFICADO',
    '🔥 HASTA 252°C (485°F) PARA RESULTADOS DE SALÓN',
    '🚚 ENVÍO GRATIS LIMA METROPOLITANA Y CALLAO',
    '🛡️ GARANTÍA OFICIAL PERÚ 6 MESES',
    '💼 PLANES B2B PARA SALONES & DISTRIBUIDORES',
  ];

  return (
    <div className="bg-sumaq-50/90 border-y border-sumaq-200/80 overflow-hidden py-2.5 text-xs font-semibold text-sumaq-800">
      <div className="ticker-track flex items-center space-x-8">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <span className="flex items-center gap-2 tracking-wider whitespace-nowrap">{item}</span>
            <span className="text-sumaq-400 font-black">•</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
