/* ==========================================================================
   BOOTFORGE INTERACTIVE ENGINE v4.0.0
   Aesthetics: Red Crimson Glassmorphism & Soft Charcoal Neumorphism
   Pure Product Showcase & Direct APK Download Portal Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initGSAPAnimations();
  initBootSimulator();
  initGlassParallax();
  initDiagnosticsCalculator();
  initSmoothScroll();
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

    gsap.from('.hero-body, .neu-pill-btn', {
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

    gsap.from('.download-portal-card', {
      scrollTrigger: {
        trigger: '.download-portal-card',
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
        "[0.000s] [KERNEL] Requesting Android USB Host Permission...",
        "[0.042s] [USB] VID: 0x0781 PID: 0x5581 (SanDisk Ultra 3.2Gen1)",
        "[0.110s] [SCSI] Claimed Bulk-Only Transport interface [Endpoint 0x02 OUT / 0x81 IN]",
        "[0.180s] [SCSI] INQUIRY ok: Block size 512 bytes, Sector count 30,642,176"
      ]
    },
    2: {
      title: "Step 02 / ISO Analysis & Media Mode",
      percent: "33%",
      logs: [
        "[0.210s] [ISO] Mounting Win11_24H2_English_x64.iso (7.89 GB)",
        "[0.340s] [UDF] Primary Volume Descriptor parsed successfully",
        "[0.420s] [BOOT] Found /boot/etfsboot.com & /efi/boot/bootx64.efi",
        "[0.510s] [WIM] /sources/install.wim size: 4.82 GB (>4GB FAT32 threshold detected)"
      ]
    },
    3: {
      title: "Step 03 / Dual-Partition Planning",
      percent: "50%",
      logs: [
        "[0.580s] [LAYOUT] Planning GPT Dual-Partition Scheme",
        "[0.640s] [PART 1] FAT32 EFI Boot Partition (1.01 GB, Cluster 4KB)",
        "[0.710s] [PART 2] exFAT Data Partition (13.60 GB, Cluster 128KB)",
        "[0.800s] [BYPASS] Automated TPM 2.0 / SecureBoot / 8GB RAM check bypass injected"
      ]
    },
    4: {
      title: "Step 04 / File Copy & Write Stream",
      percent: "66%",
      logs: [
        "[0.850s] [WRITE] Streaming ISO blocks via libusb SCSI direct transport...",
        "[2.100s] [FAT32] /efi/microsoft/boot/ resources written",
        "[8.400s] [exFAT] /sources/install.wim written (4.82 GB @ 18.4 MB/s)",
        "[14.20s] [SYNC] Flushing kernel disk write buffers..."
      ]
    },
    5: {
      title: "Step 05 / Filesystem Verification",
      percent: "83%",
      logs: [
        "[14.30s] [VERIFY] Initiating 100% Bit-by-Bit SHA-256 verification pass...",
        "[16.10s] [HASH] ISO header checksum: 4a2e8c9f...",
        "[17.80s] [HASH] USB sector checksum: 4a2e8c9f...",
        "[18.00s] [PASS] 100% Integrity Match Verified"
      ]
    },
    6: {
      title: "Step 06 / UEFI Boot Layout Ready",
      percent: "100%",
      logs: [
        "[18.05s] [SCSI] Releasing USB Host interface handle",
        "[18.10s] [STATUS] Bootable USB Ready!",
        "[18.12s] [INFO] Safe to disconnect OTG adapter and boot target PC."
      ]
    }
  };

  function renderLogs(stepNum) {
    if (!stepData[stepNum] || !terminalBody) return;
    const data = stepData[stepNum];

    if (statusText) statusText.innerText = data.title;
    if (progressPercent) progressPercent.innerText = data.percent;
    if (progressFill) progressFill.style.width = data.percent;

    terminalBody.innerHTML = '';
    data.logs.forEach((logLine, i) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'term-line';
      lineEl.style.opacity = '0';
      lineEl.innerText = logLine;
      terminalBody.appendChild(lineEl);

      setTimeout(() => {
        lineEl.style.opacity = '1';
      }, i * 60);
    });
  }

  stepItems.forEach(item => {
    item.addEventListener('click', () => {
      stepItems.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const step = item.getAttribute('data-step');
      renderLogs(step);
    });
  });

  renderLogs(1);
}

/* 3. 3D Glass Card Parallax Hover */
function initGlassParallax() {
  const card = document.getElementById('hero-3d-card');
  if (!card) return;

  const container = card.parentElement;
  if (!container) return;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = (-y / rect.height) * 12;
    const rotY = (x / rect.width) * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  container.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
}

/* 4. OTG Diagnostics & Speed Calculator */
function initDiagnosticsCalculator() {
  const isoSelect = document.getElementById('iso-select');
  const usbSelect = document.getElementById('usb-select');
  const timeDisplay = document.getElementById('calc-time-display');

  if (!isoSelect || !usbSelect || !timeDisplay) return;

  function calculate() {
    const isoMb = parseFloat(isoSelect.value) || 7890;
    const speedMbs = parseFloat(usbSelect.value) || 11.7;

    const totalSeconds = Math.round(isoMb / speedMbs);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timeDisplay.innerText = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
  }

  isoSelect.addEventListener('change', calculate);
  usbSelect.addEventListener('change', calculate);
  calculate();
}

/* 5. Mobile Navigation Drawer */
function initMobileMenu() {
  const navBtnIcon = document.getElementById('nav-btn-icon');
  const drawer = document.getElementById('mobile-nav-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-cta-btn');

  if (!navBtnIcon || !drawer) return;

  function toggleMenu() {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      navBtnIcon.setAttribute('aria-expanded', 'false');
    } else {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      navBtnIcon.setAttribute('aria-expanded', 'true');
    }
  }

  navBtnIcon.addEventListener('click', toggleMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      navBtnIcon.setAttribute('aria-expanded', 'false');
    });
  });
}

/* 6. Smooth Scroll Links */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
