<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="订单号" prop="mallOrderNo">
        <el-input v-model="queryParams.mallOrderNo" clearable style="width:200px" />
      </el-form-item>
      <el-form-item label="核销码" prop="redeemCode">
        <el-input v-model="queryParams.redeemCode" clearable style="width:160px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable style="width:140px">
          <el-option label="待支付" :value="0" />
          <el-option label="待核销" :value="1" />
          <el-option label="已核销" :value="2" />
          <el-option label="已取消" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间段">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width:240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['fishing:mallOrder:export']">导出</el-button>
      </el-form-item>
    </el-form>

    <el-card class="redeem-card" shadow="never">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-weight:700;">快速核销：</span>
        <el-input v-model="redeemInput" placeholder="输入订单号或 8 位核销码" style="width:300px" @keyup.enter="doRedeem" />
        <el-button type="primary" @click="doRedeem" v-hasPermi="['fishing:mallOrder:redeem']">核销</el-button>
        <span style="color:#999;margin-left:8px;">老板手机/扫码枪都可</span>
      </div>
    </el-card>

    <el-table v-loading="loading" :data="list" style="margin-top:12px">
      <el-table-column label="订单号" prop="mallOrderNo" width="220" />
      <el-table-column label="用户" prop="nickname" width="120" />
      <el-table-column label="商品" min-width="200">
        <template #default="s">
          <span v-for="it in s.row.items" :key="it.itemId" style="margin-right:6px;">
            {{ it.cover }}{{ it.name }}×{{ it.qty }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="金额" width="100">
        <template #default="s">¥{{ ((s.row.totalCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="s"><el-tag :type="statusTag(s.row.status)">{{ statusLabel(s.row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="核销码" prop="redeemCode" width="120" />
      <el-table-column label="下单时间" prop="createTime" width="160" />
      <el-table-column label="操作" width="200">
        <template #default="s">
          <el-button link type="primary" @click="handleDetail(s.row)">详情</el-button>
          <el-button link type="success" v-if="s.row.status === 1" @click="quickRedeem(s.row)" v-hasPermi="['fishing:mallOrder:redeem']">核销</el-button>
          <el-button link type="danger"  v-if="s.row.status === 0" @click="handleCancel(s.row)" v-hasPermi="['fishing:mallOrder:redeem']">取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="订单详情" v-model="detailOpen" width="560px">
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="订单号" :span="2">{{ detail.mallOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.nickname }} (ID: {{ detail.userId }})</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="合计">¥{{ ((detail.totalCents || 0) / 100).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="实付">¥{{ ((detail.amountPaid || 0) / 100).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="核销码">{{ detail.redeemCode }}</el-descriptions-item>
        <el-descriptions-item label="支付单号">{{ detail.payTradeNo || '--' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ detail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ detail.paidTime || '--' }}</el-descriptions-item>
        <el-descriptions-item label="核销时间">{{ detail.redeemedTime || '--' }}</el-descriptions-item>
        <el-descriptions-item label="核销人">{{ detail.redeemedBy || '--' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark2 || '--' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <el-table :data="detail && detail.items || []" size="small">
        <el-table-column label="封面" width="80"><template #default="s"><span style="font-size:24px">{{ s.row.cover }}</span></template></el-table-column>
        <el-table-column label="商品" prop="name" />
        <el-table-column label="单价" width="100"><template #default="s">¥{{ ((s.row.priceCents || 0) / 100).toFixed(2) }}</template></el-table-column>
        <el-table-column label="数量" prop="qty" width="80" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="MallOrder">
import { listMallOrder, getMallOrder, redeemMallOrder, cancelMallOrder } from '@/api/fishing/mallOrder'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const detailOpen = ref(false)
const detail = ref(null)
const dateRange = ref([])
const redeemInput = ref('')

const queryParams = ref({ pageNum: 1, pageSize: 10, mallOrderNo: undefined, redeemCode: undefined, status: undefined })

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
  listMallOrder(buildParams()).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; queryParams.value = { pageNum: 1, pageSize: 10 }; getList() }
function statusLabel(s) { return ['待支付','待核销','已核销','已取消'][s] || s }
function statusTag(s) { return ['warning','primary','success','info'][s] }
function handleDetail(row) { getMallOrder(row.mallOrderId).then(res => { detail.value = res.data; detailOpen.value = true }) }
function quickRedeem(row) {
  proxy.$modal.confirm('确认核销该订单?').then(() => redeemMallOrder(row.mallOrderNo))
    .then(() => { proxy.$modal.msgSuccess('已核销'); getList() }).catch(() => {})
}
function doRedeem() {
  const code = (redeemInput.value || '').trim()
  if (!code) { proxy.$modal.msgError('请输入订单号或核销码'); return }
  redeemMallOrder(code).then(() => { proxy.$modal.msgSuccess('核销成功'); redeemInput.value = ''; getList() })
}
function handleCancel(row) {
  proxy.$modal.confirm('确认取消该订单?库存将自动回滚').then(() => cancelMallOrder(row.mallOrderId))
    .then(() => { proxy.$modal.msgSuccess('已取消'); getList() }).catch(() => {})
}
function handleExport() {
  proxy.download('fishing/mallOrder/export', buildParams(), `mall_order_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style scoped>
.redeem-card { background: #fffbe6; border: 1px solid #ffe58f; }
</style>
