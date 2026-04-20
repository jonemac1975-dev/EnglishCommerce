import { readData, writeData }
from "../../../scripts/services/firebaseService.js";

let gvTen, gvMon, gvThang, gvThanhTich;
let gvImgFile, gvImgPreview, btnXoaAnh;
let table, btnThem, btnLuu, btnXoa;

let gvMap = {}, monMap = {};
let currentImg = "", editId = null;

/* ========= DOM ========= */
function getDOM() {
  gvImgFile    = document.getElementById("gvImgFile");
  gvImgPreview = document.getElementById("gvImgPreview");
  btnXoaAnh    = document.getElementById("btnXoaAnh");

  gvTen        = document.getElementById("gvTen");
  gvMon        = document.getElementById("gvMon");
  gvThang      = document.getElementById("gvThang");
  gvThanhTich  = document.getElementById("gvThanhTich");

  table        = document.getElementById("gvTable");

  btnThem = document.getElementById("btnThem");
  btnLuu  = document.getElementById("btnLuu");
  btnXoa  = document.getElementById("btnXoa");
}

/* ========= TOAST ========= */
function showToast(msg,type="success"){
  const t=document.getElementById("toast");
  if(!t)return;
  t.textContent=msg;
  t.className=`toast show ${type}`;
  setTimeout(()=>t.classList.remove("show"),2500);
}

/* ========= LOAD SELECT ========= */
async function loadSelect() {
  // giáo viên
  const gv = await readData("users/teachers");
  gvTen.innerHTML = `<option value="">-- chọn giáo viên --</option>`;
  gvMap = {};
  if (gv) Object.entries(gv).forEach(([id,v])=>{
    const name=v.profile?.ho_ten||id;
    gvMap[id]=name;
    gvTen.innerHTML+=`<option value="${id}">${name}</option>`;
  });

  // môn học
  const mon = await readData("config/danh_muc/monhoc");
  gvMon.innerHTML = `<option value="">-- chọn môn --</option>`;
  monMap = {};
  if (mon) Object.entries(mon).forEach(([id,v])=>{
    monMap[id]=v.name||id;
    gvMon.innerHTML+=`<option value="${id}">${v.name}</option>`;
  });
}

/* ========= ẢNH ========= */
function bindImg() {
  gvImgFile.onchange=()=>{
    const f=gvImgFile.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=e=>{
      currentImg=e.target.result;
      gvImgPreview.src=currentImg;
      gvImgPreview.style.display="block";
      btnXoaAnh.style.display="inline-block";
    };
    r.readAsDataURL(f);
  };
  btnXoaAnh.onclick=()=>{
    currentImg="";
    gvImgFile.value="";
    gvImgPreview.style.display="none";
    btnXoaAnh.style.display="none";
  };
}

/* ========= SAVE ========= */
async function save(isEdit=false){
  if(!gvTen.value||!gvMon.value||!gvThang.value){
    showToast("Thiếu thông tin","error");return;
  }
  const id=editId||("gv_"+Date.now());
  await writeData(`tieubieu/giaovien/${id}`,{
    img:currentImg||"",
    giaovien:gvTen.value,
    mon:gvMon.value,
    thang:gvThang.value,
    thanhtich:gvThanhTich.value,
    updated_at:Date.now()
  });
  clearForm(); loadTable();
  showToast(isEdit?"Đã cập nhật":"Đã thêm");
}

/* ========= LOAD TABLE ========= */
async function loadTable(){
  table.innerHTML="";
  const data=await readData("tieubieu/giaovien");
  if(!data)return;
  let stt=1;
  Object.entries(data).forEach(([id,v])=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${stt++}</td>
      <td>${gvMap[v.giaovien]||""}</td>
      <td>${monMap[v.mon]||""}</td>
      <td>${v.thang}</td>
      <td>${v.thanhtich||""}</td>`;
    tr.onclick=()=>{
      editId=id;
      gvTen.value=v.giaovien;
      gvMon.value=v.mon;
      gvThang.value=v.thang;
      gvThanhTich.value=v.thanhtich||"";
      currentImg=v.img||"";
      if(currentImg){
        gvImgPreview.src=currentImg;
        gvImgPreview.style.display="block";
        btnXoaAnh.style.display="inline-block";
      }
      btnThem.style.display="none";
      btnLuu.style.display="inline-block";
      btnXoa.style.display="inline-block";
    };
    table.appendChild(tr);
  });
}

function clearForm(){
  editId=null;
  gvThang.value=gvThanhTich.value="";
  gvImgFile.value="";
  gvImgPreview.style.display="none";
  btnThem.style.display="inline-block";
  btnLuu.style.display="none";
  btnXoa.style.display="none";
}

/* ========= INIT ========= */
export async function init(){
  getDOM();
  bindImg();
  await loadSelect();
  await loadTable();
  btnThem.onclick=()=>save(false);
  btnLuu.onclick =()=>save(true);
  btnXoa.onclick =async()=>{
    if(!editId||!confirm("Xóa?"))return;
    await writeData(`tieubieu/giaovien/${editId}`,null);
    clearForm(); loadTable(); showToast("Đã xóa");
  };
}
