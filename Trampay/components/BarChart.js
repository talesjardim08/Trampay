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

  // Normaliza os dados
  const normalizedData = data.map(item => ({
    label: item.label || item.category || 'Sem nome',
    value: Number(item.value) || Number(item.total) || 0,
    color: item.color || colors.primary
  })).filter(item => item.value > 0);

  if (normalizedData.length === 0) {
    return (
      <View style={{ width, height, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#999' }}>Sem dados para exibir</Text>
      </View>
    );
  }

  const maxValue = Math.max(...normalizedData.map(d => d.value));
  const barWidth = chartWidth / normalizedData.length - 10;
  const barSpacing = 10;

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
          const barHeight = (item.value / maxValue) * chartHeight;
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
                {formatCurrency(item.value)}
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
