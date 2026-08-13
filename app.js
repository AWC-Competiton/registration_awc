const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const provinces = [
  "ភ្នំពេញ",
  "បន្ទាយមានជ័យ",
  "បាត់ដំបង",
  "កំពង់ចាម",
  "កំពង់ឆ្នាំង",
  "កំពង់ស្ពឺ",
  "កំពង់ធំ",
  "កំពត",
  "កណ្តាល",
  "កោះកុង",
  "ក្រចេះ",
  "ព្រះវិហារ",
  "ព្រៃវែង",
  "ពោធិ៍សាត់",
  "រតនគិរី",
  "សៀមរាប",
  "ព្រះសីហនុ",
  "ស្ទឹងត្រែង",
  "ស្វាយរៀង",
  "តាកែវ",
  "ឧត្តរមានជ័យ",
  "កែប",
  "ប៉ៃលិន",
  "ត្បូងឃ្មុំ"
];

const provinceEl = document.getElementById("province");

provinceEl.innerHTML =
  '<option value="">-- ជ្រើសរើសរាជធានី/ខេត្ត --</option>' +
  provinces
    .map(p => `<option value="${p}">${p}</option>`)
    .join("");

// Registration fee
document.getElementById("paymentText").textContent =
  REGISTRATION_FEE_TEXT;

// ==============================
// FORM
// ==============================

const form =
  document.getElementById("registrationForm");

const alertBox =
  document.getElementById("alert");

const success =
  document.getElementById("success");

const btn =
  document.getElementById("submitBtn");

// ==============================
// SHOW ERROR
// ==============================

function showError(msg) {
  alertBox.textContent = msg;
  alertBox.classList.remove("hidden");
}

// ==============================
// SAFE FILE NAME
// ==============================

function safeName(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

// ==============================
// SUBMIT FORM
// ==============================

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  alertBox.classList.add("hidden");
  success.classList.add("hidden");

  btn.disabled = true;
  btn.textContent = "កំពុងដាក់ពាក្យ...";

  try {

    // ==========================
    // CHECK SUPABASE CONFIG
    // ==========================

    if (
      SUPABASE_URL.startsWith("YOUR_") ||
      SUPABASE_ANON_KEY.startsWith("YOUR_")
    ) {
      throw new Error(
        "សូមកំណត់ SUPABASE_URL និង SUPABASE_ANON_KEY ក្នុង config.js ជាមុនសិន។"
      );
    }

    // ==========================
    // GET RECEIPT FILE
    // ==========================

    const file =
      document.getElementById("receipt").files[0];

    if (!file) {
      throw new Error(
        "សូម Upload វិក្កយបត្រ។"
      );
    }

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        "ឯកសារធំជាង 5MB។"
      );
    }

    // ==========================
    // CHECK FILE TYPE
    // ==========================

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf"
    ];

    if (!allowed.includes(file.type)) {
      throw new Error(
        "ប្រភេទឯកសារមិនត្រឹមត្រូវ។ សូម Upload JPG, PNG, WEBP ឬ PDF។"
      );
    }

    // ==========================
    // GENERATE REGISTRATION NUMBER
    // ==========================

    const registrationNumber =
      "REG-" +
      Date.now()
        .toString(36)
        .toUpperCase() +
      "-" +
      Math.floor(100 + Math.random() * 900);

    // ==========================
    // FILE EXTENSION
    // ==========================

    const ext =
      file.name.includes(".")
        ? file.name
            .split(".")
            .pop()
            .toLowerCase()
        : "bin";

    // ==========================
    // FILE NAME
    // ==========================

    const originalName =
      file.name.replace(/\.[^.]+$/, "");

    const path =
      `${registrationNumber}/${Date.now()}-${safeName(originalName)}.${ext}`;

    // ==========================
    // UPLOAD RECEIPT TO SUPABASE
    // ==========================

    const {
      error: uploadError
    } = await supabaseClient.storage
      .from("receipts")
      .upload(
        path,
        file,
        {
          contentType: file.type,
          upsert: false
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    // ==========================
    // SAVE REGISTRATION
    // ==========================

    const {
      error: dbError
    } = await supabaseClient
      .from("registrations")
      .insert({

        registration_number:
          registrationNumber,

        // ==========================
        // KHMER NAME
        // ==========================

        full_name:
          document
            .getElementById("full_name")
            .value
            .trim(),

        // ==========================
        // LATIN NAME - NEW
        // ==========================

        latin_name:
          document
            .getElementById("latin_name")
            .value
            .trim(),

        // ==========================
        // GENDER
        // ==========================

        gender:
          document
            .getElementById("gender")
            .value,

        // ==========================
        // GRADE
        // ==========================

        grade:
          document
            .getElementById("grade")
            .value,

        // ==========================
        // SCHOOL
        // ==========================

        school_name:
          document
            .getElementById("school_name")
            .value
            .trim(),

        // ==========================
        // PROVINCE
        // ==========================

        province:
          document
            .getElementById("province")
            .value,

        // ==========================
        // RECEIPT
        // ==========================

        receipt_path:
          path,

        // ==========================
        // PAYMENT STATUS
        // ==========================

        payment_status:
          "pending",

        // ==========================
        // REGISTRATION STATUS
        // ==========================

        registration_status:
          "pending"
      });

    if (dbError) {
      throw dbError;
    }

    // ==========================
    // SUCCESS
    // ==========================

    form.classList.add("hidden");

    success.innerHTML = `
      ការចុះឈ្មោះបានជោគជ័យ!
      <br><br>

      លេខចុះឈ្មោះរបស់អ្នក:
      <br>

      <strong>
        ${registrationNumber}
      </strong>

      <br><br>

      សូមរក្សាលេខនេះទុក។
      <br>

      Admin នឹងពិនិត្យការបង់ប្រាក់។
    `;

    success.classList.remove("hidden");

  } catch (err) {

    console.error(err);

    showError(
      "បរាជ័យ: " +
      (err.message || "មានបញ្ហាមិនស្គាល់")
    );

  } finally {

    btn.disabled = false;

    btn.textContent =
      "ដាក់ពាក្យចុះឈ្មោះ";
  }
});

const selectedGrade = document.getElementById("grade").value;
const telegramLink = TELEGRAM_LINKS[selectedGrade];

success.innerHTML = `
    <h2>✅ ការចុះឈ្មោះបានជោគជ័យ!</h2>

    <p>លេខចុះឈ្មោះរបស់អ្នក:</p>

    <strong>${registrationNumber}</strong>

    <p>
        សូមរក្សាលេខចុះឈ្មោះនេះទុក។
        Admin នឹងពិនិត្យការបង់ប្រាក់របស់អ្នក។
    </p>

    <a
        href="${telegramLink}"
        target="_blank"
        rel="noopener noreferrer"
        class="telegram-btn"
    >
        📲 ចូល Telegram ថ្នាក់ ${selectedGrade}
    </a>
`;
