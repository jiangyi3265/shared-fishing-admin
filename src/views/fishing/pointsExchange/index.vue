<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="待发放" :value="0" /><el-option label="已发放" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button></el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" prop="exchangeId" width="70" align="center" />
      <el-table-column label="用户" prop="nickname" width="100" align="center" />
      <el-table-column label="商品" prop="goodsName" align="center" />
      <el-table-column label="消耗积分" prop="pointsCost" width="100" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="s"><el-tag :type="{0:'warning',1:'success',2:'info'}[s.row.status]">{{ {0:'待发放',1:'已发放',2:'已取消'}[s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="兑换时间" prop="createTime" width="170" align="center" />
      <el-table-column label="操作" width="100" align="center">
        <template #default="s">
          <el-button v-if="s.row.status===0" link type="success" @click="doDeliver(s.row)" v-hasPermi="['fishing:pointsExchange:deliver']">发放</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="PointsExchange">
import { listPointsExchange, deliverExchange } from '@/api/fishing/points'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), total = ref(0)
const queryParams = ref({ pageNum:1, pageSize:20, status:null })

function getList() { loading.value=true; listPointsExchange(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function handleQuery() { queryParams.value.pageNum=1; getList() }
function doDeliver(row) { proxy.$modal.confirm('确认发放？').then(()=>deliverExchange(row.exchangeId)).then(()=>{proxy.$modal.msgSuccess('已发放');getList()}) }
getList()
</script>
