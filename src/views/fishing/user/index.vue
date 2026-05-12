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
      <el-table-column label="黑名单" align="center" width="90">
        <template #default="s"><el-tag v-if="s.row.isBlacklist === 1" type="danger">已拉黑</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template #default="s">
          <el-button v-if="s.row.isBlacklist !== 1" link type="danger" @click="handleBlacklist(s.row, true)" v-hasPermi="['fishing:user:blacklist']">拉黑</el-button>
          <el-button v-else link type="success" @click="handleBlacklist(s.row, false)" v-hasPermi="['fishing:user:blacklist']">解除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="拉黑用户" v-model="blacklistOpen" width="420px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="拉黑原因"><el-input v-model="blacklistReason" placeholder="如：使用违规渔具" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="confirmBlacklist">确 定</el-button>
        <el-button @click="blacklistOpen = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FishUser">
import { listFishUser, setBlacklist } from '@/api/fishing/user'
const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const queryParams = ref({ pageNum: 1, pageSize: 10, nickname: undefined, phone: undefined, status: undefined })
const blacklistOpen = ref(false)
const blacklistReason = ref('')
const blacklistTarget = ref(null)

function getList() {
  loading.value = true
  listFishUser(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

function handleBlacklist(row, flag) {
  if (flag) {
    blacklistTarget.value = row
    blacklistReason.value = ''
    blacklistOpen.value = true
  } else {
    proxy.$modal.confirm('确认解除该用户黑名单？').then(() => {
      setBlacklist({ userId: row.userId, blacklist: false }).then(() => { proxy.$modal.msgSuccess('已解除'); getList() })
    })
  }
}
function confirmBlacklist() {
  setBlacklist({ userId: blacklistTarget.value.userId, blacklist: true, reason: blacklistReason.value }).then(() => {
    proxy.$modal.msgSuccess('已拉黑')
    blacklistOpen.value = false
    getList()
  })
}

getList()
</script>
