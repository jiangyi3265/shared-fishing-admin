<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="待确认" :value="0" /><el-option label="已确认" :value="1" />
          <el-option label="已到场" :value="2" /><el-option label="已取消" :value="3" /><el-option label="超时释放" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="预订日期">
        <el-date-picker v-model="dateRange" style="width:240px" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始" end-placeholder="结束" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="预订号" prop="reservationNo" width="200" align="center" />
      <el-table-column label="用户" prop="nickname" width="100" align="center" />
      <el-table-column label="钓位" prop="spotName" width="100" align="center" />
      <el-table-column label="预订日期" prop="reserveDate" width="120" align="center" />
      <el-table-column label="时段" prop="timeSlot" width="120" align="center" />
      <el-table-column label="押金(元)" width="100" align="center">
        <template #default="s">{{ ((s.row.depositCents||0)/100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="s"><el-tag :type="{0:'warning',1:'',2:'success',3:'info',4:'danger'}[s.row.status]">{{ {0:'待确认',1:'已确认',2:'已到场',3:'已取消',4:'超时释放'}[s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="s">
          <el-button v-if="s.row.status===0" link type="primary" @click="doConfirm(s.row)" v-hasPermi="['fishing:reservation:confirm']">确认</el-button>
          <el-button v-if="s.row.status<=1" link type="danger" @click="doCancel(s.row)" v-hasPermi="['fishing:reservation:cancel']">取消</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="FishReservation">
import { listReservation, confirmReservation, cancelReservation } from '@/api/fishing/spot'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), total = ref(0), showSearch = ref(true), dateRange = ref([])
const queryParams = ref({ pageNum:1, pageSize:10, status:null })

function getList() {
  loading.value = true
  const p = { ...queryParams.value }
  if (dateRange.value && dateRange.value.length === 2) p.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] }
  listReservation(p).then(r => { list.value = r.rows; total.value = r.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { dateRange.value = []; proxy.resetForm('queryRef'); handleQuery() }
function doConfirm(row) { proxy.$modal.confirm('确认该预订？').then(() => confirmReservation(row.reservationId)).then(() => { proxy.$modal.msgSuccess('已确认'); getList() }) }
function doCancel(row) { proxy.$modal.confirm('取消该预订？').then(() => cancelReservation(row.reservationId, '管理员取消')).then(() => { proxy.$modal.msgSuccess('已取消'); getList() }) }
getList()
</script>
