<template>
  <div class="dashboard-page app-container">
    <section class="dashboard-hero">
      <div>
        <div class="hero-kicker">SHARED FISHING</div>
        <h2 class="hero-title">钓场经营看板</h2>
        <p class="hero-desc">聚合今日订单、营收、计时状态与支付转化，快速掌握门店实时经营情况。</p>
      </div>
      <div class="hero-panel">
        <span class="hero-panel-label">今日营收</span>
        <strong>¥{{ formatYuan(today.revenueCents) }}</strong>
        <span :class="['hero-growth', growthClass]">环比 {{ growthText }}</span>
      </div>
    </section>

    <el-row :gutter="18" class="summary-grid">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="never" class="summary-card summary-card-primary">
          <div class="summary-icon">
            <svg-icon icon-class="fish-order" />
          </div>
          <div class="summary-main">
            <div class="summary-label">今日订单</div>
            <div class="summary-value">{{ today.orderCount || 0 }}</div>
            <div class="summary-sub">昨日 {{ yesterday.orderCount || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="never" class="summary-card">
          <div class="summary-icon summary-icon-gold">
            <svg-icon icon-class="fish-revenue" />
          </div>
          <div class="summary-main">
            <div class="summary-label">今日营收</div>
            <div class="summary-value">¥{{ formatYuan(today.revenueCents) }}</div>
            <div class="summary-sub" :class="growthClass">环比 {{ growthText }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="never" class="summary-card">
          <div class="summary-icon summary-icon-blue">
            <svg-icon icon-class="fish-timer" />
          </div>
          <div class="summary-main">
            <div class="summary-label">进行中订单</div>
            <div class="summary-value">{{ active.running || 0 }}</div>
            <div class="summary-sub">待支付 {{ active.pending || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="never" class="summary-card">
          <div class="summary-icon summary-icon-green">
            <svg-icon icon-class="fish-conversion" />
          </div>
          <div class="summary-main">
            <div class="summary-label">支付转化</div>
            <div class="summary-value">{{ payRate }}%</div>
            <div class="summary-sub">平均时长 {{ avgMinutes }} 分</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="18" class="chart-grid">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="chart-head">
              <span>近 {{ days }} 天订单趋势</span>
              <small>总订单 / 已支付</small>
            </div>
          </template>
          <div ref="orderChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="chart-head">
              <span>近 {{ days }} 天营收趋势</span>
              <small>按支付金额统计</small>
            </div>
          </template>
          <div ref="revenueChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Dashboard">
import * as echarts from 'echarts'
import { summary, orderTrend, revenueTrend } from '@/api/fishing/dashboard'

const today = ref({})
const yesterday = ref({})
const active = ref({})
const growthValue = ref(0)
const conversion = ref(0)
const days = ref(7)
const orderChartRef = ref(null)
const revenueChartRef = ref(null)
let orderChart = null
let revenueChart = null

const growthClass = computed(() => growthValue.value >= 0 ? 'up' : 'down')
const growthText = computed(() => {
  const v = growthValue.value * 100
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'
})
const payRate = computed(() => (conversion.value * 100).toFixed(1))
const avgMinutes = computed(() => {
  const sec = Number(today.value?.avgDurationSeconds || 0)
  return Math.round(sec / 60)
})

function formatYuan(cents) { return ((Number(cents) || 0) / 100).toFixed(2) }

function loadSummary() {
  summary().then((res) => {
    const d = res.data || {}
    today.value = d.today || {}
    yesterday.value = d.yesterday || {}
    active.value = d.active || {}
    growthValue.value = Number(d.revenueGrowth || 0)
    conversion.value = Number(d.payConversion || 0)
  })
}

function renderOrderChart(rows) {
  if (!orderChart) orderChart = echarts.init(orderChartRef.value)
  orderChart.setOption({
    color: ['oklch(54% 0.105 166)', 'oklch(75% 0.12 82)'],
    tooltip: { trigger: 'axis', backgroundColor: 'oklch(20% 0.035 205 / .92)', borderWidth: 0, textStyle: { color: 'oklch(98% 0.006 166)' } },
    legend: { data: ['总订单', '已支付'], top: 0, right: 0, itemWidth: 10, itemHeight: 10 },
    grid: { left: 42, right: 20, top: 48, bottom: 30 },
    xAxis: {
      type: 'category',
      data: rows.map(r => r.day),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'oklch(88% 0.018 166)' } },
      axisLabel: { color: 'oklch(46% 0.034 196)' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'oklch(93% 0.016 166)' } },
      axisLabel: { color: 'oklch(46% 0.034 196)' }
    },
    series: [
      {
        name: '总订单',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'oklch(54% 0.105 166 / .2)' }, { offset: 1, color: 'oklch(54% 0.105 166 / 0)' }]) },
        data: rows.map(r => Number(r.total || 0))
      },
      {
        name: '已支付',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        data: rows.map(r => Number(r.paid || 0))
      }
    ]
  })
}

function renderRevenueChart(rows) {
  if (!revenueChart) revenueChart = echarts.init(revenueChartRef.value)
  revenueChart.setOption({
    color: ['oklch(75% 0.12 82)'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'oklch(20% 0.035 205 / .92)',
      borderWidth: 0,
      textStyle: { color: 'oklch(98% 0.006 166)' },
      valueFormatter: v => '¥' + (v / 100).toFixed(2)
    },
    grid: { left: 66, right: 20, top: 42, bottom: 30 },
    xAxis: {
      type: 'category',
      data: rows.map(r => r.day),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'oklch(88% 0.018 166)' } },
      axisLabel: { color: 'oklch(46% 0.034 196)' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'oklch(93% 0.016 166)' } },
      axisLabel: { color: 'oklch(46% 0.034 196)', formatter: v => '¥' + (v / 100).toFixed(0) }
    },
    series: [{
      name: '营收',
      type: 'bar',
      barWidth: 22,
      data: rows.map(r => Number(r.revenueCents || 0)),
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'oklch(86% 0.09 82)' }, { offset: 1, color: 'oklch(68% 0.12 82)' }])
      }
    }]
  })
}

function loadCharts() {
  orderTrend(days.value).then((res) => renderOrderChart(res.data || []))
  revenueTrend(days.value).then((res) => renderRevenueChart(res.data || []))
}

onMounted(() => {
  loadSummary()
  nextTick(loadCharts)
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  orderChart?.dispose()
  revenueChart?.dispose()
})
function handleResize() {
  orderChart?.resize()
  revenueChart?.resize()
}
</script>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 84px);
  background: var(--app-bg);
}

.dashboard-hero {
  min-height: 176px;
  padding: 28px 30px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background: var(--app-surface);
  color: var(--app-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: var(--app-shadow-sm);
  overflow: hidden;
  position: relative;
}

.hero-kicker {
  color: var(--app-primary-strong);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.hero-title {
  margin: 12px 0 10px;
  color: var(--app-text);
  font-size: 28px;
  font-weight: 800;
}

.hero-desc {
  margin: 0;
  max-width: 560px;
  color: var(--app-text-soft);
  line-height: 1.7;
}

.hero-panel {
  position: relative;
  z-index: 1;
  width: 238px;
  padding: 20px;
  border: 1px solid var(--app-primary-soft);
  border-radius: var(--app-radius);
  background: var(--app-primary-faint);
}

.hero-panel-label,
.hero-growth {
  display: block;
  color: var(--app-text-soft);
  font-size: 13px;
}

.hero-panel strong {
  display: block;
  margin: 8px 0;
  font-size: 34px;
  line-height: 1.1;
}

.hero-growth.up {
  color: var(--app-primary-strong);
}

.hero-growth.down {
  color: var(--app-danger);
}

.summary-grid,
.chart-grid {
  margin-top: 18px;
}

.summary-grid :deep(.el-col) {
  margin-bottom: 18px;
}

.summary-card {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-sm);
}

.summary-card :deep(.el-card__body) {
  min-height: 110px;
  padding: 22px !important;
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  width: 54px;
  height: 54px;
  border-radius: var(--app-radius);
  background: var(--app-primary-faint);
  color: var(--app-primary-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
  flex: 0 0 auto;
}

.summary-icon .svg-icon {
  width: 28px;
  height: 28px;
}

.summary-icon-gold {
  background: var(--app-accent-soft);
  color: oklch(48% 0.09 78);
}

.summary-icon-blue {
  background: var(--app-primary-faint);
  color: var(--app-primary-strong);
}

.summary-icon-green {
  background: var(--app-surface-muted);
  color: var(--app-text);
}

.summary-main {
  min-width: 0;
}

.summary-label {
  color: var(--app-text-soft);
  font-size: 14px;
}

.summary-value {
  margin: 6px 0;
  color: var(--app-text);
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.summary-sub {
  color: var(--app-text-muted);
  font-size: 13px;
}

.summary-sub.up {
  color: var(--app-primary-strong);
}

.summary-sub.down {
  color: var(--app-danger);
}

.chart-card {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow-sm);
}

.chart-card :deep(.el-card__header) {
  padding: 18px 22px 8px !important;
  border-bottom: 0;
}

.chart-card :deep(.el-card__body) {
  padding: 8px 22px 22px !important;
}

.chart-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  color: var(--app-text);
  font-size: 16px;
  font-weight: 800;
}

.chart-head small {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.chart {
  width: 100%;
  height: 318px;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 12px;
  }

  .dashboard-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }

  .hero-panel {
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
