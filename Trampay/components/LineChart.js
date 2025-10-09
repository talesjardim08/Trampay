// Componente de Gráfico de Linha - Trampay
import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors } from '../styles';

const LineChart = ({ data, width = 300, height = 150 }) => {
  // Se não houver dados, renderiza um placeholder neutro
  if (!data) {
    return <View style={{ width, height, backgroundColor: '#f0f0f0' }} />;
  }

  // Garante que income e expenses sejam números válidos
  const incomeBase = Number(data.income) || 0;
  const expensesBase = Number(data.expenses) || 0;

  // Dados simulados para demonstração baseados nos valores fornecidos
  const chartData = [
    { x: 0, income: incomeBase * 0.7, expenses: expensesBase * 0.8 },
    { x: 1, income: incomeBase * 0.5, expenses: expensesBase * 0.9 },
    { x: 2, income: incomeBase * 0.8, expenses: expensesBase * 0.6 },
    { x: 3, income: incomeBase * 0.9, expenses: expensesBase * 0.7 },
    { x: 4, income: incomeBase, expenses: expensesBase },
  ];

  // Configurações do gráfico
  const padding = 20;
  const chartWidth = Math.max(0, width - padding * 2);
  const chartHeight = Math.max(0, height - padding * 2);

  // Encontrar valores máximos e mínimos (garantir números válidos)
  const incomes = chartData.map(d => Number(d.income) || 0);
  const expenses = chartData.map(d => Number(d.expenses) || 0);
  const maxIncome = incomes.length ? Math.max(...incomes) : 0;
  const maxExpenses = expenses.length ? Math.max(...expenses) : 0;
  const maxValue = Math.max(maxIncome, maxExpenses, 0);
  const minValue = 0;

  // Denominador seguro (evita divisão por zero)
  const valueRange = (maxValue - minValue) || 1;

  // Função para converter dados em coordenadas SVG (com clamp)
  const getX = (index) => {
    const fraction = chartData.length > 1 ? index / (chartData.length - 1) : 0;
    return padding + fraction * chartWidth;
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const getY = (value) => {
    const v = Number(value) || 0;
    // normaliza entre 0 e 1, multiplica por altura e inverte (SVG y aumenta para baixo)
    const normalized = (v - minValue) / valueRange;
    const y = padding + chartHeight - normalized * chartHeight;
    // garante que y seja finito e dentro do box do gráfico
    if (!isFinite(y) || isNaN(y)) return padding + chartHeight;
    return clamp(y, padding, padding + chartHeight);
  };

  // Criar pontos para as linhas
  const incomePoints = chartData.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
  const expensesPoints = chartData.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(' ');

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Linhas de grade horizontais */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + chartHeight - ratio * chartHeight;
          return (
            <Line
              key={index}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e0e0e0"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Linha de receitas (verde) */}
        <Polyline
          points={incomePoints}
          fill="none"
          stroke={colors?.success || '#22c55e'}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Linha de despesas (vermelho) */}
        <Polyline
          points={expensesPoints}
          fill="none"
          stroke={colors?.danger || '#ef4444'}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos da linha de receitas */}
        {chartData.map((d, i) => (
          <Circle
            key={`income-${i}`}
            cx={getX(i)}
            cy={getY(d.income)}
            r={4}
            fill={colors?.success || '#22c55e'}
          />
        ))}

        {/* Pontos da linha de despesas */}
        {chartData.map((d, i) => (
          <Circle
            key={`expenses-${i}`}
            cx={getX(i)}
            cy={getY(d.expenses)}
            r={4}
            fill={colors?.danger || '#ef4444'}
          />
        ))}
      </Svg>
    </View>
  );
};

export default LineChart;
