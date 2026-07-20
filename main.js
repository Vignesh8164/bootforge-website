/* ==========================================================================
   BOOTFORGE INTERACTIVE ENGINE — GSAP + SCROLLTRIGGER & PAYPAL CHECKOUT
   Aesthetics: Red Crimson Glassmorphism & Soft Charcoal Neumorphism
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initGSAPAnimations();
  initBootSimulator();
  initGlassParallax();
  initDiagnosticsCalculator();
  initAppwriteSDK();
  initPayPalCheckout();
  initTabSync();
});

/* 1. GSAP & ScrollTrigger Motion */
function initGSAPAnimations() {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.hero-headline-multiline', {
      duration: 1.2,
      y: 40,
      opacity: 0,
      ease: 'power3.out',
      delay: 0.2
    });

    gsap.from('.hero-body, .neu-pill-btn, .neu-pill-btn-outline', {
      duration: 1,
      y: 30,
      opacity: 0,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 0.5
    });

    gsap.from('#hero-3d-card', {
      duration: 1.2,
      scale: 0.92,
      opacity: 0,
      ease: 'power3.out',
      delay: 0.4
    });

    gsap.utils.toArray('.glass-card-num').forEach((card, index) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%'
        },
        duration: 0.8,
        y: 40,
        opacity: 0,
        delay: index * 0.1,
        ease: 'power2.out'
      });
    });

    gsap.utils.toArray('.process-card').forEach((card, index) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%'
        },
        duration: 0.8,
        y: 30,
        opacity: 0,
        delay: index * 0.15,
        ease: 'power2.out'
      });
    });

    gsap.from('.apk-download-panel', {
      scrollTrigger: {
        trigger: '.apk-download-panel',
        start: 'top 85%'
      },
      duration: 1,
      y: 40,
      opacity: 0,
      ease: 'power3.out'
    });
  }
}

/* 2. Interactive Boot Sequence Simulator */
function initBootSimulator() {
  const stepItems = document.querySelectorAll('.neu-step-item');
  const terminalBody = document.getElementById('terminal-body');
  const statusText = document.getElementById('term-status-text');
  const progressPercent = document.getElementById('term-progress-percent');
  const progressFill = document.getElementById('term-progress-fill');

  const stepData = {
    1: {
      title: "Step 01 / USB Access & Hardware Grant",
      percent: "16%",
      logs: [
        { prefix: "Requesting access...", text: "", type: "normal" },
        { prefix: "[00:10:40]", text: "USB access granted.", type: "success" },
        { prefix: "[00:10:41]", text: "USB ready: SanDisk 3.2Gen1 (14.61 GB)", type: "highlight" },
        { prefix: "[00:11:03]", text: "Claiming USB interface (userspace SCSI over Bulk-Only Transport)...", type: "normal" },
        { prefix: "[00:11:03]", text: "USB transport: libusb", type: "highlight" }
      ]
    },
    2: {
      title: "Step 02 / ISO Analysis & Media Mode",
      percent: "33%",
      logs: [
        { prefix: "[00:10:46]", text: "ISO selected: Win11_25H2_English_x64_v2.iso (7.89 GB)", type: "highlight" },
        { prefix: "[00:10:46]", text: "Image type: plain ISO9660/UDF (standard Windows ISO).", type: "normal" },
        { prefix: "[00:10:46]", text: "Windows-media mode selected: drive is partitioned & formatted, ISO files copied (Rufus & Microsoft MCT style). Boots in UEFI mode.", type: "normal" },
        { prefix: "[00:11:03]", text: "Reading ISO file table (UDF / ISO9660)...", type: "normal" },
        { prefix: "[00:11:03]", text: "ISO contains 976 files: 846.8 MB FAT32-safe, large: \\sources\\install.wim (7.06 GB)", type: "warning" }
      ]
    },
    3: {
      title: "Step 03 / Dual-Partition Planning",
      percent: "50%",
      logs: [
        { prefix: "[00:11:03]", text: "Planning FAT32 boot partition (1.01 GB)...", type: "normal" },
        { prefix: "[00:11:03]", text: "Planning exFAT data partition (13.59 GB) for large files...", type: "highlight" },
        { prefix: "[00:11:04]", text: "Writing filesystem structures (4.4 MB)...", type: "success" },
        { prefix: "[00:11:04]", text: "Dual partition table created: FAT32 Boot + exFAT Data Target", type: "success" }
      ]
    },
    4: {
      title: "Step 04 / File Copy & Write Stream",
      percent: "75%",
      logs: [
        { prefix: "[00:11:04]", text: "Starting: Windows media creation (partition -> format -> copy files -> verify)", type: "normal" },
        { prefix: "[00:11:04]", text: "Copying 976 files (7.88 GB)...", type: "highlight" },
        { prefix: "[00:16:40]", text: "Progress: 50% [==========          ] \\sources\\install.wim (3.9 GB)", type: "warning" },
        { prefix: "[00:22:33]", text: "Copy complete (11.7 MB/s avg). Total copy time: ~11 min 29 sec.", type: "success" }
      ]
    },
    5: {
      title: "Step 05 / Filesystem Verification",
      percent: "90%",
      logs: [
        { prefix: "[00:22:33]", text: "Verifying filesystem structures...", type: "normal" },
        { prefix: "[00:22:33]", text: "Verifying file contents against the ISO image (5 min 28 sec pass)...", type: "normal" },
        { prefix: "[00:28:01]", text: "Windows installation USB created and verified.", type: "success" }
      ]
    },
    6: {
      title: "Step 06 / UEFI Boot Layout Ready",
      percent: "100%",
      logs: [
        { prefix: "[00:28:01]", text: "Layout: FAT32 boot partition + exFAT partition holding large image file(s).", type: "highlight" },
        { prefix: "[00:28:01]", text: "Boot the PC in UEFI mode; Setup finds install.wim on the second partition.", type: "success" },
        { prefix: "[00:28:01]", text: "Total process time: 17 min 21 sec. Status: Done.", type: "success" }
      ]
    }
  };

  function activateStep(stepNum) {
    stepItems.forEach(card => {
      if (card.dataset.step == stepNum) card.classList.add('active');
      else card.classList.remove('active');
    });

    const data = stepData[stepNum];
    if (!data) return;

    if (statusText) statusText.innerText = data.title;
    if (progressPercent) progressPercent.innerText = data.percent;
    if (progressFill) progressFill.style.width = data.percent;

    if (terminalBody) {
      terminalBody.innerHTML = '';
      data.logs.forEach((log, index) => {
        setTimeout(() => {
          const line = document.createElement('div');
          line.className = 'term-line';

          let typeClass = '';
          if (log.type === 'highlight') typeClass = 'highlight';
          else if (log.type === 'success') typeClass = 'success';
          else if (log.type === 'warning') typeClass = 'warning';

          if (log.text) {
            line.innerHTML = `<span class="prefix">${log.prefix}</span> <span class="${typeClass}">${log.text}</span>`;
          } else {
            line.innerHTML = `<span class="prefix">${log.prefix}</span>`;
          }
          terminalBody.appendChild(line);
          terminalBody.scrollTop = terminalBody.scrollHeight;
        }, index * 120);
      });
    }
  }

  stepItems.forEach(card => {
    card.addEventListener('click', () => {
      const stepNum = card.dataset.step;
      activateStep(stepNum);
    });
  });

  activateStep(1);

  let currentStep = 1;
  let autoTimer = setInterval(() => {
    currentStep = (currentStep % 6) + 1;
    activateStep(currentStep);
  }, 6000);

  stepItems.forEach(card => {
    card.addEventListener('click', () => {
      clearInterval(autoTimer);
    });
  });
}

/* 3. Glass 3D Parallax Mouse Movement */
function initGlassParallax() {
  const heroCard = document.getElementById('hero-3d-card');
  if (!heroCard) return;

  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const rotX = ((clientY / windowHeight) - 0.5) * -12;
    const rotY = ((clientX / windowWidth) - 0.5) * 12;

    heroCard.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
}

/* 4. Real-World OTG Speed & Time Diagnostics Calculator */
function initDiagnosticsCalculator() {
  const isoSelect = document.getElementById('iso-select');
  const usbSelect = document.getElementById('usb-select');
  const display = document.getElementById('calc-time-display');

  if (!isoSelect || !usbSelect || !display) return;

  function calculateTime() {
    const isoMB = parseFloat(isoSelect.value);
    const effectiveSpeedMBps = parseFloat(usbSelect.value);

    if (!isoMB || !effectiveSpeedMBps) return;

    const rawCopySeconds = isoMB / effectiveSpeedMBps;
    const verificationOverheadSeconds = rawCopySeconds * 0.28;
    const totalSeconds = Math.round(rawCopySeconds + verificationOverheadSeconds);

    if (totalSeconds < 60) {
      display.innerText = `${totalSeconds} sec`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      if (secs === 0) display.innerText = `${mins} min`;
      else display.innerText = `${mins}m ${secs}s`;
    }
  }

  isoSelect.addEventListener('change', calculateTime);
  usbSelect.addEventListener('change', calculateTime);

  calculateTime();
}

/* 5. Appwrite Cloud & PayPal Checkout Controller */
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6a57b885000331609fc8';
const APPWRITE_DATABASE_ID = '6a57b90f0010645478da';
const FN_CREATE_PAYPAL_ORDER = 'create-paypal-order';
const FN_VERIFY_PAYPAL_PAYMENT = 'verify-paypal-payment';

let appwriteClient = null;
let appwriteAccount = null;
let appwriteFunctions = null;
let appwriteDatabases = null;
let activePollInterval = null;
let isVerificationActive = false;

function initAppwriteSDK() {
  if (typeof Appwrite === 'undefined') {
    console.warn('Appwrite Web SDK not loaded');
    return;
  }
  try {
    appwriteClient = new Appwrite.Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);

    appwriteAccount = new Appwrite.Account(appwriteClient);
    appwriteFunctions = new Appwrite.Functions(appwriteClient);
    appwriteDatabases = new Appwrite.Databases(appwriteClient);

    syncRemotePricing();
    checkPayPalReturnParams();
  } catch (err) {
    console.error('Appwrite init error:', err);
  }
}

async function syncRemotePricing() {
  if (!appwriteDatabases) return;
  try {
    const offer = await appwriteDatabases.getDocument(APPWRITE_DATABASE_ID, 'config', 'offer');
    if (offer && offer.futurePrice) {
      const formattedPrice = `$${Number(offer.futurePrice).toFixed(2)} ${offer.currency || 'USD'}`;
      const priceEls = document.querySelectorAll('.card-price, .price-val');
      priceEls.forEach(el => {
        el.innerHTML = `${formattedPrice} <span class="price-period">/ Lifetime</span>`;
      });
    }
  } catch (e) {
    console.log('Using default pricing display');
  }
}

async function ensureAppwriteSession() {
  if (!appwriteAccount) throw new Error('Appwrite SDK unavailable');
  try {
    return await appwriteAccount.get();
  } catch (e) {
    return await appwriteAccount.createAnonymousSession();
  }
}

function broadcastSuccess(data) {
  try {
    localStorage.setItem('bootforge_payment_success', JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
  } catch(e) {}
}

function initTabSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'bootforge_payment_success' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload && payload.data && payload.data.licenseKey) {
          if (activePollInterval) clearInterval(activePollInterval);
          renderSuccessReceipt(payload.data, payload.data.email);
        }
      } catch(err) {}
    }
  });
}

function preventNav(e) {
  e.preventDefault();
  e.returnValue = 'Payment verification in progress. Please do not close or refresh.';
  return e.returnValue;
}

function setNavigationLock(locked) {
  isVerificationActive = locked;
  if (locked) window.addEventListener('beforeunload', preventNav);
  else window.removeEventListener('beforeunload', preventNav);
}

function switchView(targetState) {
  const views = {
    email: document.getElementById('flow-view-email'),
    processing: document.getElementById('flow-view-processing'),
    success: document.getElementById('flow-view-success'),
    owned: document.getElementById('flow-view-owned'),
    failed: document.getElementById('flow-view-failed'),
    pending: document.getElementById('flow-view-pending')
  };

  const modal = document.getElementById('checkout-flow-modal');
  Object.keys(views).forEach(k => {
    if (views[k]) views[k].style.display = (k === targetState) ? 'block' : 'none';
  });
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeModal() {
  if (isVerificationActive) {
    if (!confirm('Payment verification is in progress. Are you sure you want to close?')) return;
  }
  setNavigationLock(false);
  if (activePollInterval) clearInterval(activePollInterval);
  const modal = document.getElementById('checkout-flow-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

function updateProgress(percent, stepText, title = "Processing your payment...", subtitle = "Please do not close or refresh this window.") {
  const bar = document.getElementById('processing-bar-fill');
  const step = document.getElementById('processing-step-text');
  const t = document.getElementById('processing-title');
  const s = document.getElementById('processing-subtitle');
  if (bar) bar.style.width = percent + '%';
  if (step) step.innerText = stepText;
  if (t) t.innerText = title;
  if (s) s.innerText = subtitle;
}

function renderSuccessReceipt(data, fallbackEmail) {
  setNavigationLock(false);
  const rOrder = document.getElementById('receipt-order-id');
  const rPay = document.getElementById('receipt-payment-id');
  const rAmt = document.getElementById('receipt-amount');
  const rDate = document.getElementById('receipt-date');
  const rEmail = document.getElementById('receipt-email');
  const keyEl = document.getElementById('minted-license-key');

  if (rOrder) rOrder.innerText = data.orderId || '-';
  if (rPay) rPay.innerText = data.paymentId || ('CAP-' + (data.orderId || 'SUCCESS'));
  if (rAmt) rAmt.innerText = `${data.amount || '2.00'} ${data.currency || 'USD'}`;
  if (rDate) rDate.innerText = data.purchaseDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  if (rEmail) rEmail.innerText = data.email || fallbackEmail || 'Registered Email';
  if (keyEl && data.licenseKey) keyEl.innerText = data.licenseKey;

  switchView('success');
}

function renderAlreadyOwned(data) {
  setNavigationLock(false);
  const keyLast4 = data.keyLast4 || (data.licenseKey ? data.licenseKey.slice(-4) : 'PRO');
  const ownedEl = document.getElementById('owned-license-key');
  if (ownedEl) ownedEl.innerText = `BOOTFORGE-****-****-****-${keyLast4}`;
  switchView('owned');
}

function renderFailure(errorMsg) {
  setNavigationLock(false);
  const detail = document.getElementById('failed-error-detail');
  if (detail) detail.innerText = errorMsg || 'Your payment could not be completed. No charges were made.';
  switchView('failed');
}

async function verifyPaymentExecution(orderId) {
  if (!appwriteFunctions || !orderId) return null;
  try {
    const exec = await appwriteFunctions.createExecution(
      FN_VERIFY_PAYPAL_PAYMENT,
      JSON.stringify({ orderId: orderId })
    );
    let data = {};
    try { data = JSON.parse(exec.responseBody || '{}'); } catch(e) {}
    return data;
  } catch(e) {
    return null;
  }
}

function initPayPalCheckout() {
  const buyBtn = document.getElementById('paypal-checkout-btn');
  const modalClose = document.getElementById('flow-modal-close');
  const successCloseBtn = document.getElementById('success-close-btn');
  const ownedCloseBtn = document.getElementById('owned-close-btn');
  const failedRetryBtn = document.getElementById('failed-retry-btn');
  const cancelProcessingBtn = document.getElementById('cancel-processing-btn');
  const emailForm = document.getElementById('checkout-email-form');
  const buyerEmailInput = document.getElementById('buyer-email-input');
  const submitBtn = document.getElementById('email-form-submit-btn');
  const copyKeyBtn = document.getElementById('copy-license-key-btn');
  const copyOwnedKeyBtn = document.getElementById('copy-owned-key-btn');

  if (buyBtn) {
    buyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('email');
      if (buyerEmailInput) buyerEmailInput.focus();
    });
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);
  if (ownedCloseBtn) ownedCloseBtn.addEventListener('click', closeModal);

  if (failedRetryBtn) {
    failedRetryBtn.addEventListener('click', () => {
      switchView('email');
    });
  }

  if (cancelProcessingBtn) {
    cancelProcessingBtn.addEventListener('click', () => {
      if (activePollInterval) clearInterval(activePollInterval);
      setNavigationLock(false);
      renderFailure('Payment session was cancelled. No charges were made.');
    });
  }

  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailVal = buyerEmailInput ? buyerEmailInput.value.trim() : '';
      if (!emailVal) return;

      submitBtn.disabled = true;
      setNavigationLock(true);
      switchView('processing');
      updateProgress(20, 'Securing Appwrite Licensing Session...');

      try {
        await ensureAppwriteSession();

        updateProgress(40, 'Opening PayPal Checkout Gateway...');
        const webReturnUrl = window.location.origin + window.location.pathname;

        const exec = await appwriteFunctions.createExecution(
          FN_CREATE_PAYPAL_ORDER,
          JSON.stringify({
            email: emailVal,
            returnUrl: webReturnUrl,
            cancelUrl: webReturnUrl
          })
        );

        let data = {};
        try { data = JSON.parse(exec.responseBody || '{}'); } catch(err) {}

        if (!data.ok || !data.approveUrl) {
          throw new Error(data.error || 'Could not start PayPal checkout session.');
        }

        updateProgress(60, 'Awaiting PayPal Approval...', 'Complete Approval in PayPal', 'A pop-up window has been opened for PayPal login.');

        let popup = null;
        try {
          popup = window.open(data.approveUrl, 'PayPalCheckout', 'width=600,height=700');
        } catch(e) {}

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          window.location.href = data.approveUrl;
          return;
        }

        let isCompleted = false;
        let pollCount = 0;

        if (activePollInterval) clearInterval(activePollInterval);

        activePollInterval = setInterval(async () => {
          pollCount++;
          if (isCompleted || pollCount > 150) { // 120 seconds max
            clearInterval(activePollInterval);
            if (!isCompleted) {
              renderFailure('Payment verification timed out. If you completed payment, check your email or refresh.');
            }
            return;
          }

          const result = await verifyPaymentExecution(data.orderId);

          if (result && result.ok) {
            isCompleted = true;
            clearInterval(activePollInterval);
            updateProgress(100, 'Payment Verified! Minting License Key...', 'Payment Verified!', 'Minting lifetime key and generating invoice...');
            broadcastSuccess(result);
            try { if (popup && !popup.closed) popup.close(); } catch(e) {}

            setTimeout(() => {
              if (result.alreadyIssued) renderAlreadyOwned(result);
              else renderSuccessReceipt(result, emailVal);
            }, 400);
          } else if (result && result.pending) {
            // Still waiting for buyer completion in PayPal — stay on Step 3 cleanly!
          } else if (popup && popup.closed) {
            // Popup closed by user — perform one final grace check after 1 second
            clearInterval(activePollInterval);
            setTimeout(async () => {
              const finalCheck = await verifyPaymentExecution(data.orderId);
              if (finalCheck && finalCheck.ok) {
                broadcastSuccess(finalCheck);
                if (finalCheck.alreadyIssued) renderAlreadyOwned(finalCheck);
                else renderSuccessReceipt(finalCheck, emailVal);
              } else {
                renderFailure('PayPal checkout window was closed before completion. No charges were made.');
              }
            }, 1000);
          }
        }, 1000);

      } catch (err) {
        submitBtn.disabled = false;
        setNavigationLock(false);
        switchView('email');
        const errBox = document.getElementById('email-error-box');
        const errTxt = document.getElementById('email-error-text');
        if (errBox && errTxt) {
          errTxt.innerText = err.message || 'PayPal Checkout failed. Please try again.';
          errBox.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function handleCopy(btnEl, targetEl) {
    if (!btnEl || !targetEl) return;
    btnEl.addEventListener('click', () => {
      const text = targetEl.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const origText = btnEl.innerHTML;
        btnEl.innerHTML = `<span>✓ Copied to Clipboard!</span>`;
        btnEl.style.background = '#10B981';
        btnEl.style.borderColor = '#10B981';
        setTimeout(() => {
          btnEl.innerHTML = origText;
          btnEl.style.background = '';
          btnEl.style.borderColor = '';
        }, 2000);
      });
    });
  }

  handleCopy(copyKeyBtn, document.getElementById('minted-license-key'));
  handleCopy(copyOwnedKeyBtn, document.getElementById('owned-license-key'));
}

async function checkPayPalReturnParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || urlParams.get('orderId');
  if (token && appwriteFunctions) {
    try {
      await ensureAppwriteSession();
      const result = await verifyPaymentExecution(token);
      if (result && result.ok) {
        broadcastSuccess(result);
        if (result.alreadyIssued) renderAlreadyOwned(result);
        else renderSuccessReceipt(result, result.email);
      }
    } catch (e) {
      console.error('Auto verify on return error:', e);
    }
  }
}

/* 6. Navigation & Settings Drawer Controller */
function initMobileMenu() {
  const gearBtn = document.getElementById('nav-btn-icon');
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!gearBtn || !drawer) return;

  const mobileLinks = drawer.querySelectorAll('.mobile-nav-link, .mobile-cta-btn');

  function openMenu() {
    drawer.classList.add('open');
    gearBtn.classList.add('gear-active');
    gearBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    drawer.classList.remove('open');
    gearBtn.classList.remove('gear-active');
    gearBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function toggleMenu(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (drawer.classList.contains('open')) closeMenu();
    else openMenu();
  }

  gearBtn.addEventListener('click', toggleMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open')) {
      const isClickInsideDrawer = drawer.contains(e.target);
      const isClickOnGear = gearBtn.contains(e.target);
      if (!isClickInsideDrawer && !isClickOnGear) closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && drawer.classList.contains('open')) closeMenu();
  });
}
