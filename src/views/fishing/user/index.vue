<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="70px">
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="queryParams.nickname" placeholder="昵称" clearable style="width:220px" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="queryParams.phone" placeholder="手机号" clearable style="width:200px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="正常" value="0" />
          <el-option label="禁用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" align="center" prop="userId" width="70" />
      <el-table-column label="昵称" align="center" prop="nickname" />
      <el-table-column label="openid" align="center" prop="openid" :show-overflow-tooltip="true" />
      <el-table-column label="手机号" align="center" prop="phone" width="140" />
      <el-table-column label="状态" align="center" width="80">
        <template #default="s"><el-tag :type="s.row.status === '0' ? 'success' : 'danger'">{{ s.row.status === '0' ? '正常' : '禁用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="最近登录" align="center" prop="lastLoginTime" width="170" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="FishUser">
import { listFishUser } from '@/api/fishing/user'
const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const queryParams = ref({ pageNum: 1, pageSize: 10, nickname: undefined, phone: undefined, status: undefined })

function getList() {
  loading.value = true
  listFishUser(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
getList()
</script>
