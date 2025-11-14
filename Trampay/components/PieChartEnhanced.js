// Componente de Gráfico de Pizza Melhorado - Trampay
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../styles';

const PieChartEnhanced = ({ data, size = 200, showLegend = true, title = '' }) => {
  // Se não houver dados ou não for array, mostrar placeholder
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={{ width: size, alignItems: 'center' }}>
        {title ? <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>{title}</Text> : null}
        <View style={{ width: size, height: size, backgroundColor: '#f0f0f0', borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', fontSize: 12 }}>Sem dados</Text>
        </View>
      </View>
    );
  }

  // Filtra e converte valores válidos
  const normalizedItems = data.map((it) => ({
    label: it.label || it.category || 'Sem nome',
    value: Number(it.value) || Number(it.total) || 0,
    color: it.color || colors.primary,
  })).filter(it => it.value > 0);

  if (normalizedItems.length === 0) {
    return (
      <View style={{ width: size, alignItems: 'center' }}>
        {title ? <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>{title}</Text> : null}
        <View style={{ width: size, height: size, backgroundColor: '#f0f0f0', borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', fontSize: 12 }}>Sem dados</Text>
        </View>
      </View>
    );
  }

  // Calcular total
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);

  if (!total || isNaN(total) || !isFinite(total)) {
    return (
      <View style={{ width: size, alignItems: 'center' }}>
        {title ? <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>{title}</Text> : null}
        <View style={{ width: size, height: size, backgroundColor: '#f0f0f0', borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', fontSize: 12 }}>Erro nos dados</Text>
        </View>
      </View>
    );
  }

  // Gerar cores automáticas se não fornecidas
  const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];
  const itemsWithColors = normalizedItems.map((item, idx) => ({
    ...item,
    color: item.color || chartColors[idx % chartColors.length],
  }));

  // Configurações do círculo
  const radius = Math.max(0, size / 2 - 10);
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 35;

  // Calcular circunferência
  const circumference = 2 * Math.PI * radius;

  // Acumulador em comprimento
  let accumulatedLength = 0;

  // Formatar valor como moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calcular percentual
  const getPercentage = (value) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      {title ? <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>{title}</Text> : null}
      
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
            {itemsWithColors.map((item, index) => {
              const portion = (item.value / total);
              const segmentLength = portion * circumference;
              const strokeDasharray = `${segmentLength} ${Math.max(0, circumference - segmentLength)}`;
              const strokeDashoffset = -accumulatedLength;

              accumulatedLength += segmentLength;

              return (
                <Circle
                  key={`slice-${index}`}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                  strokeLinecap="butt"
                />
              );
            })}

            {/* Círculo central branco para efeito donut */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius - strokeWidth / 2 - 5}
              fill="#fff"
            />

            {/* Total no centro */}
            <SvgText
              x={centerX}
              y={centerY - 8}
              fontSize={12}
              fill="#999"
              textAnchor="middle"
              fontWeight="normal"
            >
              Total
            </SvgText>
            <SvgText
              x={centerX}
              y={centerY + 10}
              fontSize={16}
              fill="#333"
              textAnchor="middle"
              fontWeight="bold"
            >
              {formatCurrency(total)}
            </SvgText>
          </G>
        </Svg>
      </View>

      {/* Legenda */}
      {showLegend && (
        <View style={{ marginTop: 15, width: '100%', paddingHorizontal: 10 }}>
          {itemsWithColors.map((item, index) => (
            <View key={`legend-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 14, height: 14, backgroundColor: item.color, borderRadius: 3, marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: '#666', flex: 1 }} numberOfLines={1}>{item.label}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{formatCurrency(item.value)}</Text>
                <Text style={{ fontSize: 11, color: '#999' }}>{getPercentage(item.value)}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default PieChartEnhanced;
