<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="活动ID" prop="adId">
        <el-input v-model="queryParams.adId" placeholder="活动ID" clearable style="width:160px" />
      </el-form-item>
      <el-form-item label="姓名" prop="name"><el-input v-model="queryParams.name" placeholder="姓名" clearable style="width:200px" /></el-form-item>
      <el-form-item label="电话" prop="phone"><el-input v-model="queryParams.phone" placeholder="电话" clearable style="width:200px" /></el-form-item>
      <el-form-item label="支付状态" prop="paid">
        <el-select v-model="queryParams.paid" placeholder="支付状态" clearable style="width:120px">
          <el-option label="未支付" :value="0" />
          <el-option label="已支付" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" align="center" prop="regId" width="70" />
      <el-table-column label="活动" align="center" prop="activityName" />
      <el-table-column label="姓名" align="center" prop="name" width="120" />
      <el-table-column label="电话" align="center" prop="phone" width="140" />
      <el-table-column label="报名费" align="center" width="100">
        <template #default="s">¥{{ ((s.row.feeCents || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="支付" align="center" width="90">
        <template #default="s"><el-tag :type="s.row.paid === 1 ? 'success' : 'warning'">{{ s.row.paid === 1 ? '已支付' : '未支付' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark2" :show-overflow-tooltip="true" />
      <el-table-column label="报名时间" align="center" prop="createTime" width="170" />
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Registration">
import { listRegistration } from '@/api/fishing/registration'
const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const queryParams = ref({ pageNum: 1, pageSize: 10, adId: undefined, name: undefined, phone: undefined, paid: undefined })

function getList() {
  loading.value = true
  listRegistration(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
getList()
</script>
