<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:140px">
          <el-option label="待审核" :value="0" /><el-option label="已通过" :value="1" /><el-option label="已拒绝" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="鱼种" prop="fishSpecies">
        <el-input v-model="queryParams.fishSpecies" placeholder="鱼种" clearable style="width:160px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list" @selection-change="sel => ids = sel.map(i=>i.catchId)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="catchId" width="70" align="center" />
      <el-table-column label="用户" prop="nickname" width="100" align="center" />
      <el-table-column label="鱼种" prop="fishSpecies" width="100" align="center" />
      <el-table-column label="重量(斤)" prop="weightJin" width="90" align="center" />
      <el-table-column label="钓法" prop="fishingMethod" width="80" align="center" />
      <el-table-column label="图片" width="80" align="center">
        <template #default="s">
          <el-image v-if="s.row.images" :src="s.row.images.split(',')[0]" style="width:40px;height:40px" fit="cover" :preview-src-list="s.row.images.split(',')" />
        </template>
      </el-table-column>
      <el-table-column label="点赞" prop="likeCount" width="70" align="center" />
      <el-table-column label="精选" width="70" align="center">
        <template #default="s"><el-tag v-if="s.row.isFeatured===1" type="warning">精选</el-tag></template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="s"><el-tag :type="{0:'warning',1:'success',2:'danger'}[s.row.status]">{{ {0:'待审核',1:'已通过',2:'已拒绝'}[s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="发布时间" prop="createTime" width="170" align="center" />
      <el-table-column label="操作" width="200" align="center">
        <template #default="s">
          <el-button v-if="s.row.status===0" link type="success" @click="doAudit(s.row,1)" v-hasPermi="['fishing:catch:audit']">通过</el-button>
          <el-button v-if="s.row.status===0" link type="danger" @click="doAudit(s.row,2)" v-hasPermi="['fishing:catch:audit']">拒绝</el-button>
          <el-button v-if="s.row.status===1" link :type="s.row.isFeatured?'info':'warning'" @click="doFeature(s.row)" v-hasPermi="['fishing:catch:feature']">{{ s.row.isFeatured?'取消精选':'设精选' }}</el-button>
          <el-button link type="danger" icon="Delete" @click="doDelete(s.row)" v-hasPermi="['fishing:catch:remove']" />
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="FishCatch">
import { listCatch, auditCatch, featureCatch, delCatch } from '@/api/fishing/catch'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), total = ref(0), showSearch = ref(true), ids = ref([])
const queryParams = ref({ pageNum:1, pageSize:10, status:null, fishSpecies:null })

function getList() { loading.value=true; listCatch(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function handleQuery() { queryParams.value.pageNum=1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function doAudit(row, st) { auditCatch({catchId:row.catchId,status:st,rejectReason:''}).then(()=>{proxy.$modal.msgSuccess(st===1?'已通过':'已拒绝');getList()}) }
function doFeature(row) { featureCatch({catchId:row.catchId,featured:!row.isFeatured}).then(()=>{proxy.$modal.msgSuccess('操作成功');getList()}) }
function doDelete(row) { proxy.$modal.confirm('确认删除？').then(()=>delCatch([row.catchId])).then(()=>{getList();proxy.$modal.msgSuccess('删除成功')}) }
getList()
</script>
