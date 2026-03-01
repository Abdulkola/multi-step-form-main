const STORAGE_KEY = "multiStepFormData";

const routes = {
  personal: "index.html",
  plan: "select-plan.html",
  addons: "add-ons.html",
  summary: "summary.html",
  thankYou: "thank-you.html"
};

const planPrices = {
  arcade: { monthly: 9, yearly: 90 },
  advanced: { monthly: 12, yearly: 120 },
  pro: { monthly: 15, yearly: 150 }
};

const addonPrices = {
  "online-service": { monthly: 1, yearly: 10 },
  "larger-storage": { monthly: 2, yearly: 20 },
  "customizable-profile": { monthly: 2, yearly: 20 }
};

function getCurrentPage() {
  const fileName = window.location.pathname.split("/").pop();
  return fileName || routes.personal;
}

function getDefaultState() {
  return {
    name: "",
    email: "",
    phone: "",
    plan: "arcade",
    billing: "monthly",
    addons: []
  };
}

function getState() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return { ...getDefaultState(), ...parsed };
  } catch {
    return getDefaultState();
  }
}

function setState(nextState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function navigateTo(page) {
  window.location.href = page;
}

function formatPrice(value, billing) {
  const duration = billing === "yearly" ? "yr" : "mo";
  return `$${value}/${duration}`;
}

function updateBillingUI() {
  const billingToggle = document.getElementById("billing-period");
  const monthlyLabel = document.getElementById("monthly-label");
  const yearlyLabel = document.getElementById("yearly-label");

  if (!billingToggle || !monthlyLabel || !yearlyLabel) {
    return;
  }

  const isYearly = billingToggle.checked;
  monthlyLabel.classList.toggle("billing-toggle__label--active", !isYearly);
  yearlyLabel.classList.toggle("billing-toggle__label--active", isYearly);

  const period = isYearly ? "yearly" : "monthly";
  document.querySelectorAll(".plan-option__price").forEach((node) => {
    node.textContent = node.dataset[period];
  });

  document.querySelectorAll(".plan-option__discount").forEach((node) => {
    node.hidden = !isYearly;
  });
}

function hydratePersonalInfoPage() {
  const form = document.getElementById("personal-info-form");
  if (!form) {
    return;
  }

  const data = getState();
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");

  nameInput.value = data.name;
  emailInput.value = data.email;
  phoneInput.value = data.phone;

  function setFieldError(fieldId, message) {
    const error = document.getElementById(`${fieldId}-error`);
    if (error) {
      error.textContent = message;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let isValid = true;

    if (!nameInput.value.trim()) {
      setFieldError("name", "This field is required");
      isValid = false;
    } else {
      setFieldError("name", "");
    }

    if (!emailInput.value.trim()) {
      setFieldError("email", "This field is required");
      isValid = false;
    } else if (!emailInput.validity.valid) {
      setFieldError("email", "Please enter a valid email");
      isValid = false;
    } else {
      setFieldError("email", "");
    }

    if (!phoneInput.value.trim()) {
      setFieldError("phone", "This field is required");
      isValid = false;
    } else {
      setFieldError("phone", "");
    }

    if (!isValid) {
      return;
    }

    setState({
      ...data,
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim()
    });

    navigateTo(routes.plan);
  });
}

function hydratePlanPage() {
  const form = document.getElementById("plan-form");
  if (!form) {
    return;
  }

  const data = getState();
  const backButton = document.getElementById("plan-back");
  const billingToggle = document.getElementById("billing-period");
  const planError = document.getElementById("plan-error");

  const selectedPlan = form.querySelector(`input[name='plan'][value='${data.plan}']`);
  if (selectedPlan) {
    selectedPlan.checked = true;
  }

  billingToggle.checked = data.billing === "yearly";
  updateBillingUI();

  backButton.addEventListener("click", () => navigateTo(routes.personal));

  billingToggle.addEventListener("change", updateBillingUI);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const picked = form.querySelector("input[name='plan']:checked");
    if (!picked) {
      planError.textContent = "Please select a plan";
      return;
    }

    planError.textContent = "";

    setState({
      ...data,
      plan: picked.value,
      billing: billingToggle.checked ? "yearly" : "monthly"
    });

    navigateTo(routes.addons);
  });
}

function hydrateAddonsPage() {
  const form = document.getElementById("addons-form");
  if (!form) {
    return;
  }

  const data = getState();
  const backButton = document.getElementById("addons-back");

  form.querySelectorAll("input[name='addons']").forEach((checkbox) => {
    checkbox.checked = data.addons.includes(checkbox.value);
  });

  const period = data.billing === "yearly" ? "yearly" : "monthly";
  document.querySelectorAll(".addon__price").forEach((node) => {
    node.textContent = node.dataset[period];
  });

  backButton.addEventListener("click", () => navigateTo(routes.plan));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const pickedAddons = Array.from(form.querySelectorAll("input[name='addons']:checked")).map(
      (checkbox) => checkbox.value
    );

    setState({
      ...data,
      addons: pickedAddons
    });

    navigateTo(routes.summary);
  });
}

function hydrateSummaryPage() {
  const form = document.getElementById("summary-form");
  if (!form) {
    return;
  }

  const data = getState();
  if (!data.plan) {
    navigateTo(routes.plan);
    return;
  }

  const backButton = document.getElementById("summary-back");
  const changePlanButton = document.getElementById("change-plan");

  const summaryPlanName = document.querySelector(".summary__plan-name");
  const summaryPlanPrice = document.querySelector(".summary__plan-price");
  const summaryAddons = document.getElementById("summary-addons");
  const summaryTotalLabel = document.querySelector(".summary__total-label");
  const summaryTotalPrice = document.querySelector(".summary__total-price");

  const planCost = planPrices[data.plan][data.billing];
  const planLabel = `${data.plan.charAt(0).toUpperCase()}${data.plan.slice(1)} (${data.billing === "yearly" ? "Yearly" : "Monthly"})`;

  summaryPlanName.textContent = planLabel;
  summaryPlanPrice.textContent = formatPrice(planCost, data.billing);

  summaryAddons.innerHTML = "";
  let addonsTotal = 0;

  data.addons.forEach((addonName) => {
    const addonCost = addonPrices[addonName][data.billing];
    addonsTotal += addonCost;

    const row = document.createElement("div");
    row.className = "summary__item";

    const nameNode = document.createElement("span");
    nameNode.className = "summary__total-label";
    nameNode.textContent = addonName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const priceNode = document.createElement("span");
    priceNode.className = "summary__plan-price";
    priceNode.textContent = `+$${addonCost}/${data.billing === "yearly" ? "yr" : "mo"}`;

    row.append(nameNode, priceNode);
    summaryAddons.appendChild(row);
  });

  const total = planCost + addonsTotal;
  summaryTotalLabel.textContent = `Total (per ${data.billing === "yearly" ? "year" : "month"})`;
  summaryTotalPrice.textContent = `+$${total}/${data.billing === "yearly" ? "yr" : "mo"}`;

  backButton.addEventListener("click", () => navigateTo(routes.addons));
  changePlanButton.addEventListener("click", () => navigateTo(routes.plan));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    navigateTo(routes.thankYou);
  });
}

function hydrateThankYouPage() {
  if (!document.getElementById("thank-you-state")) {
    return;
  }

  sessionStorage.removeItem(STORAGE_KEY);
}

const currentPage = getCurrentPage();

if (currentPage === routes.personal) {
  hydratePersonalInfoPage();
}

if (currentPage === routes.plan) {
  hydratePlanPage();
}

if (currentPage === routes.addons) {
  hydrateAddonsPage();
}

if (currentPage === routes.summary) {
  hydrateSummaryPage();
}

if (currentPage === routes.thankYou) {
  hydrateThankYouPage();
}
