import { readData, writeData }
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let bmTieuDe, bmTen, bmLink;
let table, btnThem, btnLuu, btnXoa;
let previewYT, previewMP4;

let editId = null;

/* ========= DOM ========= */
function getDOM() {
  bmTieuDe = document.getElementById("bmTieuDe");
  bmTen    = document.getElementById("bmTen");
  bmLink   = document.getElementById("bmLink");

  previewYT  = document.getElementById("bmPreviewYT");
  previewMP4 = document.getElementById("bmPreviewMP4");

  table   = document.getElementById("baimauTable");
  btnThem = document.getElementById("btnThem");
  btnLuu  = document.getElementById("btnLuu");
  btnXoa  = document.getElementById("btnXoa");
}

/* ========= PREVIEW ========= */
function updatePreview(link){
  previewYT.style.display="none";
  previewMP4.style.display="none";
  previewYT.src="";
  previewMP4.src="";

  if(!link) return;

  // YouTube
  if(link.includes("youtube") || link.includes("youtu.be")){
    let id="";
    if(link.includes("v=")){
      id=link.split("v=")[1].split("&")[0];
    }else if(link.includes("youtu.be/")){
      id=link.split("youtu.be/")[1];
    }
    if(id){
      previewYT.src=`https://www.youtube.com/embed/${id}`;
      previewYT.style.display="block";
    }
  }
  // MP4
  else if(link.endsWith(".mp4")){
    previewMP4.src=link;
    previewMP4.style.display="block";
  }
}

/* ========= LOAD TABLE ========= */
async function loadTable(){
  table.innerHTML="";
  const data = await readData("baimau");
  if(!data) return;

  let stt=1;
  Object.entries(data).forEach(([id,v])=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${stt++}</td>
      <td>${v.tieude||""}</td>
      <td>${v.ten||""}</td>
      <td>${v.link||""}</td>
    `;
    tr.onclick=()=>selectRow(id,v);
    table.appendChild(tr);
  });
}

/* ========= SELECT ========= */
function selectRow(id,v){
  editId=id;

  bmTieuDe.value=v.tieude||"";
  bmTen.value   =v.ten||"mau1";
  bmLink.value  =v.link||"";

  updatePreview(bmLink.value);

  btnThem.style.display="none";
  btnLuu.style.display="inline-block";
  btnXoa.style.display="inline-block";
}

/* ========= CLEAR ========= */
function clearForm(){
  editId=null;

  bmTieuDe.value="";
  bmTen.value="mau1";
  bmLink.value="";

  previewYT.style.display="none";
  previewMP4.style.display="none";

  btnThem.style.display="inline-block";
  btnLuu.style.display="none";
  btnXoa.style.display="none";
}

/* ========= SAVE ========= */
async function save(isEdit=false){
  if(!bmTieuDe.value || !bmLink.value){
    showToast("Thiếu tiêu đề hoặc link","error");
    return;
  }

  const id = editId || ("bm_"+Date.now());

  await writeData(`baimau/${id}`,{
    tieude: bmTieuDe.value,
    ten   : bmTen.value,
    link  : bmLink.value,
    updated_at: Date.now()
  });

  clearForm();
  loadTable();
  showToast(isEdit?"Đã cập nhật":"Đã thêm");
}

/* ========= INIT ========= */
export async function init(){
  getDOM();

  bmLink.oninput=()=>updatePreview(bmLink.value.trim());

  await loadTable();

  btnThem.onclick=()=>save(false);
  btnLuu.onclick =()=>save(true);
  btnXoa.onclick =async()=>{
    if(!editId || !confirm("Xóa bài giảng mẫu này?")) return;
    await writeData(`baimau/${editId}`,null);
    clearForm(); loadTable();
    showToast("Đã xóa");
  };
}
