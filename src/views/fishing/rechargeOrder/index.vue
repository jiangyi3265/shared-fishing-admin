<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="充值单号" prop="rechargeNo">
        <el-input v-model="queryParams.rechargeNo" clearable style="width:220px" />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="queryParams.userId" clearable style="width:160px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable style="width:140px">
          <el-option label="待支付" :value="0" />
          <el-option label="已完成" :value="1" />
          <el-option label="已取消" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间段">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width:240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['fishing:rechargeOrder:export']">导出</el-button>
      </el-form-item>
    </el-form>

    <el-card class="adjust-card" shadow="never">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-weight:700;">余额查询/调整：</span>
        <el-input v-model="queryUserId" placeholder="用户ID" style="width:140px" />
        <el-button @click="loadBalance">查询</el-button>
        <span v-if="userBalance" style="margin-left:12px;">
          余额 <b style="color:#b8860b">¥{{ ((userBalance.balanceCents || 0) / 100).toFixed(2) }}</b>
          · 累计充值 ¥{{ ((userBalance.totalRechargeCents || 0) / 100).toFixed(2) }}
          · 累计消费 ¥{{ ((userBalance.totalConsumedCents || 0) / 100).toFixed(2) }}
        </span>
        <el-input-number v-if="userBalance" v-model="adjustYuan" :precision="2" :step="10" placeholder="调整(元)" style="width:160px" />
        <el-input v-if="userBalance" v-model="adjustRemark" placeholder="备注" style="width:200px" />
        <el-button v-if="userBalance" type="danger" plain @click="doAdjust" v-hasPermi="['fishing:rechargeOrder:adjust']">提交调整</el-button>
      </div>
      <el-table v-if="balanceLogs.length" :data="balanceLogs.slice(0, 10)" size="small" style="margin-top:10px">
        <el-table-column label="时间" prop="createTime" width="180" />
        <el-table-column label="类型" prop="type" width="120" />
        <el-table-column label="变动">
          <template #default="s">
            <span :style="{ color: s.row.deltaCents >= 0 ? '#16a34a' : '#dc2626' }">
              {{ s.row.deltaCents >= 0 ? '+' : '' }}¥{{ (s.row.deltaCents / 100).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额"><template #default="s">¥{{ ((s.row.balanceAfterCents || 0) / 100).toFixed(2) }}</template></el-table-column>
        <el-table-column label="备注" prop="remark" />
      </el-table>
    </el-card>

    <el-table v-loading="loading" :data="list" style="margin-top:12px">
      <el-table-column label="充值单号" prop="rechargeNo" width="220" />
      <el-table-column label="用户" prop="nickname" width="120" />
      <el-table-column label="支付金额"><template #default="s">¥{{ ((s.row.amountCents || 0) / 100).toFixed(2) }}</template></el-table-column>
      <el-table-column label="赠送"><template #default="s">+¥{{ ((s.row.bonusCents || 0) / 100).toFixed(2) }}</template></el-table-column>
      <el-table-column label="入账"><template #default="s">¥{{ ((s.row.totalCreditCents || 0) / 100).toFixed(2) }}</template></el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="s"><el-tag :type="['warning','success','info'][s.row.status]">{{ ['待支付','已完成','已取消'][s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="支付单号" prop="payTradeNo" width="180" show-overflow-tooltip />
      <el-table-column label="支付时间" prop="paidTime" width="160" />
      <el-table-column label="下单时间" prop="createTime" width="160" />
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="RechargeOrder">
import { listRecharge, getUserBalance, adjustBalance } from '@/api/fishing/rechargeOrder'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dateRange = ref([])
const queryUserId = ref('')
const userBalance = ref(null)
const balanceLogs = ref([])
const adjustYuan = ref(0)
const adjustRemark = ref('')

const queryParams = ref({ pageNum: 1, pageSize: 10, rechargeNo: undefined, userId: undefined, status: undefined })

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
  listRecharge(buildParams()).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; queryParams.value = { pageNum: 1, pageSize: 10 }; getList() }
function handleExport() { proxy.download('fishing/rechargeOrder/export', buildParams(), `recharge_${new Date().getTime()}.xlsx`) }
function loadBalance() {
  if (!queryUserId.value) { proxy.$modal.msgError('请输入用户ID'); return }
  getUserBalance(queryUserId.value).then(res => {
    userBalance.value = res.data && res.data.balance
    balanceLogs.value = (res.data && res.data.logs) || []
  })
}
function doAdjust() {
  if (!adjustYuan.value || adjustYuan.value === 0) { proxy.$modal.msgError('调整金额不可为 0'); return }
  proxy.$modal.confirm(`确认给用户 ${queryUserId.value} 调整 ${adjustYuan.value > 0 ? '+' : ''}¥${adjustYuan.value}?`).then(() => {
    return adjustBalance({ userId: queryUserId.value, deltaCents: Math.round(adjustYuan.value * 100), remark: adjustRemark.value })
  }).then(() => { proxy.$modal.msgSuccess('调整完成'); adjustYuan.value = 0; adjustRemark.value = ''; loadBalance() }).catch(() => {})
}

getList()
</script>

<style scoped>
.adjust-card { background: #fffbe6; border: 1px solid #ffe58f; }
</style>
