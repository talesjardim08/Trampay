// Componente de Gráfico de Linha Melhorado - Trampay
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../styles';

const LineChartEnhanced = ({ data, width = 350, height = 220, showLegend = true, title = '' }) => {
  // Se não houver dados, renderiza um placeholder neutro
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <View style={{ width, height, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#999', fontSize: 14 }}>Sem dados disponíveis</Text>
      </View>
    );
  }

  // Configurações do gráfico
  const padding = { top: 40, right: 20, bottom: 50, left: 60 };
  const chartWidth = Math.max(0, width - padding.left - padding.right);
  const chartHeight = Math.max(0, height - padding.top - padding.bottom);

  // Normaliza os dados
  const chartData = data.map(d => ({
    period: d.period || d.month || d.day || '',
    income: Number(d.income) || Number(d.revenue) || 0,
    expenses: Number(d.expenses) || 0,
  }));

  // Encontrar valores máximos e mínimos
  const incomes = chartData.map(d => d.income);
  const expenses = chartData.map(d => d.expenses);
  const maxIncome = incomes.length ? Math.max(...incomes) : 0;
  const maxExpenses = expenses.length ? Math.max(...expenses) : 0;
  const maxValue = Math.max(maxIncome, maxExpenses, 0);
  const minValue = 0;

  // Denominador seguro (evita divisão por zero)
  const valueRange = (maxValue - minValue) || 1;

  // Função para converter dados em coordenadas SVG
  const getX = (index) => {
    const fraction = chartData.length > 1 ? index / (chartData.length - 1) : 0.5;
    return padding.left + fraction * chartWidth;
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const getY = (value) => {
    const v = Number(value) || 0;
    const normalized = (v - minValue) / valueRange;
    const y = padding.top + chartHeight - normalized * chartHeight;
    if (!isFinite(y) || isNaN(y)) return padding.top + chartHeight;
    return clamp(y, padding.top, padding.top + chartHeight);
  };

  // Criar pontos para as linhas
  const incomePoints = chartData.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
  const expensesPoints = chartData.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(' ');

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
      {title ? <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, paddingLeft: 10 }}>{title}</Text> : null}
      
      <Svg width={width} height={height - (showLegend ? 40 : 0)}>
        {/* Título do gráfico */}
        {!title && (
          <SvgText x={width / 2} y={20} fontSize={14} fill={colors.textDark} textAnchor="middle" fontWeight="bold">
            Receitas vs Despesas
          </SvgText>
        )}

        {/* Linhas de grade horizontais */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
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

        {/* Linha de receitas (verde) */}
        {incomePoints && (
          <Polyline
            points={incomePoints}
            fill="none"
            stroke={colors.success || '#22c55e'}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Linha de despesas (vermelho) */}
        {expensesPoints && (
          <Polyline
            points={expensesPoints}
            fill="none"
            stroke={colors.danger || '#ef4444'}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Pontos da linha de receitas */}
        {chartData.map((d, i) => (
          <Circle
            key={`income-${i}`}
            cx={getX(i)}
            cy={getY(d.income)}
            r={5}
            fill={colors.success || '#22c55e'}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}

        {/* Pontos da linha de despesas */}
        {chartData.map((d, i) => (
          <Circle
            key={`expenses-${i}`}
            cx={getX(i)}
            cy={getY(d.expenses)}
            r={5}
            fill={colors.danger || '#ef4444'}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}

        {/* Rótulos do eixo X (períodos) */}
        {chartData.map((d, i) => {
          if (chartData.length > 6 && i % 2 !== 0) return null; // Mostra apenas alguns labels se houver muitos dados
          return (
            <SvgText
              key={`label-${i}`}
              x={getX(i)}
              y={height - (showLegend ? 40 : 0) - 10}
              fontSize={10}
              fill="#666"
              textAnchor="middle"
              transform={`rotate(-45, ${getX(i)}, ${height - (showLegend ? 40 : 0) - 10})`}
            >
              {d.period.length > 8 ? d.period.substring(0, 8) : d.period}
            </SvgText>
          );
        })}

        {/* Eixos */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#ccc"
          strokeWidth={2}
        />
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke="#ccc"
          strokeWidth={2}
        />
      </Svg>

      {/* Legenda */}
      {showLegend && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
            <View style={{ width: 16, height: 3, backgroundColor: colors.success || '#22c55e', marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#666' }}>Receitas</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 16, height: 3, backgroundColor: colors.danger || '#ef4444', marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#666' }}>Despesas</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default LineChartEnhanced;
