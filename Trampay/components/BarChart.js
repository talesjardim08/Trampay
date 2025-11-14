// Componente de Gráfico de Barras - Trampay
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../styles';

const BarChart = ({ data, width = 350, height = 250, showLegend = true }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={{ width, height, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#999' }}>Sem dados disponíveis</Text>
      </View>
    );
  }

  const padding = { top: 30, right: 20, bottom: 60, left: 60 };
  const chartWidth = Math.max(0, width - padding.left - padding.right);
  const chartHeight = Math.max(0, height - padding.top - padding.bottom);

  // Normaliza os dados - usa valores absolutos para o gráfico
  const normalizedData = data.map(item => ({
    label: item.label || item.category || 'Sem nome',
    value: Number(item.value) || Number(item.total) || 0,
    displayValue: Math.abs(Number(item.value) || Number(item.total) || 0),
    color: item.color || colors.primary
  })).filter(item => item.displayValue > 0);

  if (normalizedData.length === 0) {
    return (
      <View style={{ width, height, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#999' }}>Sem dados para exibir</Text>
      </View>
    );
  }

  const maxValue = Math.max(...normalizedData.map(d => d.displayValue));
  
  // Calcula a largura das barras garantindo que todas caibam no gráfico
  // Estratégia: garantir que dataLength * barWidth + (dataLength + 1) * barSpacing <= chartWidth
  const dataLength = normalizedData.length;
  const preferredSpacing = 10;
  const maxBarWidth = 80;
  
  let barSpacing;
  let barWidth;
  
  // Calcula o spacing adaptativo baseado no espaço disponível
  // Se o spacing preferido cabe, usa ele. Senão, reduz proporcionalmente.
  const minSpacingNeeded = (dataLength + 1) * preferredSpacing;
  
  if (minSpacingNeeded < chartWidth * 0.3) {
    // Há espaço suficiente para o spacing preferido
    barSpacing = preferredSpacing;
  } else if (dataLength < 10) {
    // Poucos dados, usa spacing menor
    barSpacing = Math.max(5, Math.floor(chartWidth / (dataLength * 8)));
  } else {
    // Muitos dados, spacing mínimo
    barSpacing = Math.max(1, Math.floor(chartWidth / (dataLength * 15)));
  }
  
  // Calcula barWidth garantindo que cabe no espaço disponível
  let totalSpacingWidth = (dataLength + 1) * barSpacing;
  let availableForBars = chartWidth - totalSpacingWidth;
  
  if (availableForBars > 0) {
    barWidth = availableForBars / dataLength;
    
    // Se a barra ficar muito pequena (<3px), reduz spacing e recalcula
    if (barWidth < 3 && barSpacing > 0) {
      barSpacing = Math.max(0, Math.floor((chartWidth - dataLength * 3) / (dataLength + 1)));
      totalSpacingWidth = (dataLength + 1) * barSpacing;
      availableForBars = chartWidth - totalSpacingWidth;
      barWidth = availableForBars / dataLength;
    }
    
    barWidth = Math.min(maxBarWidth, barWidth);
  } else {
    // Caso extremo: sem espaço para spacing, usa spacing 0
    barSpacing = 0;
    barWidth = chartWidth / dataLength;
  }
  
  // Garantia final: NUNCA ultrapassar chartWidth
  const finalTotalWidth = dataLength * barWidth + (dataLength + 1) * barSpacing;
  if (finalTotalWidth > chartWidth) {
    barSpacing = 0;
    barWidth = chartWidth / dataLength;
  }

  // Formata valores em reais
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <View style={{ width, paddingVertical: 10 }}>
      <Svg width={width} height={height - (showLegend ? 0 : 40)}>
        {/* Eixo Y (valores) */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#ccc"
          strokeWidth={2}
        />
        
        {/* Eixo X (categorias) */}
        <Line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#ccc"
          strokeWidth={2}
        />

        {/* Linhas de grade horizontais */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding.top + (1 - ratio) * chartHeight;
          const value = maxValue * ratio;
          return (
            <React.Fragment key={`grid-${index}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              {/* Rótulos do eixo Y */}
              <SvgText
                x={padding.left - 10}
                y={y + 4}
                fontSize={10}
                fill="#666"
                textAnchor="end"
              >
                {formatCurrency(value)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Barras */}
        {normalizedData.map((item, index) => {
          const barHeight = (item.displayValue / maxValue) * chartHeight;
          const x = padding.left + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = padding.top + chartHeight - barHeight;

          return (
            <React.Fragment key={`bar-${index}`}>
              {/* Barra */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                rx={4}
                opacity={0.9}
              />
              
              {/* Valor acima da barra */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize={10}
                fill="#333"
                textAnchor="middle"
                fontWeight="bold"
              >
                {formatCurrency(item.displayValue)}
              </SvgText>

              {/* Rótulo no eixo X */}
              <SvgText
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                fontSize={11}
                fill="#666"
                textAnchor="middle"
                transform={`rotate(-45, ${x + barWidth / 2}, ${height - padding.bottom + 20})`}
              >
                {item.label.length > 12 ? item.label.substring(0, 12) + '...' : item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legenda */}
      {showLegend && (
        <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {normalizedData.map((item, index) => (
              <View key={`legend-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 }}>
                <View style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: 2, marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#666' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default BarChart;
