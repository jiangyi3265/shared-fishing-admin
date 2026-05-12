<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="退款单号" prop="refundNo">
        <el-input v-model="queryParams.refundNo" placeholder="退款单号" clearable style="width:200px" />
      </el-form-item>
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width:200px" />
      </el-form-item>
      <el-form-item label="订单类型" prop="orderType">
        <el-select v-model="queryParams.orderType" clearable placeholder="全部" style="width:120px">
          <el-option label="钓场" value="fishing" />
          <el-option label="商城" value="mall" />
        </el-select>
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="用户ID" clearable style="width:140px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="待审核" :value="0" />
          <el-option label="退款中" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已驳回" :value="3" />
          <el-option label="退款失败" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间段">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width:240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['fishing:refund:export']">导出</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="退款单号" align="center" prop="refundNo" width="200" />
      <el-table-column label="订单号" align="center" prop="orderNo" width="180" />
      <el-table-column label="类型" align="center" width="80">
        <template #default="s">
          <el-tag :type="s.row.orderType === 'mall' ? 'success' : 'primary'" size="small">
            {{ s.row.orderType === 'mall' ? '商城' : '钓场' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户" align="center" prop="nickname" width="120" />
      <el-table-column label="钓场" align="center" prop="venueName" />
      <el-table-column label="申请金额" align="center" width="100">
        <template #default="s">¥{{ ((s.row.applyAmountCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="实退金额" align="center" width="100">
        <template #default="s">¥{{ ((s.row.refundAmountCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="原因" align="center" prop="reason" show-overflow-tooltip />
      <el-table-column label="状态" align="center" width="90">
        <template #default="s">
          <el-tag :type="statusTag(s.row.status)">{{ statusLabel(s.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" align="center" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template #default="s">
          <el-button link type="primary" @click="handleDetail(s.row)">详情</el-button>
          <el-button link type="success" v-if="s.row.status === 0" @click="openApprove(s.row)" v-hasPermi="['fishing:refund:audit']">通过</el-button>
          <el-button link type="danger"  v-if="s.row.status === 0" @click="handleReject(s.row)"  v-hasPermi="['fishing:refund:audit']">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="退款详情" v-model="detailOpen" width="520px">
      <el-descriptions :column="2" border v-if="detail">
        <el-descriptions-item label="退款单号" :span="2">{{ detail.refundNo }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ detail.orderType === 'mall' ? '商城' : '钓场' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.nickname }} (ID: {{ detail.userId }})</el-descriptions-item>
        <el-descriptions-item label="钓场" v-if="detail.orderType !== 'mall'">{{ detail.venueName }}</el-descriptions-item>
        <el-descriptions-item label="申请金额">¥{{ ((detail.applyAmountCents || 0) / 100).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="实退金额">¥{{ ((detail.refundAmountCents || 0) / 100).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="原因" :span="2">{{ detail.reason || '--' }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2">{{ detail.auditRemark || '--' }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ detail.auditBy || '--' }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ detail.auditTime || '--' }}</el-descriptions-item>
        <el-descriptions-item label="微信退款号" :span="2">{{ detail.wxRefundNo || '--' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" :span="2">{{ detail.finishTime || '--' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog title="通过退款" v-model="approveOpen" width="420px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="申请金额">¥{{ ((approveForm.applyAmountCents || 0) / 100).toFixed(2) }}</el-form-item>
        <el-form-item label="实退金额(元)">
          <el-input-number v-model="approveForm.refundYuan" :min="0.01" :precision="2" :step="0.5" />
          <span style="margin-left:8px;color:#999;">不可超过申请金额</span>
        </el-form-item>
        <el-form-item label="审批备注">
          <el-input v-model="approveForm.auditRemark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveOpen = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确认通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Refund">
import { listRefund, getRefund, approveRefund, rejectRefund } from '@/api/fishing/refund'
import { ElMessageBox } from 'element-plus'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const detailOpen = ref(false)
const detail = ref(null)
const approveOpen = ref(false)
const approveForm = ref({ refundId: null, applyAmountCents: 0, refundYuan: 0, auditRemark: '' })
const dateRange = ref([])

const queryParams = ref({ pageNum: 1, pageSize: 10, refundNo: undefined, orderNo: undefined, userId: undefined, orderType: undefined, status: undefined })

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
  listRefund(buildParams()).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm('queryRef'); handleQuery() }
function statusLabel(s) { return ['待审核','退款中','已完成','已驳回','退款失败'][s] || s }
function statusTag(s) { return ['warning','primary','success','info','danger'][s] }
function handleDetail(row) { getRefund(row.refundId).then(res => { detail.value = res.data; detailOpen.value = true }) }
function openApprove(row) {
  approveForm.value = {
    refundId: row.refundId,
    applyAmountCents: row.applyAmountCents,
    refundYuan: ((row.applyAmountCents || 0) / 100),
    auditRemark: ''
  }
  approveOpen.value = true
}
function submitApprove() {
  const cents = Math.round((approveForm.value.refundYuan || 0) * 100)
  if (cents <= 0 || cents > approveForm.value.applyAmountCents) {
    proxy.$modal.msgError('实退金额非法'); return
  }
  approveRefund(approveForm.value.refundId, { refundAmountCents: cents, auditRemark: approveForm.value.auditRemark })
    .then(() => { proxy.$modal.msgSuccess('已通过'); approveOpen.value = false; getList() })
}
function handleReject(row) {
  ElMessageBox.prompt('请输入驳回原因', '驳回退款', { inputPlaceholder: '驳回原因', closeOnClickModal: false })
    .then(({ value }) => rejectRefund(row.refundId, { auditRemark: value || '' }))
    .then(() => { proxy.$modal.msgSuccess('已驳回'); getList() }).catch(() => {})
}
function handleExport() {
  proxy.download('fishing/refund/export', buildParams(), `refund_${new Date().getTime()}.xlsx`)
}

getList()
</script>
