<template>
  <div class="app-container">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">今日订单</div>
          <div class="summary-value">{{ today.orderCount || 0 }}</div>
          <div class="summary-sub">昨日 {{ yesterday.orderCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">今日营收</div>
          <div class="summary-value">¥{{ formatYuan(today.revenueCents) }}</div>
          <div class="summary-sub" :class="growthClass">
            环比 {{ growthText }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">进行中订单</div>
          <div class="summary-value">{{ active.running || 0 }}</div>
          <div class="summary-sub">待支付 {{ active.pending || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">支付转化</div>
          <div class="summary-value">{{ payRate }}%</div>
          <div class="summary-sub">平均时长 {{ avgMinutes }} 分</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>近 {{ days }} 天订单趋势</template>
          <div ref="orderChartRef" style="width:100%;height:300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>近 {{ days }} 天营收趋势</template>
          <div ref="revenueChartRef" style="width:100%;height:300px"></div>
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
    tooltip: { trigger: 'axis' },
    legend: { data: ['总订单', '已支付'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: rows.map(r => r.day) },
    yAxis: { type: 'value' },
    series: [
      { name: '总订单', type: 'line', smooth: true, data: rows.map(r => Number(r.total || 0)) },
      { name: '已支付', type: 'line', smooth: true, data: rows.map(r => Number(r.paid || 0)) }
    ]
  })
}

function renderRevenueChart(rows) {
  if (!revenueChart) revenueChart = echarts.init(revenueChartRef.value)
  revenueChart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: v => '¥' + (v / 100).toFixed(2) },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: rows.map(r => r.day) },
    yAxis: { type: 'value', axisLabel: { formatter: v => '¥' + (v / 100).toFixed(0) } },
    series: [{ name: '营收', type: 'bar', data: rows.map(r => Number(r.revenueCents || 0)), itemStyle: { color: '#f5c23b' } }]
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
.summary-card { text-align: center; padding: 12px 0; }
.summary-label { color: #909399; font-size: 14px; }
.summary-value { font-size: 28px; font-weight: 700; color: #303133; margin: 8px 0; }
.summary-sub { font-size: 12px; color: #909399; }
.summary-sub.up { color: #67c23a; }
.summary-sub.down { color: #f56c6c; }
</style>
