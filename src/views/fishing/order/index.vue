<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width:220px" />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="用户ID" clearable style="width:160px" />
      </el-form-item>
      <el-form-item label="钓场" prop="venueId">
        <el-select v-model="queryParams.venueId" placeholder="钓场" clearable style="width:160px">
          <el-option v-for="v in venueOptions" :key="v.venueId" :label="v.name" :value="v.venueId" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="待支付" :value="0" />
          <el-option label="计时中" :value="1" />
          <el-option label="待结算" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间段">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width:240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['fishing:order:export']">导出</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="订单号" align="center" prop="orderNo" width="180" />
      <el-table-column label="用户" align="center" prop="nickname" width="120" />
      <el-table-column label="钓场" align="center" prop="venueName" />
      <el-table-column label="状态" align="center" width="90">
        <template #default="s">
          <el-tag :type="statusTag(s.row.status)">{{ statusLabel(s.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" align="center" prop="startTime" width="160" />
      <el-table-column label="结束时间" align="center" prop="endTime" width="160" />
      <el-table-column label="计费时长" align="center" width="100">
        <template #default="s">{{ formatDuration(s.row.durationSeconds) }}</template>
      </el-table-column>
      <el-table-column label="应付" align="center" width="100">
        <template #default="s">¥{{ ((s.row.amountCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="实付" align="center" width="100">
        <template #default="s">¥{{ ((s.row.amountPaid || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="s">
          <el-button link type="primary" @click="handleDetail(s.row)">详情</el-button>
          <el-button link type="warning" v-if="s.row.status === 1" @click="handleFinish(s.row)" v-hasPermi="['fishing:order:finish']">人工结束</el-button>
          <el-button link type="danger" v-if="s.row.status !== 3 && s.row.status !== 4" @click="handleCancel(s.row)" v-hasPermi="['fishing:order:cancel']">取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="订单详情" v-model="detailOpen" width="520px">
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.nickname }} (ID: {{ detail.userId }})</el-descriptions-item>
        <el-descriptions-item label="钓场">{{ detail.venueName }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ detail.endTime || '--' }}</el-descriptions-item>
        <el-descriptions-item label="实际时长">{{ formatDuration(detail.elapsedSeconds) }}</el-descriptions-item>
        <el-descriptions-item label="计费时长">{{ formatDuration(detail.durationSeconds) }}</el-descriptions-item>
        <el-descriptions-item label="应付金额">¥{{ ((detail.amountCents || 0) / 100).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="优惠">¥{{ ((detail.discountCents || 0) / 100).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="实付">¥{{ ((detail.amountPaid || 0) / 100).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ detail.paidTime || '--' }}</el-descriptions-item>
        <el-descriptions-item label="支付单号" :span="2">{{ detail.payTradeNo || '--' }}</el-descriptions-item>
        <el-descriptions-item label="取消原因" :span="2">{{ detail.cancelReason || '--' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="Order">
import { listOrder, getOrder, finishOrder, cancelOrder } from '@/api/fishing/order'
import { listVenue } from '@/api/fishing/venue'
import { ElMessageBox } from 'element-plus'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const detailOpen = ref(false)
const detail = ref(null)
const venueOptions = ref([])
const dateRange = ref([])

const queryParams = ref({ pageNum: 1, pageSize: 10, orderNo: undefined, userId: undefined, venueId: undefined, status: undefined })

function buildParams() {
  const p = { ...queryParams.value }
  p.params = {}
  if (dateRange.value && dateRange.value.length === 2) {
    p.params.beginTime = dateRange.value[0]
    p.params.endTime = dateRange.value[1] + ' 23:59:59'
  }
  return p
}

function getList() {
  loading.value = true
  listOrder(buildParams()).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function loadVenues() { listVenue({ pageNum: 1, pageSize: 100 }).then(res => venueOptions.value = res.rows || []) }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm('queryRef'); handleQuery() }
function statusLabel(s) { return ['待支付','计时中','待结算','已完成','已取消'][s] || s }
function statusTag(s) { return ['warning','success','primary','info','danger'][s] }
function formatDuration(sec) {
  sec = sec || 0
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
function handleDetail(row) { getOrder(row.orderId).then(res => { detail.value = res.data; detailOpen.value = true }) }
function handleFinish(row) {
  proxy.$modal.confirm('确认人工结束该订单?').then(() => finishOrder(row.orderId))
    .then(() => { proxy.$modal.msgSuccess('已结束计时'); getList() }).catch(() => {})
}
function handleCancel(row) {
  ElMessageBox.prompt('请输入取消原因', '取消订单', { inputPlaceholder: '取消原因', closeOnClickModal: false })
    .then(({ value }) => cancelOrder(row.orderId, value || ''))
    .then(() => { proxy.$modal.msgSuccess('已取消'); getList() }).catch(() => {})
}
function handleExport() {
  proxy.download('fishing/order/export', buildParams(), `order_${new Date().getTime()}.xlsx`)
}

loadVenues()
getList()
</script>
