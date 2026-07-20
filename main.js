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
});

/* 1. GSAP & ScrollTrigger Motion */
function initGSAPAnimations() {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Section Reveal
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

    // Glass Cards Stagger Entrance
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

    // 4-Step Process Cards Reveal
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

    // APK Download Panel Entrance
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

/* 2. Interactive Boot Sequence Simulator (Real App Log Protocol) */
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
      if (card.dataset.step == stepNum) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    const data = stepData[stepNum];
    if (!data) return;

    statusText.innerText = data.title;
    progressPercent.innerText = data.percent;
    progressFill.style.width = data.percent;

    // Render terminal lines
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

    // Real world formula: Copy time + ~28% verification pass overhead
    const rawCopySeconds = isoMB / effectiveSpeedMBps;
    const verificationOverheadSeconds = rawCopySeconds * 0.28;
    const totalSeconds = Math.round(rawCopySeconds + verificationOverheadSeconds);

    if (totalSeconds < 60) {
      display.innerText = `${totalSeconds} sec`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      if (secs === 0) {
        display.innerText = `${mins} min`;
      } else {
        display.innerText = `${mins}m ${secs}s`;
      }
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
      const priceEls = document.querySelectorAll('.card-price');
      priceEls.forEach(el => {
        el.innerHTML = `${formattedPrice} <span style="font-size:1rem; font-weight:400; color:var(--text-secondary);">/ Lifetime</span>`;
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

function initPayPalCheckout() {
  const buyBtn = document.getElementById('paypal-checkout-btn');
  const emailModal = document.getElementById('checkout-email-modal');
  const emailModalClose = document.getElementById('email-modal-close');
  const emailForm = document.getElementById('checkout-email-form');
  const buyerEmailInput = document.getElementById('buyer-email-input');
  const submitBtn = document.getElementById('email-form-submit-btn');

  const successModal = document.getElementById('checkout-success-modal');
  const successModalClose = document.getElementById('success-modal-close');
  const mintedKeyEl = document.getElementById('minted-license-key');
  const copyKeyBtn = document.getElementById('copy-license-key-btn');

  const errorBox = document.getElementById('modal-error-box');
  const errorText = document.getElementById('modal-error-text');

  function showModalError(msg) {
    if (errorBox && errorText) {
      errorText.innerText = msg;
      errorBox.style.display = 'block';
    }
  }

  function hideModalError() {
    if (errorBox) errorBox.style.display = 'none';
  }

  function openEmailModal() {
    hideModalError();
    emailModal.classList.add('open');
    emailModal.setAttribute('aria-hidden', 'false');
    if (buyerEmailInput) buyerEmailInput.focus();
  }

  function closeEmailModal() {
    hideModalError();
    emailModal.classList.remove('open');
    emailModal.setAttribute('aria-hidden', 'true');
  }

  function openSuccessModal(key) {
    if (mintedKeyEl && key) mintedKeyEl.innerText = key;
    successModal.classList.add('open');
    successModal.setAttribute('aria-hidden', 'false');
  }

  function closeSuccessModal() {
    successModal.classList.remove('open');
    successModal.setAttribute('aria-hidden', 'true');
  }

  buyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openEmailModal();
  });

  if (emailModalClose) emailModalClose.addEventListener('click', closeEmailModal);
  if (successModalClose) successModalClose.addEventListener('click', closeSuccessModal);

  emailModal.addEventListener('click', (e) => {
    if (e.target === emailModal) closeEmailModal();
  });
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) closeSuccessModal();
  });

  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideModalError();
      const emailVal = buyerEmailInput ? buyerEmailInput.value.trim() : '';
      if (!emailVal) return;

      const origBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Opening PayPal Order...</span>`;

      try {
        await ensureAppwriteSession();

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
          throw new Error(data.error || 'Could not start PayPal checkout.');
        }

        closeEmailModal();
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;

        const popup = window.open(data.approveUrl, 'PayPalCheckout', 'width=600,height=700');
        if (!popup || popup.closed) {
          window.location.href = data.approveUrl;
          return;
        }

        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          if (popup.closed || pollCount > 120) {
            clearInterval(pollInterval);
            await verifyAndDeliverLicense(data.orderId, openSuccessModal);
          }
        }, 2500);

      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
        const msg = err.message === 'Failed to fetch' 
          ? 'Licensing server connection failed (CORS or network error). Please ensure bootforge.me is registered in Appwrite platforms.' 
          : (err.message || 'PayPal Checkout failed. Please try again.');
        showModalError(msg);
      }
    });
  }

  if (copyKeyBtn && mintedKeyEl) {
    copyKeyBtn.addEventListener('click', () => {
      const key = mintedKeyEl.innerText;
      navigator.clipboard.writeText(key).then(() => {
        const origText = copyKeyBtn.innerHTML;
        copyKeyBtn.innerHTML = `<span>✓ Copied to Clipboard!</span>`;
        copyKeyBtn.style.background = '#10B981';
        copyKeyBtn.style.borderColor = '#10B981';
        setTimeout(() => {
          copyKeyBtn.innerHTML = origText;
          copyKeyBtn.style.background = '';
          copyKeyBtn.style.borderColor = '';
        }, 2000);
      });
    });
  }
}

async function verifyAndDeliverLicense(orderId, successCallback) {
  if (!appwriteFunctions || !orderId) return;
  try {
    const exec = await appwriteFunctions.createExecution(
      FN_VERIFY_PAYPAL_PAYMENT,
      JSON.stringify({ orderId: orderId })
    );
    let data = {};
    try { data = JSON.parse(exec.responseBody || '{}'); } catch(e) {}

    if (data.ok && (data.licenseKey || data.alreadyIssued)) {
      const key = data.licenseKey || 'BOOTFORGE-PRO-ACTIVE';
      if (successCallback) successCallback(key);
    }
  } catch (err) {
    console.error('Verification error:', err);
  }
}

async function checkPayPalReturnParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || urlParams.get('orderId');
  if (token && appwriteFunctions) {
    try {
      await ensureAppwriteSession();
      await verifyAndDeliverLicense(token, (key) => {
        const successModal = document.getElementById('checkout-success-modal');
        const mintedKeyEl = document.getElementById('minted-license-key');
        if (mintedKeyEl && key) mintedKeyEl.innerText = key;
        if (successModal) {
          successModal.classList.add('open');
          successModal.setAttribute('aria-hidden', 'false');
        }
      });
    } catch (e) {
      console.error('Auto verify on return error:', e);
    }
  }
}

/* 6. Navigation & Settings Drawer Controller (Single Control Button: Settings Gear) */
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
    if (drawer.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  gearBtn.addEventListener('click', toggleMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open')) {
      const isClickInsideDrawer = drawer.contains(e.target);
      const isClickOnGear = gearBtn.contains(e.target);
      if (!isClickInsideDrawer && !isClickOnGear) {
        closeMenu();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && drawer.classList.contains('open')) {
      closeMenu();
    }
  });
}
