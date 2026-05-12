<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['fishing:competition:add']">新增比赛</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="ID" prop="compId" width="70" align="center" />
      <el-table-column label="比赛名称" prop="title" align="center" />
      <el-table-column label="日期" prop="compDate" width="120" align="center" />
      <el-table-column label="时段" prop="timeSlot" width="120" align="center" />
      <el-table-column label="目标鱼种" prop="fishSpecies" width="100" align="center" />
      <el-table-column label="奖池(元)" width="100" align="center">
        <template #default="s">{{ ((s.row.prizePoolCents||0)/100).toFixed(0) }}</template>
      </el-table-column>
      <el-table-column label="参赛" width="80" align="center">
        <template #default="s">{{ s.row.entryCount||0 }}{{ s.row.maxPlayers?'/'+s.row.maxPlayers:'' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="s"><el-tag :type="{0:'',1:'warning',2:'warning',3:'success',4:'danger'}[s.row.status]">{{ {0:'报名中',1:'进行中',2:'称重中',3:'已结束',4:'已取消'}[s.row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center">
        <template #default="s">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['fishing:competition:edit']">修改</el-button>
          <el-button v-if="s.row.status<3" link type="warning" @click="nextStatus(s.row)" v-hasPermi="['fishing:competition:edit']">推进</el-button>
          <el-button v-if="s.row.status===2" link type="success" @click="doSettle(s.row)" v-hasPermi="['fishing:competition:settle']">结算发奖</el-button>
          <el-button link type="primary" @click="viewEntries(s.row)">选手</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改 -->
    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="比赛名称" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="比赛日期" prop="compDate"><el-date-picker v-model="form.compDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="时段"><el-input v-model="form.timeSlot" placeholder="如 06:00-12:00" /></el-form-item>
        <el-form-item label="目标鱼种"><el-input v-model="form.fishSpecies" /></el-form-item>
        <el-form-item label="最大人数"><el-input-number v-model="form.maxPlayers" :min="0" /></el-form-item>
        <el-form-item label="报名费(分)"><el-input-number v-model="form.entryFeeCents" :min="0" /></el-form-item>
        <el-form-item label="奖池(分)"><el-input-number v-model="form.prizePoolCents" :min="0" /></el-form-item>
        <el-form-item label="奖金规则"><el-input v-model="form.prizeRules" type="textarea" :rows="2" placeholder='[{"rank":1,"amount":5000},{"rank":2,"amount":3000}]' /></el-form-item>
        <el-form-item label="比赛规则"><el-input v-model="form.rules" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open=false">取 消</el-button></template>
    </el-dialog>

    <!-- 选手列表+称重 -->
    <el-dialog title="参赛选手" v-model="entryOpen" width="700px" append-to-body>
      <el-table :data="entries">
        <el-table-column label="昵称" prop="nickname" width="100" />
        <el-table-column label="手机" prop="phone" width="130" />
        <el-table-column label="重量(g)" width="120">
          <template #default="s">
            <el-input-number v-if="s.row.status<2" v-model="s.row.weightGram" :min="0" size="small" />
            <span v-else>{{ s.row.weightGram }}</span>
          </template>
        </el-table-column>
        <el-table-column label="尾数" width="80">
          <template #default="s">
            <el-input-number v-if="s.row.status<2" v-model="s.row.fishCount" :min="0" size="small" />
            <span v-else>{{ s.row.fishCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="排名" prop="ranking" width="70" />
        <el-table-column label="奖金(元)" width="90">
          <template #default="s">{{ s.row.prizeCents ? ((s.row.prizeCents)/100).toFixed(0) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="s">
            <el-button v-if="s.row.status<2" link type="primary" @click="doWeigh(s.row)" v-hasPermi="['fishing:competition:weigh']">称重</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="Competition">
import { listCompetition, getCompetition, addCompetition, updateCompetition, changeCompStatus, weighEntry, settleCompetition } from '@/api/fishing/competition'
const { proxy } = getCurrentInstance()
const loading = ref(true), list = ref([]), total = ref(0), showSearch = ref(true)
const open = ref(false), title = ref(''), form = ref({}), entryOpen = ref(false), entries = ref([])
const queryParams = ref({ pageNum:1, pageSize:20 })
const rules = { title:[{required:true,message:'请输入名称',trigger:'blur'}], compDate:[{required:true,message:'请选择日期',trigger:'change'}] }

function getList() { loading.value=true; listCompetition(queryParams.value).then(r=>{list.value=r.rows;total.value=r.total;loading.value=false}) }
function reset() { form.value={maxPlayers:0,entryFeeCents:0,prizePoolCents:0} }
function handleAdd() { reset(); open.value=true; title.value='新增比赛' }
function handleUpdate(row) { getCompetition(row.compId).then(r=>{form.value=r.data;open.value=true;title.value='修改比赛'}) }
function submitForm() { proxy.$refs.formRef.validate(v=>{if(!v)return;if(form.value.compId){updateCompetition(form.value).then(()=>{proxy.$modal.msgSuccess('修改成功');open.value=false;getList()})}else{addCompetition(form.value).then(()=>{proxy.$modal.msgSuccess('新增成功');open.value=false;getList()})}}) }
function nextStatus(row) { const next=row.status+1; proxy.$modal.confirm(`推进到「${['','进行中','称重中','已结束'][next]}」？`).then(()=>changeCompStatus(row.compId,next)).then(()=>{proxy.$modal.msgSuccess('已推进');getList()}) }
function doSettle(row) { proxy.$modal.confirm('确认结算并发奖？奖金将打入选手钱包。').then(()=>settleCompetition(row.compId)).then(()=>{proxy.$modal.msgSuccess('结算完成');getList()}) }
function viewEntries(row) { getCompetition(row.compId).then(r=>{entries.value=r.data.entries||[];entryOpen.value=true}) }
function doWeigh(entry) { weighEntry({entryId:entry.entryId,weightGram:entry.weightGram||0,fishCount:entry.fishCount||0}).then(()=>{proxy.$modal.msgSuccess('称重成功');entry.status=2}) }
getList()
</script>
