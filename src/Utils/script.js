/* ===== Focus Setup Page Logic (index.html) ===== */
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const timeButtons = document.querySelectorAll(".duration-btn");
const focusSettingPanel = document.getElementById("focusSettingPanel");
const focusSettingToggle = document.getElementById("focusSettingToggle");
const doneBtn = document.getElementById("doneBtn");
const modeButtons = document.querySelectorAll(".mode-btn");

let selectedTime = 10;

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

if (timerDisplay && timeButtons.length) {
  timeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      timeButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      selectedTime = Number(button.dataset.time);
      timerDisplay.textContent = formatTime(selectedTime * 60);
    });
  });
}

if (focusSettingToggle && focusSettingPanel) {
  focusSettingToggle.addEventListener("click", () => {
    const isOpen = focusSettingPanel.classList.toggle("open");
    focusSettingToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (doneBtn && focusSettingPanel && focusSettingToggle) {
  doneBtn.addEventListener("click", () => {
    focusSettingPanel.classList.remove("open");
    focusSettingToggle.setAttribute("aria-expanded", "false");
  });
}

if (modeButtons.length) {
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((button) => button.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    sessionStorage.setItem("focusDurationSeconds", String(selectedTime * 60));
    window.location.href = "start.html";
  });
}

/* ===== Start Focus Session Logic (start.html) ===== */
const startTimer = document.getElementById("startTimer");
const startTimerRing = document.getElementById("startTimerRing");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const endBtn = document.getElementById("endBtn");

if (startTimer && startTimerRing && pauseBtn && resetBtn && endBtn) {
  const initialDuration =
    Number(sessionStorage.getItem("focusDurationSeconds")) || 450;
  let totalSeconds = initialDuration;
  let isRunning = true;
  let intervalId = null;

  const updateStartScreen = () => {
    startTimer.textContent = formatTime(totalSeconds);
    const progress = ((initialDuration - totalSeconds) / initialDuration) * 360;
    startTimerRing.style.setProperty(
      "--progress",
      `${Math.max(0, progress)}deg`,
    );
  };

  const startCountdown = () => {
    intervalId = setInterval(() => {
      if (!isRunning) return;

      totalSeconds -= 1;
      updateStartScreen();

      if (totalSeconds <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        isRunning = false;
      }
    }, 1000);
  };

  pauseBtn.addEventListener("click", () => {
    isRunning = !isRunning;
    pauseBtn.innerHTML = isRunning
      ? '<ion-icon name="pause-circle-outline"></ion-icon>'
      : '<ion-icon name="play-circle-outline"></ion-icon>';
  });

  resetBtn.addEventListener("click", () => {
    totalSeconds = initialDuration;
    isRunning = true;
    pauseBtn.innerHTML = '<ion-icon name="pause-circle-outline"></ion-icon>';
    updateStartScreen();
  });

  endBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  updateStartScreen();
  startCountdown();
}
