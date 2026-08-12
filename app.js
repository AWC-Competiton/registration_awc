const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const provinces = ["ភ្នំពេញ","បន្ទាយមានជ័យ","បាត់ដំបង","កំពង់ចាម","កំពង់ឆ្នាំង","កំពង់ស្ពឺ","កំពង់ធំ","កំពត","កណ្តាល","កោះកុង","ក្រចេះ","ព្រះវិហារ","ព្រៃវែង","ពោធិ៍សាត់","រតនគិរី","សៀមរាប","ព្រះសីហនុ","ស្ទឹងត្រែង","ស្វាយរៀង","តាកែវ","ឧត្តរមានជ័យ","កែប","ប៉ៃលិន","ត្បូងឃ្មុំ"];
const provinceEl = document.getElementById("province");
provinceEl.innerHTML = '<option value="">-- ជ្រើសរើសរាជធានី/ខេត្ត --</option>' +
  provinces.map(p => `<option value="${p}">${p}</option>`).join("");

document.getElementById("paymentText").textContent = REGISTRATION_FEE_TEXT;
const khqr = document.getElementById("khqrImage");
if (candidate/photo_2026-08-12_12-12-31.jpg && !candidate/photo_2026-08-12_12-12-31.jpg.startsWith("YOUR_")) khqr.src = candidate/photo_2026-08-12_12-12-31.jpg;
else { khqr.classList.add("hidden"); document.getElementById("khqrMissing").classList.remove("hidden"); }

const form = document.getElementById("registrationForm");
const alertBox = document.getElementById("alert");
const success = document.getElementById("success");
const btn = document.getElementById("submitBtn");

function showError(msg){ alertBox.textContent=msg; alertBox.classList.remove("hidden"); }
function safeName(name){ return name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,80); }

form.addEventListener("submit", async (e)=>{
  e.preventDefault(); alertBox.classList.add("hidden"); success.classList.add("hidden");
  btn.disabled=true; btn.textContent="កំពុងដាក់ពាក្យ...";

  try{
    if(SUPABASE_URL.startsWith("YOUR_") || SUPABASE_ANON_KEY.startsWith("YOUR_"))
      throw new Error("សូមកំណត់ SUPABASE_URL និង SUPABASE_ANON_KEY ក្នុង config.js ជាមុនសិន។");

    const file = document.getElementById("receipt").files[0];
    if(!file) throw new Error("សូម Upload វិក្កយបត្រ។");
    if(file.size > 5*1024*1024) throw new Error("ឯកសារធំជាង 5MB។");

    const allowed = ["image/jpeg","image/png","image/webp","application/pdf"];
    if(!allowed.includes(file.type)) throw new Error("ប្រភេទឯកសារមិនត្រឹមត្រូវ។");

    const registrationNumber = "REG-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(100+Math.random()*900);
    const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
    const path = `${registrationNumber}/${Date.now()}-${safeName(file.name.replace(/\.[^.]+$/,""))}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage.from("receipts").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError) throw uploadError;

    const { error: dbError } = await supabaseClient.from("registrations").insert({
      registration_number: registrationNumber,
      full_name: document.getElementById("full_name").value.trim(),
      gender: document.getElementById("gender").value,
      grade: document.getElementById("grade").value,
      school_name: document.getElementById("school_name").value.trim(),
      province: document.getElementById("province").value,
      receipt_path: path,
      payment_status: "pending",
      registration_status: "pending"
    });
    if(dbError) throw dbError;

    form.classList.add("hidden");
    success.innerHTML = `ការចុះឈ្មោះបានជោគជ័យ!<br>លេខចុះឈ្មោះរបស់អ្នក:<br><strong>${registrationNumber}</strong><br><br>សូមរក្សាលេខនេះទុក។ Admin នឹងពិនិត្យការបង់ប្រាក់។`;
    success.classList.remove("hidden");
  }catch(err){
    console.error(err);
    showError("បរាជ័យ: " + (err.message || "មានបញ្ហាមិនស្គាល់"));
  }finally{
    btn.disabled=false; btn.textContent="ដាក់ពាក្យចុះឈ្មោះ";
  }
});
