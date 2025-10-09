// Componente de Gráfico de Pizza - Trampay
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const PieChart = ({ data, size = 200 }) => {
  // Se não houver dados ou não for array, mostrar placeholder
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={{ width: size, height: size, backgroundColor: '#f0f0f0', borderRadius: size / 2 }} />
    );
  }

  // Filtra e converte valores válidos (ignora itens sem value numérico)
  const normalizedItems = data.map((it) => ({
    ...it,
    value: Number(it?.value) || 0,
  })).filter(it => it.value > 0);

  // Se após normalização não houver valores válidos
  if (normalizedItems.length === 0) {
    return (
      <View style={{ width: size, height: size, backgroundColor: '#f0f0f0', borderRadius: size / 2 }} />
    );
  }

  // Calcular total (soma de valores válidos)
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);

  if (!total || isNaN(total) || !isFinite(total)) {
    return (
      <View style={{ width: size, height: size, backgroundColor: '#f0f0f0', borderRadius: size / 2 }} />
    );
  }

  // Configurações do círculo
  const radius = Math.max(0, size / 2 - 10);
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 30;

  // Calcular circunferência
  const circumference = 2 * Math.PI * radius;

  // acumulador em comprimento (em unidades da circunferência)
  let accumulatedLength = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {/* Círculo de fundo */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="transparent"
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
          />

          {/* Segmentos do gráfico */}
          {normalizedItems.map((item, index) => {
            // percentual do segmento (0..1)
            const portion = (item.value / total);
            // comprimento do segmento na circunferência
            const segmentLength = portion * circumference;
            // Construir strokeDasharray como segmento + restante (para visibilidade)
            const strokeDasharray = `${segmentLength} ${Math.max(0, circumference - segmentLength)}`;
            // offset em comprimento acumulado (negativo para iniciar no topo após rotacionar)
            const strokeDashoffset = -accumulatedLength;

            // Atualiza acumulador (em comprimento)
            accumulatedLength += segmentLength;

            return (
              <Circle
                key={`slice-${index}`}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="transparent"
                stroke={item.color || '#888'}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${centerX} ${centerY})`}
                strokeLinecap="round"
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

export default PieChart;
