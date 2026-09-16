let originalTitle = "";

export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function notifyTurn(gameCode: string) {
  if (typeof window === "undefined") return;

  // 1. Dynamic Tab Title alert
  if (!originalTitle) {
    originalTitle = document.title;
  }
  document.title = `(1) Your Turn! — Chess Room (${gameCode})`;

  // 2. Desktop Web Notification (if permitted and tab is inactive)
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    try {
      const notification = new Notification("Chess Room — Your Turn!", {
        body: `It's your turn in game ${gameCode}`,
        icon: "/favicon.ico",
        tag: `chess-turn-${gameCode}`,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      /* ignore notification error */
    }
  }
}

export function resetTitle() {
  if (typeof window === "undefined") return;
  if (originalTitle) {
    document.title = originalTitle;
    originalTitle = "";
  }
}
