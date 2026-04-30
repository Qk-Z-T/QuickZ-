// src/student/features/exam-taking/exam.timer.js
// Standalone exam timer logic

export class ExamTimer {
  constructor(durationSeconds, onTick, onTimeUp) {
    this.remaining = durationSeconds;
    this.onTick = onTick;
    this.onTimeUp = onTimeUp;
    this.intervalId = null;
  }

  start() {
    this.intervalId = setInterval(() => {
      this.remaining--;
      if (this.onTick) this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        if (this.onTimeUp) this.onTimeUp();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getFormattedTime() {
    const mins = Math.floor(this.remaining / 60);
    const secs = this.remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export function updateTimerDisplay(seconds, elementId = 'tm') {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerText = `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,'0')}`;
  }
}
