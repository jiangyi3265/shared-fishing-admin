<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="招募中" :value="0" /><el-option label="已满员" :value="1" /><el-option label="已完成" :value="2" /><el-option label="已取消" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" prop="groupId" width="70" align="center" />
      <el-table-column label="标题" prop="title" align="center" />
      <el-table-column label="发起人" prop="nickname" width="100" align="center" />
      <el-table-column label="钓位" prop="spotName" width="100" align="center" />
      <el-table-column label="日期" prop="fishingDate" width="120" align="center" />
      <el-table-column label="时段" prop="timeSlot" width="120" align="center" />
      <el-table-column label="人数" width="90" align="center">
        <template #default="s">{{ s.row.currentCount }}/{{ s.row.maxMembers }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="s"><el-tag :type="{0:'',1:'success',2:'info',3:'danger'}[s.row.status]">{{ {0:'招募中',1:'已满员',2:'已完成',3:'已取消'}[s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center">
        <template #default="s">
          <el-button v-if="s.row.status<=1" link type="danger" @click="doCancel(s.row)" v-hasPermi="['fishing:group:cancel']">取消</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="GroupFishing">
import { listGroup, cancelGroup } from '@/api/fishing/group'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), total = ref(0)
const queryParams = ref({ pageNum:1, pageSize:20, status:null })

function getList() { loading.value=true; listGroup(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function handleQuery() { queryParams.value.pageNum=1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function doCancel(row) { proxy.$modal.confirm('确认取消该拼场？').then(()=>cancelGroup(row.groupId)).then(()=>{proxy.$modal.msgSuccess('已取消');getList()}) }
getList()
</script>
