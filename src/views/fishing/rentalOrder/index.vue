<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="租借中" :value="0" /><el-option label="已归还" :value="1" /><el-option label="已取消" :value="2" /><el-option label="押金扣除" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单号" prop="orderNo" width="200" align="center" />
      <el-table-column label="用户" prop="nickname" width="100" align="center" />
      <el-table-column label="装备" prop="goodsName" align="center" />
      <el-table-column label="押金(元)" width="100" align="center">
        <template #default="s">{{ ((s.row.depositCents||0)/100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="租金(元)" width="100" align="center">
        <template #default="s">{{ ((s.row.rentCents||0)/100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="租借时间" prop="rentTime" width="170" align="center" />
      <el-table-column label="归还时间" prop="returnTime" width="170" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="s"><el-tag :type="{0:'warning',1:'success',2:'info',3:'danger'}[s.row.status]">{{ {0:'租借中',1:'已归还',2:'已取消',3:'押金扣除'}[s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="s">
          <el-button v-if="s.row.status===0" link type="success" @click="doReturn(s.row)" v-hasPermi="['fishing:rentalOrder:return']">确认归还</el-button>
          <el-button v-if="s.row.status===0" link type="danger" @click="doForfeit(s.row)" v-hasPermi="['fishing:rentalOrder:forfeit']">扣押金</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="RentalOrder">
import { listRentalOrder, confirmReturn, forfeitDeposit } from '@/api/fishing/rental'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), total = ref(0)
const queryParams = ref({ pageNum:1, pageSize:20, status:null })

function getList() { loading.value=true; listRentalOrder(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function handleQuery() { queryParams.value.pageNum=1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function doReturn(row) { proxy.$modal.confirm('确认该装备已归还？将退还押金。').then(()=>confirmReturn(row.orderId)).then(()=>{proxy.$modal.msgSuccess('已归还');getList()}) }
function doForfeit(row) { proxy.$modal.confirm('确认扣除押金？（装备损坏/丢失）').then(()=>forfeitDeposit(row.orderId,'')).then(()=>{proxy.$modal.msgSuccess('已扣除');getList()}) }
getList()
</script>
